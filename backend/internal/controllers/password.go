package controllers

import (
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
	"github.com/danilo/edp_gestao_utilizadores/internal/models"
	"github.com/danilo/edp_gestao_utilizadores/internal/utils"
	"github.com/gofiber/fiber/v2"
)

// ForgotPasswordRequest representa a solicitação de recuperação de senha
type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

// ResetPasswordRequest representa a solicitação de redefinição de senha
type ResetPasswordRequest struct {
	Token    string `json:"token" validate:"required"`
	Password string `json:"password" validate:"required,min=6"`
}

// ChangePasswordRequest representa a solicitação de alteração de senha pelo próprio utilizador
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=6"`
}

// ForgotPassword inicia o processo de recuperação de senha
func ForgotPassword(c *fiber.Ctx) error {
	var req ForgotPasswordRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Formato de solicitação inválido",
			"erro":     err.Error(),
		})
	}

	// Verificar se o email existe
	var user models.Utilizador
	result := config.DB.Where("email = ?", req.Email).First(&user)
	if result.Error != nil {
		// Não revelar que o email não existe por segurança
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"sucesso":  true,
			"mensagem": "Se o email estiver registado, receberá instruções para redefinir a senha",
		})
	}

	// Verificar se o utilizador está ativo
	if user.Estado != "Ativo" {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"sucesso":  true,
			"mensagem": "Se o email estiver registado, receberá instruções para redefinir a senha",
		})
	}

	// Gerar token aleatório
	token, err := generateRandomToken(32)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao gerar token de recuperação",
			"erro":     err.Error(),
		})
	}

	// Definir validade do token (24 horas)
	expiresAt := time.Now().Add(24 * time.Hour)

	// Invalidar tokens existentes para este utilizador
	config.DB.Model(&models.TokenRecuperacao{}).
		Where("utilizador_id = ? AND usado = ?", user.ID, false).
		Update("usado", true)

	// Criar novo token de recuperação
	recoveryToken := models.TokenRecuperacao{
		UtilizadorID: user.ID,
		Token:        token,
		ExpiraEm:     expiresAt,
		Usado:        false,
	}

	if err := config.DB.Create(&recoveryToken).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao criar token de recuperação",
			"erro":     err.Error(),
		})
	}

	// Registrar log de auditoria
	models.RegistrarAuditoria(
		0, // Sistema
		"Sistema",
		"Solicitar Recuperação",
		"Senha",
		c.IP(),
		map[string]interface{}{
			"utilizador_id": user.ID,
			"email":         user.Email,
		},
	)

	// Em produção, enviaria um email com o link contendo o token
	// Para fins de desenvolvimento, retornamos o token na resposta
	// TODO: Implementar envio de email

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Se o email estiver registado, receberá instruções para redefinir a senha",
		"dev_info": fiber.Map{ // Apenas para desenvolvimento
			"token": token,
			"link":  "http://localhost:5173/reset-password?token=" + token,
		},
	})
}

// ResetPassword redefine a senha usando um token de recuperação
func ResetPassword(c *fiber.Ctx) error {
	var req ResetPasswordRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Formato de solicitação inválido",
			"erro":     err.Error(),
		})
	}

	// Verificar se o token existe e é válido
	var recoveryToken models.TokenRecuperacao
	result := config.DB.Where("token = ? AND usado = ? AND expira_em > ?",
		req.Token, false, time.Now()).First(&recoveryToken)

	if result.Error != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Token inválido ou expirado",
		})
	}

	// Buscar utilizador
	var user models.Utilizador
	if err := config.DB.First(&user, recoveryToken.UtilizadorID).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao buscar utilizador",
			"erro":     err.Error(),
		})
	}

	// Gerar hash da nova senha
	senhaHash, err := utils.HashPassword(req.Password)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao processar nova senha",
			"erro":     err.Error(),
		})
	}

	// Atualizar senha do utilizador
	user.SenhaHash = senhaHash
	user.TentativasLogin = 0

	if err := config.DB.Save(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao atualizar senha",
			"erro":     err.Error(),
		})
	}

	// Marcar token como usado
	recoveryToken.Usado = true
	config.DB.Save(&recoveryToken)

	// Invalidar todas as sessões do utilizador
	models.InvalidateAllUserSessions(user.ID)
	config.DeleteAllUserRefreshTokens(user.ID)

	// Registrar log de auditoria
	models.RegistrarAuditoria(
		user.ID,
		user.Nome,
		"Redefinir Senha",
		"Senha",
		c.IP(),
		map[string]interface{}{
			"utilizador_id": user.ID,
			"email":         user.Email,
		},
	)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Senha redefinida com sucesso",
	})
}

// ChangePassword altera a senha de um utilizador autenticado
func ChangePassword(c *fiber.Ctx) error {
	var req ChangePasswordRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Formato de solicitação inválido",
			"erro":     err.Error(),
		})
	}

	// Obter ID do utilizador do contexto
	userID := c.Locals("user_id").(uint)

	// Buscar utilizador
	var user models.Utilizador
	if err := config.DB.First(&user, userID).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao buscar utilizador",
			"erro":     err.Error(),
		})
	}

	// Verificar senha atual
	if !utils.VerifyPassword(req.CurrentPassword, user.SenhaHash) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Senha atual incorreta",
		})
	}

	// Gerar hash da nova senha
	senhaHash, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao processar nova senha",
			"erro":     err.Error(),
		})
	}

	// Atualizar senha do utilizador
	user.SenhaHash = senhaHash

	if err := config.DB.Save(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao atualizar senha",
			"erro":     err.Error(),
		})
	}

	// Registrar log de auditoria
	models.RegistrarAuditoria(
		user.ID,
		user.Nome,
		"Alterar Senha",
		"Senha",
		c.IP(),
		map[string]interface{}{
			"utilizador_id": user.ID,
		},
	)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Senha alterada com sucesso",
	})
}

// Funções auxiliares

// generateRandomToken gera um token aleatório de tamanho especificado
func generateRandomToken(length int) (string, error) {
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
