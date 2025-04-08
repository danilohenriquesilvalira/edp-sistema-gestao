package controllers

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
	"github.com/danilo/edp_gestao_utilizadores/internal/models"
	"github.com/danilo/edp_gestao_utilizadores/internal/utils"
	"github.com/gofiber/fiber/v2"
)

// CreateUserRequest representa os dados para criar um novo utilizador
type CreateUserRequest struct {
	Nome             string `json:"nome" validate:"required"`
	Email            string `json:"email" validate:"required,email"`
	Password         string `json:"password" validate:"required,min=6"`
	Perfil           string `json:"perfil" validate:"required,oneof=Administrador Utilizador"`
	Estado           string `json:"estado" validate:"required,oneof=Ativo Inativo"`
	DoisFatoresAtivo bool   `json:"dois_fatores_ativo"`
}

// UpdateUserRequest representa os dados para atualizar um utilizador
type UpdateUserRequest struct {
	Nome             string `json:"nome"`
	Email            string `json:"email" validate:"omitempty,email"`
	Password         string `json:"password" validate:"omitempty,min=6"`
	Perfil           string `json:"perfil" validate:"omitempty,oneof=Administrador Utilizador"`
	Estado           string `json:"estado" validate:"omitempty,oneof=Ativo Inativo"`
	DoisFatoresAtivo bool   `json:"dois_fatores_ativo"`
}

// GetAllUsers retorna todos os utilizadores
func GetAllUsers(c *fiber.Ctx) error {
	var users []models.Utilizador

	result := config.DB.Find(&users)
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao obter utilizadores",
			"erro":     result.Error.Error(),
		})
	}

	// Filtrar dados sensíveis
	var responseUsers []UserResponse
	for _, user := range users {
		responseUsers = append(responseUsers, UserResponse{
			ID:         user.ID,
			Nome:       user.Nome,
			Email:      user.Email,
			Perfil:     user.Perfil,
			Estado:     user.Estado,
			FotoPerfil: user.FotoPerfil,
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   responseUsers,
		"total":   len(responseUsers),
	})
}

// GetUserByID retorna um utilizador específico pelo ID
func GetUserByID(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	user, err := models.GetUserByID(uint(id))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Utilizador não encontrado",
		})
	}

	// Filtrar dados sensíveis
	responseUser := UserResponse{
		ID:         user.ID,
		Nome:       user.Nome,
		Email:      user.Email,
		Perfil:     user.Perfil,
		Estado:     user.Estado,
		FotoPerfil: user.FotoPerfil,
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   responseUser,
	})
}

// CreateUser cria um novo utilizador
func CreateUser(c *fiber.Ctx) error {
	var req CreateUserRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Formato de solicitação inválido",
			"erro":     err.Error(),
		})
	}

	// Verificar se o email já existe
	existingUser, _ := models.GetUserByEmail(req.Email)
	if existingUser != nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Email já registado",
		})
	}

	// Gerar hash da senha
	senhaHash, err := utils.HashPassword(req.Password)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao processar senha",
			"erro":     err.Error(),
		})
	}

	// Criar utilizador
	user := models.Utilizador{
		Nome:             req.Nome,
		Email:            req.Email,
		SenhaHash:        senhaHash,
		Perfil:           req.Perfil,
		Estado:           req.Estado,
		DoisFatoresAtivo: req.DoisFatoresAtivo,
		TentativasLogin:  0,
		UltimoLogin:      time.Time{}, // Valor zero - nunca fez login
	}

	if result := config.DB.Create(&user); result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao criar utilizador",
			"erro":     result.Error.Error(),
		})
	}

	// Registrar log de auditoria
	adminID := c.Locals("user_id").(uint)
	adminName := c.Locals("user_name").(string)

	models.RegistrarAuditoria(
		adminID,
		adminName,
		"Criar",
		"Utilizadores",
		c.IP(),
		map[string]interface{}{
			"id":     user.ID,
			"nome":   user.Nome,
			"email":  user.Email,
			"perfil": user.Perfil,
			"estado": user.Estado,
		},
	)

	responseUser := UserResponse{
		ID:         user.ID,
		Nome:       user.Nome,
		Email:      user.Email,
		Perfil:     user.Perfil,
		Estado:     user.Estado,
		FotoPerfil: user.FotoPerfil,
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Utilizador criado com sucesso",
		"dados":    responseUser,
	})
}

// UpdateUser atualiza um utilizador existente
func UpdateUser(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	var req UpdateUserRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Formato de solicitação inválido",
			"erro":     err.Error(),
		})
	}

	// Verificar se o utilizador existe
	user, err := models.GetUserByID(uint(id))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Utilizador não encontrado",
		})
	}

	// Verificar se o email já existe (se estiver a ser atualizado)
	if req.Email != "" && req.Email != user.Email {
		existingUser, _ := models.GetUserByEmail(req.Email)
		if existingUser != nil {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"sucesso":  false,
				"mensagem": "Email já registado por outro utilizador",
			})
		}
		user.Email = req.Email
	}

	// Atualizar os campos, se fornecidos
	if req.Nome != "" {
		user.Nome = req.Nome
	}

	if req.Perfil != "" {
		user.Perfil = req.Perfil
	}

	if req.Estado != "" {
		user.Estado = req.Estado

		// Se desativando a conta, invalidar todas as sessões
		if req.Estado == "Inativo" {
			models.InvalidateAllUserSessions(user.ID)
			config.DeleteAllUserRefreshTokens(user.ID)
		}
	}

	// Atualizar senha, se fornecida
	if req.Password != "" {
		senhaHash, err := utils.HashPassword(req.Password)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"sucesso":  false,
				"mensagem": "Erro ao processar senha",
				"erro":     err.Error(),
			})
		}
		user.SenhaHash = senhaHash
	}

	// Atualizar autenticação de dois fatores
	user.DoisFatoresAtivo = req.DoisFatoresAtivo

	// Salvar alterações
	if err := config.DB.Save(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao atualizar utilizador",
			"erro":     err.Error(),
		})
	}

	// Registrar log de auditoria
	adminID := c.Locals("user_id").(uint)
	adminName := c.Locals("user_name").(string)

	models.RegistrarAuditoria(
		adminID,
		adminName,
		"Atualizar",
		"Utilizadores",
		c.IP(),
		map[string]interface{}{
			"id":     user.ID,
			"nome":   user.Nome,
			"email":  user.Email,
			"perfil": user.Perfil,
			"estado": user.Estado,
		},
	)

	responseUser := UserResponse{
		ID:         user.ID,
		Nome:       user.Nome,
		Email:      user.Email,
		Perfil:     user.Perfil,
		Estado:     user.Estado,
		FotoPerfil: user.FotoPerfil,
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Utilizador atualizado com sucesso",
		"dados":    responseUser,
	})
}

// DeleteUser remove um utilizador
func DeleteUser(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	// Verificar se o utilizador existe
	user, err := models.GetUserByID(uint(id))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Utilizador não encontrado",
		})
	}

	// Impedir exclusão da própria conta
	adminID := c.Locals("user_id").(uint)
	if adminID == uint(id) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Não é possível excluir a própria conta",
		})
	}

	// Antes de excluir, invalidar sessões e tokens
	models.InvalidateAllUserSessions(user.ID)
	config.DeleteAllUserRefreshTokens(user.ID)

	// Excluir o utilizador
	if err := config.DB.Delete(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao excluir utilizador",
			"erro":     err.Error(),
		})
	}

	// Remover foto de perfil, se existir
	if user.FotoPerfil != "" && strings.HasPrefix(user.FotoPerfil, "/uploads/") {
		filePath := "." + user.FotoPerfil
		os.Remove(filePath)
	}

	// Registrar log de auditoria
	adminName := c.Locals("user_name").(string)

	models.RegistrarAuditoria(
		adminID,
		adminName,
		"Excluir",
		"Utilizadores",
		c.IP(),
		map[string]interface{}{
			"id":    user.ID,
			"nome":  user.Nome,
			"email": user.Email,
		},
	)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Utilizador excluído com sucesso",
	})
}

// UploadProfilePicture faz o upload da foto de perfil de um utilizador
func UploadProfilePicture(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	// Verificar se o utilizador existe
	user, err := models.GetUserByID(uint(id))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Utilizador não encontrado",
		})
	}

	// Obter o arquivo enviado
	file, err := c.FormFile("avatar")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Nenhum arquivo enviado ou formato inválido",
			"erro":     err.Error(),
		})
	}

	// Verificar tipo de arquivo (aceitar apenas imagens)
	contentType := file.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "image/") {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "O arquivo não é uma imagem válida",
		})
	}

	// Criar diretório de uploads se não existir
	uploadDir := "./uploads/avatars"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao criar diretório de uploads",
			"erro":     err.Error(),
		})
	}

	// Gerar nome de arquivo único
	fileExt := filepath.Ext(file.Filename)
	fileName := fmt.Sprintf("user_%d_%d%s", id, time.Now().Unix(), fileExt)
	filePath := filepath.Join(uploadDir, fileName)

	// Remover foto anterior, se existir
	if user.FotoPerfil != "" && strings.HasPrefix(user.FotoPerfil, "/uploads/") {
		oldFilePath := "." + user.FotoPerfil
		os.Remove(oldFilePath)
	}

	// Salvar arquivo
	if err := saveFile(file, filePath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao salvar arquivo",
			"erro":     err.Error(),
		})
	}

	// Atualizar caminho da foto no banco de dados
	relativePath := "/uploads/avatars/" + fileName
	user.FotoPerfil = relativePath
	if err := config.DB.Save(&user).Error; err != nil {
		// Remover arquivo se houver erro ao atualizar o banco
		os.Remove(filePath)

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao atualizar foto de perfil no banco de dados",
			"erro":     err.Error(),
		})
	}

	// Registrar log de auditoria
	adminID := c.Locals("user_id").(uint)
	adminName := c.Locals("user_name").(string)

	models.RegistrarAuditoria(
		adminID,
		adminName,
		"Atualizar Foto",
		"Utilizadores",
		c.IP(),
		map[string]interface{}{
			"id":          user.ID,
			"nome":        user.Nome,
			"foto_perfil": relativePath,
		},
	)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":     true,
		"mensagem":    "Foto de perfil atualizada com sucesso",
		"foto_perfil": relativePath,
	})
}

// Funções auxiliares

// saveFile salva um arquivo no sistema de arquivos
func saveFile(file *multipart.FileHeader, dst string) error {
	src, err := file.Open()
	if err != nil {
		return err
	}
	defer src.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, src)
	return err
}
