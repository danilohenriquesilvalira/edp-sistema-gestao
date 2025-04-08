package controllers

import (
	"strconv"
	"time"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
	"github.com/danilo/edp_gestao_utilizadores/internal/models"
	"github.com/gofiber/fiber/v2"
)

// AuditLogResponse é a estrutura de resposta para um log de auditoria
type AuditLogResponse struct {
	ID             uint      `json:"id"`
	UtilizadorID   uint      `json:"utilizador_id"`
	NomeUtilizador string    `json:"nome_utilizador"`
	Acao           string    `json:"acao"`
	Modulo         string    `json:"modulo"`
	IP             string    `json:"ip"`
	Detalhes       string    `json:"detalhes"`
	CriadoEm       time.Time `json:"criado_em"`
}

// GetAuditLogs retorna todos os logs de auditoria, com opções de filtragem e paginação
func GetAuditLogs(c *fiber.Ctx) error {
	// Parâmetros de filtragem
	utilizadorID := c.Query("utilizador_id")
	acao := c.Query("acao")
	modulo := c.Query("modulo")
	dataInicio := c.Query("data_inicio")
	dataFim := c.Query("data_fim")

	// Parâmetros de paginação
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	// Construir consulta
	query := config.DB.Model(&models.LogAuditoria{})

	// Aplicar filtros
	if utilizadorID != "" {
		if id, err := strconv.Atoi(utilizadorID); err == nil {
			query = query.Where("utilizador_id = ?", id)
		}
	}

	if acao != "" {
		query = query.Where("acao = ?", acao)
	}

	if modulo != "" {
		query = query.Where("modulo = ?", modulo)
	}

	if dataInicio != "" {
		query = query.Where("criado_em >= ?", dataInicio)
	}

	if dataFim != "" {
		query = query.Where("criado_em <= ?", dataFim)
	}

	// Contar total de registros
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao contar logs de auditoria",
			"erro":     err.Error(),
		})
	}

	// Buscar registros com paginação
	var logs []models.LogAuditoria
	if err := query.Order("criado_em DESC").Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao buscar logs de auditoria",
			"erro":     err.Error(),
		})
	}

	// Preparar resposta
	var responseLogs []AuditLogResponse
	for _, log := range logs {
		responseLogs = append(responseLogs, AuditLogResponse{
			ID:             log.ID,
			UtilizadorID:   log.UtilizadorID,
			NomeUtilizador: log.NomeUtilizador,
			Acao:           log.Acao,
			Modulo:         log.Modulo,
			IP:             log.IP,
			Detalhes:       log.Detalhes,
			CriadoEm:       log.CriadoEm,
		})
	}

	// Calcular páginas
	totalPages := (int(total) + limit - 1) / limit

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   responseLogs,
		"meta": fiber.Map{
			"total":       total,
			"page":        page,
			"limit":       limit,
			"total_pages": totalPages,
		},
	})
}

// GetAuditLogByID retorna um log de auditoria específico
func GetAuditLogByID(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	var log models.LogAuditoria
	if err := config.DB.First(&log, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Log de auditoria não encontrado",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados": AuditLogResponse{
			ID:             log.ID,
			UtilizadorID:   log.UtilizadorID,
			NomeUtilizador: log.NomeUtilizador,
			Acao:           log.Acao,
			Modulo:         log.Modulo,
			IP:             log.IP,
			Detalhes:       log.Detalhes,
			CriadoEm:       log.CriadoEm,
		},
	})
}

// GetAuditActions retorna as ações de auditoria disponíveis
func GetAuditActions(c *fiber.Ctx) error {
	var actions []string

	if err := config.DB.Model(&models.LogAuditoria{}).Distinct("acao").Pluck("acao", &actions).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao buscar ações de auditoria",
			"erro":     err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   actions,
	})
}

// GetAuditModules retorna os módulos de auditoria disponíveis
func GetAuditModules(c *fiber.Ctx) error {
	var modules []string

	if err := config.DB.Model(&models.LogAuditoria{}).Distinct("modulo").Pluck("modulo", &modules).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao buscar módulos de auditoria",
			"erro":     err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   modules,
	})
}
