package controllers

import (
	"strconv"
	"time"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
	"github.com/danilo/edp_gestao_utilizadores/internal/models"
	"github.com/gofiber/fiber/v2"
)

// ConfigResponse é a estrutura de resposta para uma configuração
type ConfigResponse struct {
	ID           uint      `json:"id"`
	Chave        string    `json:"chave"`
	Valor        string    `json:"valor"`
	Descricao    string    `json:"descricao"`
	AtualizadoEm time.Time `json:"atualizado_em"`
}

// CreateConfigRequest é a estrutura para criar/atualizar uma configuração
type CreateConfigRequest struct {
	Chave     string `json:"chave" validate:"required"`
	Valor     string `json:"valor" validate:"required"`
	Descricao string `json:"descricao"`
}

// GetAllConfigs retorna todas as configurações do sistema
func GetAllConfigs(c *fiber.Ctx) error {
	var configs []models.ConfiguracaoSistema

	result := config.DB.Find(&configs)
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao obter configurações",
			"erro":     result.Error.Error(),
		})
	}

	// Preparar resposta
	var responseConfigs []ConfigResponse
	for _, cfg := range configs {
		responseConfigs = append(responseConfigs, ConfigResponse{
			ID:           cfg.ID,
			Chave:        cfg.Chave,
			Valor:        cfg.Valor,
			Descricao:    cfg.Descricao,
			AtualizadoEm: cfg.AtualizadoEm,
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   responseConfigs,
		"total":   len(responseConfigs),
	})
}

// GetConfigByID retorna uma configuração específica pelo ID
func GetConfigByID(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	var cfg models.ConfiguracaoSistema
	result := config.DB.First(&cfg, id)
	if result.Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Configuração não encontrada",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados": ConfigResponse{
			ID:           cfg.ID,
			Chave:        cfg.Chave,
			Valor:        cfg.Valor,
			Descricao:    cfg.Descricao,
			AtualizadoEm: cfg.AtualizadoEm,
		},
	})
}

// GetConfigByKey retorna uma configuração pela chave
func GetConfigByKey(c *fiber.Ctx) error {
	key := c.Params("chave")

	var cfg models.ConfiguracaoSistema
	result := config.DB.Where("chave = ?", key).First(&cfg)
	if result.Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Configuração não encontrada",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados": ConfigResponse{
			ID:           cfg.ID,
			Chave:        cfg.Chave,
			Valor:        cfg.Valor,
			Descricao:    cfg.Descricao,
			AtualizadoEm: cfg.AtualizadoEm,
		},
	})
}

// CreateConfig cria uma nova configuração
func CreateConfig(c *fiber.Ctx) error {
	var req CreateConfigRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Formato de solicitação inválido",
			"erro":     err.Error(),
		})
	}

	// Verificar se a chave já existe
	var existingConfig models.ConfiguracaoSistema
	if config.DB.Where("chave = ?", req.Chave).First(&existingConfig).RowsAffected > 0 {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Chave de configuração já existe",
		})
	}

	// Criar configuração
	cfg := models.ConfiguracaoSistema{
		Chave:     req.Chave,
		Valor:     req.Valor,
		Descricao: req.Descricao,
	}

	if result := config.DB.Create(&cfg); result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao criar configuração",
			"erro":     result.Error.Error(),
		})
	}

	// Registrar log de auditoria
	userID := c.Locals("user_id").(uint)
	userName := c.Locals("user_name").(string)

	models.RegistrarAuditoria(
		userID,
		userName,
		"Criar",
		"Configurações",
		c.IP(),
		map[string]interface{}{
			"id":        cfg.ID,
			"chave":     cfg.Chave,
			"descricao": cfg.Descricao,
		},
	)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Configuração criada com sucesso",
		"dados": ConfigResponse{
			ID:           cfg.ID,
			Chave:        cfg.Chave,
			Valor:        cfg.Valor,
			Descricao:    cfg.Descricao,
			AtualizadoEm: cfg.AtualizadoEm,
		},
	})
}

// UpdateConfig atualiza uma configuração existente
func UpdateConfig(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	var req CreateConfigRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Formato de solicitação inválido",
			"erro":     err.Error(),
		})
	}

	// Verificar se a configuração existe
	var cfg models.ConfiguracaoSistema
	result := config.DB.First(&cfg, id)
	if result.Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Configuração não encontrada",
		})
	}

	// Verificar se a nova chave já existe (se estiver alterando a chave)
	if req.Chave != cfg.Chave {
		var existingConfig models.ConfiguracaoSistema
		if config.DB.Where("chave = ? AND id != ?", req.Chave, id).First(&existingConfig).RowsAffected > 0 {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"sucesso":  false,
				"mensagem": "Chave de configuração já existe",
			})
		}
	}

	// Atualizar campos
	cfg.Chave = req.Chave
	cfg.Valor = req.Valor
	cfg.Descricao = req.Descricao

	// Salvar alterações
	if err := config.DB.Save(&cfg).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao atualizar configuração",
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
		"Configurações",
		c.IP(),
		map[string]interface{}{
			"id":        cfg.ID,
			"chave":     cfg.Chave,
			"descricao": cfg.Descricao,
		},
	)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Configuração atualizada com sucesso",
		"dados": ConfigResponse{
			ID:           cfg.ID,
			Chave:        cfg.Chave,
			Valor:        cfg.Valor,
			Descricao:    cfg.Descricao,
			AtualizadoEm: cfg.AtualizadoEm,
		},
	})
}

// DeleteConfig remove uma configuração
func DeleteConfig(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	// Verificar se a configuração existe
	var cfg models.ConfiguracaoSistema
	result := config.DB.First(&cfg, id)
	if result.Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Configuração não encontrada",
		})
	}

	// Excluir a configuração
	if err := config.DB.Delete(&cfg).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao excluir configuração",
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
		"Configurações",
		c.IP(),
		map[string]interface{}{
			"id":    cfg.ID,
			"chave": cfg.Chave,
		},
	)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Configuração excluída com sucesso",
	})
}
