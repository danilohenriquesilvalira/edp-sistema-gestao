package controllers

import (
	"strconv"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
	"github.com/danilo/edp_gestao_utilizadores/internal/models"
	"github.com/gofiber/fiber/v2"
)

// PermissionResponse é a estrutura de resposta para uma permissão
type PermissionResponse struct {
	ID        uint   `json:"id"`
	Nome      string `json:"nome"`
	Descricao string `json:"descricao"`
	Modulo    string `json:"modulo"`
	Acao      string `json:"acao"`
}

// CreatePermissionRequest é a estrutura para criar/atualizar uma permissão
type CreatePermissionRequest struct {
	Nome      string `json:"nome" validate:"required"`
	Descricao string `json:"descricao"`
	Modulo    string `json:"modulo" validate:"required"`
	Acao      string `json:"acao" validate:"required"`
}

// ProfilePermissionRequest é a estrutura para atribuir permissões a um perfil
type ProfilePermissionRequest struct {
	Perfil       string `json:"perfil" validate:"required,oneof=Administrador Utilizador"`
	PermissaoIDs []uint `json:"permissao_ids" validate:"required"`
}

// GetAllPermissions retorna todas as permissões
func GetAllPermissions(c *fiber.Ctx) error {
	var permissions []models.Permissao

	if err := config.DB.Find(&permissions).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao buscar permissões",
			"erro":     err.Error(),
		})
	}

	// Preparar resposta
	var responsePermissions []PermissionResponse
	for _, perm := range permissions {
		responsePermissions = append(responsePermissions, PermissionResponse{
			ID:        perm.ID,
			Nome:      perm.Nome,
			Descricao: perm.Descricao,
			Modulo:    perm.Modulo,
			Acao:      perm.Acao,
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   responsePermissions,
		"total":   len(responsePermissions),
	})
}

// GetPermissionByID retorna uma permissão específica
func GetPermissionByID(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	var permission models.Permissao
	if err := config.DB.First(&permission, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Permissão não encontrada",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados": PermissionResponse{
			ID:        permission.ID,
			Nome:      permission.Nome,
			Descricao: permission.Descricao,
			Modulo:    permission.Modulo,
			Acao:      permission.Acao,
		},
	})
}

// CreatePermission cria uma nova permissão
func CreatePermission(c *fiber.Ctx) error {
	var req CreatePermissionRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Formato de solicitação inválido",
			"erro":     err.Error(),
		})
	}

	// Verificar se já existe uma permissão com o mesmo nome
	var existingPermission models.Permissao
	if config.DB.Where("nome = ?", req.Nome).First(&existingPermission).RowsAffected > 0 {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Já existe uma permissão com este nome",
		})
	}

	// Criar permissão
	permission := models.Permissao{
		Nome:      req.Nome,
		Descricao: req.Descricao,
		Modulo:    req.Modulo,
		Acao:      req.Acao,
	}

	if err := config.DB.Create(&permission).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao criar permissão",
			"erro":     err.Error(),
		})
	}

	// Registrar log de auditoria
	userID := c.Locals("user_id").(uint)
	userName := c.Locals("user_name").(string)

	models.RegistrarAuditoria(
		userID,
		userName,
		"Criar",
		"Permissões",
		c.IP(),
		map[string]interface{}{
			"id":     permission.ID,
			"nome":   permission.Nome,
			"modulo": permission.Modulo,
			"acao":   permission.Acao,
		},
	)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Permissão criada com sucesso",
		"dados": PermissionResponse{
			ID:        permission.ID,
			Nome:      permission.Nome,
			Descricao: permission.Descricao,
			Modulo:    permission.Modulo,
			Acao:      permission.Acao,
		},
	})
}

// UpdatePermission atualiza uma permissão existente
func UpdatePermission(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	var req CreatePermissionRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Formato de solicitação inválido",
			"erro":     err.Error(),
		})
	}

	// Verificar se a permissão existe
	var permission models.Permissao
	if err := config.DB.First(&permission, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Permissão não encontrada",
		})
	}

	// Verificar se o novo nome já existe (se estiver alterando o nome)
	if req.Nome != permission.Nome {
		var existingPermission models.Permissao
		if config.DB.Where("nome = ? AND id != ?", req.Nome, id).First(&existingPermission).RowsAffected > 0 {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"sucesso":  false,
				"mensagem": "Já existe uma permissão com este nome",
			})
		}
	}

	// Atualizar campos
	permission.Nome = req.Nome
	permission.Descricao = req.Descricao
	permission.Modulo = req.Modulo
	permission.Acao = req.Acao

	// Salvar alterações
	if err := config.DB.Save(&permission).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao atualizar permissão",
			"erro":     err.Error(),
		})
	}

	// Registrar log de auditoria
	userID := c.Locals("user_id").(uint)
	userName := c.Locals("user_name").(string)

	models.RegistrarAuditoria(
		userID,
		userName,
		"Atualizar",
		"Permissões",
		c.IP(),
		map[string]interface{}{
			"id":     permission.ID,
			"nome":   permission.Nome,
			"modulo": permission.Modulo,
			"acao":   permission.Acao,
		},
	)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Permissão atualizada com sucesso",
		"dados": PermissionResponse{
			ID:        permission.ID,
			Nome:      permission.Nome,
			Descricao: permission.Descricao,
			Modulo:    permission.Modulo,
			Acao:      permission.Acao,
		},
	})
}

// DeletePermission remove uma permissão
func DeletePermission(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	// Verificar se a permissão existe
	var permission models.Permissao
	if err := config.DB.First(&permission, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Permissão não encontrada",
		})
	}

	// Verificar se a permissão está sendo usada em algum perfil
	var count int64
	if err := config.DB.Model(&models.PerfilPermissao{}).Where("permissao_id = ?", id).Count(&count).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao verificar uso da permissão",
			"erro":     err.Error(),
		})
	}

	if count > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Esta permissão está associada a perfis e não pode ser excluída",
		})
	}

	// Excluir a permissão
	if err := config.DB.Delete(&permission).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao excluir permissão",
			"erro":     err.Error(),
		})
	}

	// Registrar log de auditoria
	userID := c.Locals("user_id").(uint)
	userName := c.Locals("user_name").(string)

	models.RegistrarAuditoria(
		userID,
		userName,
		"Excluir",
		"Permissões",
		c.IP(),
		map[string]interface{}{
			"id":   permission.ID,
			"nome": permission.Nome,
		},
	)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Permissão excluída com sucesso",
	})
}

// GetProfilePermissions retorna as permissões de um perfil
func GetProfilePermissions(c *fiber.Ctx) error {
	profile := c.Params("perfil")

	// Verificar se o perfil é válido
	if profile != "Administrador" && profile != "Utilizador" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Perfil inválido. Deve ser 'Administrador' ou 'Utilizador'",
		})
	}

	// Buscar IDs de permissões do perfil
	var profilePermissions []models.PerfilPermissao
	if err := config.DB.Where("perfil = ?", profile).Find(&profilePermissions).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao buscar permissões do perfil",
			"erro":     err.Error(),
		})
	}

	// Extrair IDs de permissões
	var permissionIDs []uint
	for _, pp := range profilePermissions {
		permissionIDs = append(permissionIDs, pp.PermissaoID)
	}

	// Se não houver permissões, retornar lista vazia
	if len(permissionIDs) == 0 {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"sucesso": true,
			"dados":   []PermissionResponse{},
			"total":   0,
		})
	}

	// Buscar detalhes das permissões
	var permissions []models.Permissao
	if err := config.DB.Where("id IN ?", permissionIDs).Find(&permissions).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao buscar detalhes das permissões",
			"erro":     err.Error(),
		})
	}

	// Preparar resposta
	var responsePermissions []PermissionResponse
	for _, perm := range permissions {
		responsePermissions = append(responsePermissions, PermissionResponse{
			ID:        perm.ID,
			Nome:      perm.Nome,
			Descricao: perm.Descricao,
			Modulo:    perm.Modulo,
			Acao:      perm.Acao,
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   responsePermissions,
		"total":   len(responsePermissions),
	})
}

// SetProfilePermissions atualiza as permissões de um perfil
func SetProfilePermissions(c *fiber.Ctx) error {
	profile := c.Params("perfil")

	// Verificar se o perfil é válido
	if profile != "Administrador" && profile != "Utilizador" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Perfil inválido. Deve ser 'Administrador' ou 'Utilizador'",
		})
	}

	var req ProfilePermissionRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Formato de solicitação inválido",
			"erro":     err.Error(),
		})
	}

	// Verificar se o perfil na URL corresponde ao do corpo da requisição
	if profile != req.Perfil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Perfil na URL não corresponde ao perfil no corpo da requisição",
		})
	}

	// Verificar se todas as permissões existem
	for _, permID := range req.PermissaoIDs {
		var perm models.Permissao
		if err := config.DB.First(&perm, permID).Error; err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"sucesso":  false,
				"mensagem": "Permissão com ID " + strconv.Itoa(int(permID)) + " não existe",
			})
		}
	}

	// Remover permissões existentes do perfil
	if err := config.DB.Where("perfil = ?", profile).Delete(&models.PerfilPermissao{}).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao remover permissões existentes",
			"erro":     err.Error(),
		})
	}

	// Adicionar novas permissões
	for _, permID := range req.PermissaoIDs {
		profilePerm := models.PerfilPermissao{
			Perfil:      profile,
			PermissaoID: permID,
		}

		if err := config.DB.Create(&profilePerm).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"sucesso":  false,
				"mensagem": "Erro ao adicionar permissão",
				"erro":     err.Error(),
			})
		}
	}

	// Registrar log de auditoria
	userID := c.Locals("user_id").(uint)
	userName := c.Locals("user_name").(string)

	models.RegistrarAuditoria(
		userID,
		userName,
		"Atualizar",
		"Perfil Permissões",
		c.IP(),
		map[string]interface{}{
			"perfil":        profile,
			"permissao_ids": req.PermissaoIDs,
		},
	)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Permissões do perfil atualizadas com sucesso",
	})
}
