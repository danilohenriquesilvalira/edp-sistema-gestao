package controllers

import (
	"net/http"
	"time"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
	"github.com/danilo/edp_gestao_utilizadores/internal/models"
	"github.com/danilo/edp_gestao_utilizadores/internal/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// LoginRequest representa os dados de login enviados pelo utilizador
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// LoginResponse representa a resposta após o login bem-sucedido
type LoginResponse struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	ExpiresIn    int          `json:"expires_in"` // Em segundos
	User         UserResponse `json:"user"`
}

// UserResponse representa os dados do utilizador retornados na resposta
type UserResponse struct {
	ID         uint   `json:"id"`
	Nome       string `json:"nome"`
	Email      string `json:"email"`
	Perfil     string `json:"perfil"`
	Estado     string `json:"estado"`
	FotoPerfil string `json:"foto_perfil"`
}

// RefreshRequest representa os dados para atualizar o token
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// Login processa a autenticação do utilizador
func Login(c *fiber.Ctx) error {
	// Parsear dados da solicitação
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Formato de solicitação inválido",
			"erro":     err.Error(),
		})
	}

	// Buscar utilizador por email
	user, err := models.GetUserByEmail(req.Email)
	if err != nil {
		// Não revelar que o email não existe por segurança
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Credenciais inválidas",
		})
	}

	// Verificar se o utilizador está ativo
	if user.Estado != "Ativo" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Conta inativa. Contacte o administrador.",
		})
	}

	// Verificar senha
	if !utils.VerifyPassword(req.Password, user.SenhaHash) {
		// Incrementar contagem de tentativas falhas
		models.UpdateUserLoginStats(user.ID, false)

		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Credenciais inválidas",
		})
	}

	// Atualizar último login e resetar tentativas
	models.UpdateUserLoginStats(user.ID, true)

	// Registrar log de auditoria
	userIP := c.IP()
	models.RegistrarAuditoria(
		user.ID,
		user.Nome,
		"Login",
		"Autenticação",
		userIP,
		map[string]interface{}{
			"user_agent": string(c.Request().Header.UserAgent()),
		},
	)

	// Gerar tokens JWT
	accessToken, accessExpiry, err := utils.GenerateAccessToken(user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao gerar token de acesso",
			"erro":     err.Error(),
		})
	}

	refreshToken, refreshExpiry, err := utils.GenerateRefreshToken(user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao gerar token de atualização",
			"erro":     err.Error(),
		})
	}

	// Extrair informações do refresh token para obter o token ID
	claims := jwt.MapClaims{}
	_, err = jwt.ParseWithClaims(refreshToken, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(utils.GetJWTSecret()), nil
	})

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao processar token",
			"erro":     err.Error(),
		})
	}

	// Obter token ID das claims com verificação adequada
	sessionIDRaw, exists := claims["session_id"]
	if !exists {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro na geração do token: ID de sessão ausente",
		})
	}

	sessionID, ok := sessionIDRaw.(string)
	if !ok || sessionID == "" {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro na geração do token: formato de ID inválido",
		})
	}

	// Criar sessão
	session := models.Sessao{
		UtilizadorID: user.ID,
		Token:        refreshToken, // Guardar o refresh token na sessão
		IP:           userIP,
		Dispositivo:  utils.ExtractDeviceInfo(string(c.Request().Header.UserAgent())),
		UserAgent:    string(c.Request().Header.UserAgent()),
		ExpiraEm:     refreshExpiry,
	}

	if err := models.CreateSession(&session); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao criar sessão",
			"erro":     err.Error(),
		})
	}

	// Salvar refresh token no Redis (se disponível)
	// Usar a função atualizada que não retorna erro mesmo se Redis não estiver disponível
	config.SaveRefreshToken(user.ID, sessionID, refreshToken, time.Until(refreshExpiry))

	// Atualizar status do utilizador como online
	if err := models.AtualizarStatusUtilizador(
		user.ID,
		true,
		c.IP(),
		utils.ExtractDeviceInfo(string(c.Request().Header.UserAgent())),
	); err != nil {
		// Apenas logar o erro, não falhar o login
		// (log em ambiente de produção)
		// log.Printf("Erro ao atualizar status do utilizador: %v", err)
	}

	// Retornar resposta
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados": LoginResponse{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			ExpiresIn:    int(time.Until(accessExpiry).Seconds()),
			User: UserResponse{
				ID:         user.ID,
				Nome:       user.Nome,
				Email:      user.Email,
				Perfil:     user.Perfil,
				Estado:     user.Estado,
				FotoPerfil: user.FotoPerfil,
			},
		},
	})
}

// RefreshToken atualiza o token de acesso usando um refresh token
func RefreshToken(c *fiber.Ctx) error {
	// Parsear dados da solicitação
	var req RefreshRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Formato de solicitação inválido",
			"erro":     err.Error(),
		})
	}

	// Validar o refresh token
	token, err := jwt.Parse(req.RefreshToken, func(token *jwt.Token) (interface{}, error) {
		return []byte(utils.GetJWTSecret()), nil
	})

	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Token inválido",
			"erro":     err.Error(),
		})
	}

	// Verificar claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Token inválido",
		})
	}

	// Extrair ID do utilizador com verificação adequada
	userIDRaw, exists := claims["sub"]
	if !exists {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Token inválido: ID do utilizador ausente",
		})
	}

	// Converter ID para uint com tratamento de tipos
	var userID uint
	switch v := userIDRaw.(type) {
	case float64:
		userID = uint(v)
	case int:
		userID = uint(v)
	case uint:
		userID = v
	default:
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Token inválido: formato de ID incorreto",
		})
	}

	// Extrair ID da sessão com verificação adequada
	sessionIDRaw, exists := claims["session_id"]
	if !exists {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Token inválido: ID de sessão ausente",
		})
	}

	sessionID, ok := sessionIDRaw.(string)
	if !ok || sessionID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Token inválido: formato de ID de sessão incorreto",
		})
	}

	// Verificar token no Redis (se disponível)
	storedToken, err := config.GetRefreshToken(userID, sessionID)
	if err == nil && storedToken != req.RefreshToken {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Token de atualização inválido",
		})
	}

	// Verificar se a sessão existe (pelo token em vez do ID)
	session, err := models.GetSessionByToken(req.RefreshToken)
	if err != nil || session.UtilizadorID != userID || session.ExpiraEm.Before(time.Now()) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Sessão inválida ou expirada",
		})
	}

	// Buscar utilizador
	user, err := models.GetUserByID(userID)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Utilizador não encontrado",
		})
	}

	// Verificar se o utilizador está ativo
	if user.Estado != "Ativo" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Conta inativa. Contacte o administrador.",
		})
	}

	// Gerar novo access token
	accessToken, accessExpiry, err := utils.GenerateAccessToken(user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao gerar novo token de acesso",
			"erro":     err.Error(),
		})
	}

	// Atualizar status do utilizador como online
	if err := models.AtualizarStatusUtilizador(
		userID,
		true,
		c.IP(),
		utils.ExtractDeviceInfo(string(c.Request().Header.UserAgent())),
	); err != nil {
		// Apenas logar o erro, não falhar o refresh
		// (log em ambiente de produção)
	}

	// Retornar resposta
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados": fiber.Map{
			"access_token": accessToken,
			"expires_in":   int(time.Until(accessExpiry).Seconds()),
			"user": UserResponse{
				ID:         user.ID,
				Nome:       user.Nome,
				Email:      user.Email,
				Perfil:     user.Perfil,
				Estado:     user.Estado,
				FotoPerfil: user.FotoPerfil,
			},
		},
	})
}

// Logout encerra a sessão do utilizador
func Logout(c *fiber.Ctx) error {
	// Obter ID do utilizador do contexto (definido pelo middleware de autenticação)
	userIDValue := c.Locals("user_id")
	if userIDValue == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Usuário não autenticado",
		})
	}

	userID, ok := userIDValue.(uint)
	if !ok {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro interno no processamento da identidade do usuário",
		})
	}

	// Obter token de atualização do corpo da requisição
	var req RefreshRequest
	if err := c.BodyParser(&req); err != nil || req.RefreshToken == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Token de atualização não fornecido",
		})
	}

	// Validar o refresh token para obter o ID da sessão
	token, err := jwt.Parse(req.RefreshToken, func(token *jwt.Token) (interface{}, error) {
		return []byte(utils.GetJWTSecret()), nil
	})

	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Token inválido",
			"erro":     err.Error(),
		})
	}

	// Verificar claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Token inválido",
		})
	}

	// Extrair ID da sessão com verificação adequada
	sessionIDRaw, exists := claims["session_id"]
	if !exists {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Token inválido: ID de sessão ausente",
		})
	}

	sessionID, ok := sessionIDRaw.(string)
	if !ok || sessionID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Token inválido: formato de ID de sessão incorreto",
		})
	}

	// Remover token do Redis (se disponível)
	// Usar a função atualizada que não retorna erro mesmo se Redis não estiver disponível
	config.DeleteRefreshToken(userID, sessionID)

	// Buscar sessão pelo token em vez do ID
	session, err := models.GetSessionByToken(req.RefreshToken)
	if err == nil && session.UtilizadorID == userID {
		// Invalidar sessão no banco de dados definindo a data de expiração para agora
		session.ExpiraEm = time.Now()
		if err := config.DB.Save(&session).Error; err != nil {
			// Apenas logar o erro, não falhar o logout
			// (log em ambiente de produção)
		}
	}

	// Registrar log de auditoria
	user, _ := models.GetUserByID(userID)
	if user != nil {
		models.RegistrarAuditoria(
			userID,
			user.Nome,
			"Logout",
			"Autenticação",
			c.IP(),
			map[string]interface{}{
				"session_id": sessionID,
			},
		)
	}

	// Atualizar status do utilizador como offline
	if err := models.AtualizarStatusUtilizador(
		userID,
		false,
		c.IP(),
		utils.ExtractDeviceInfo(string(c.Request().Header.UserAgent())),
	); err != nil {
		// Apenas logar o erro, não falhar o logout
		// (log em ambiente de produção)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Sessão encerrada com sucesso",
	})
}

// GetCurrentUser retorna os dados do utilizador atual
func GetCurrentUser(c *fiber.Ctx) error {
	userIDValue := c.Locals("user_id")
	if userIDValue == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Usuário não autenticado",
		})
	}

	userID, ok := userIDValue.(uint)
	if !ok {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro interno no processamento da identidade do usuário",
		})
	}

	user, err := models.GetUserByID(userID)
	if err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Utilizador não encontrado",
		})
	}

	return c.Status(http.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados": UserResponse{
			ID:         user.ID,
			Nome:       user.Nome,
			Email:      user.Email,
			Perfil:     user.Perfil,
			Estado:     user.Estado,
			FotoPerfil: user.FotoPerfil,
		},
	})
}
