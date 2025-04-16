package plc

import (
	"fmt"
	"strconv"
	"time"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
	"github.com/danilo/edp_gestao_utilizadores/internal/models"
	"github.com/gofiber/fiber/v2"
)

// FaultController gerencia endpoints da API para o sistema de falhas
type FaultController struct {
	manager      *Manager
	faultManager *FaultManager
}

// NewFaultController cria um novo controlador de falhas
func NewFaultController(manager *Manager, faultManager *FaultManager) *FaultController {
	return &FaultController{
		manager:      manager,
		faultManager: faultManager,
	}
}

// GetAllFaultDefinitions retorna todas as definições de falhas
func (c *FaultController) GetAllFaultDefinitions(ctx *fiber.Ctx) error {
	var definitions []FaultDefinition

	query := config.DB.Order("eclusa, subsistema, word_name, bit_offset")

	// Aplicar filtros se fornecidos
	if eclusa := ctx.Query("eclusa"); eclusa != "" {
		query = query.Where("eclusa = ?", eclusa)
	}

	if subsistema := ctx.Query("subsistema"); subsistema != "" {
		query = query.Where("subsistema = ?", subsistema)
	}

	if plcID := ctx.Query("plc_id"); plcID != "" {
		query = query.Where("plc_id = ?", plcID)
	}

	if ativo := ctx.Query("ativo"); ativo != "" {
		isAtivo := ativo == "true" || ativo == "1"
		query = query.Where("ativo = ?", isAtivo)
	}

	result := query.Find(&definitions)
	if result.Error != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao obter definições de falhas",
			"erro":     result.Error.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   definitions,
		"total":   len(definitions),
	})
}

// GetFaultDefinitionByID retorna uma definição de falha específica pelo ID
func (c *FaultController) GetFaultDefinitionByID(ctx *fiber.Ctx) error {
	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	var definition FaultDefinition
	result := config.DB.First(&definition, id)
	if result.Error != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Definição de falha não encontrada",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   definition,
	})
}

// CreateFaultDefinition cria uma nova definição de falha
func (c *FaultController) CreateFaultDefinition(ctx *fiber.Ctx) error {
	var definition FaultDefinition

	if err := ctx.BodyParser(&definition); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Formato de solicitação inválido",
			"erro":     err.Error(),
		})
	}

	// Validar dados
	if definition.BitOffset < 0 || definition.BitOffset > 15 {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Offset de bit deve estar entre 0 e 15",
		})
	}

	// Verificar se o PLC existe
	var plc PLC
	result := config.DB.First(&plc, definition.PLCID)
	if result.Error != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "PLC não encontrado",
		})
	}

	// Verificar se já existe uma definição para este bit nesta word
	var count int64
	config.DB.Model(&FaultDefinition{}).
		Where("plc_id = ? AND db_number = ? AND byte_offset = ? AND bit_offset = ?",
			definition.PLCID, definition.DBNumber, definition.ByteOffset, definition.BitOffset).
		Count(&count)

	if count > 0 {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Já existe uma definição para este bit nesta word",
		})
	}

	// Criar no banco
	result = config.DB.Create(&definition)
	if result.Error != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao criar definição de falha",
			"erro":     result.Error.Error(),
		})
	}

	// Registrar log de auditoria
	userID := ctx.Locals("user_id").(uint)
	userName := ctx.Locals("user_name").(string)

	models.RegistrarAuditoria(
		userID,
		userName,
		"Criar",
		"FaultDefinition",
		ctx.IP(),
		map[string]interface{}{
			"id":         definition.ID,
			"plc_id":     definition.PLCID,
			"eclusa":     definition.Eclusa,
			"subsistema": definition.Subsistema,
			"word_name":  definition.WordName,
			"bit_offset": definition.BitOffset,
			"descricao":  definition.Descricao,
		},
	)

	// Recarregar definições no gerenciador de falhas
	go c.faultManager.ReloadDefinitions()

	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Definição de falha criada com sucesso",
		"dados":    definition,
	})
}

// UpdateFaultDefinition atualiza uma definição de falha existente
func (c *FaultController) UpdateFaultDefinition(ctx *fiber.Ctx) error {
	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	var definition FaultDefinition
	result := config.DB.First(&definition, id)
	if result.Error != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Definição de falha não encontrada",
		})
	}

	// Salvar valores antigos para comparação
	oldPLCID := definition.PLCID
	oldDBNumber := definition.DBNumber
	oldByteOffset := definition.ByteOffset
	oldBitOffset := definition.BitOffset

	if err := ctx.BodyParser(&definition); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Formato de solicitação inválido",
			"erro":     err.Error(),
		})
	}

	// Garantir que o ID não mude
	definition.ID = uint(id)

	// Validar dados
	if definition.BitOffset < 0 || definition.BitOffset > 15 {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Offset de bit deve estar entre 0 e 15",
		})
	}

	// Verificar se o PLC existe
	var plc PLC
	result = config.DB.First(&plc, definition.PLCID)
	if result.Error != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "PLC não encontrado",
		})
	}

	// Se os detalhes da word/bit mudaram, verificar por conflito
	if oldPLCID != definition.PLCID ||
		oldDBNumber != definition.DBNumber ||
		oldByteOffset != definition.ByteOffset ||
		oldBitOffset != definition.BitOffset {

		var count int64
		config.DB.Model(&FaultDefinition{}).
			Where("plc_id = ? AND db_number = ? AND byte_offset = ? AND bit_offset = ? AND id != ?",
				definition.PLCID, definition.DBNumber, definition.ByteOffset, definition.BitOffset, definition.ID).
			Count(&count)

		if count > 0 {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"sucesso":  false,
				"mensagem": "Já existe uma definição para este bit nesta word",
			})
		}
	}

	// Atualizar no banco
	result = config.DB.Save(&definition)
	if result.Error != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao atualizar definição de falha",
			"erro":     result.Error.Error(),
		})
	}

	// Registrar log de auditoria
	userID := ctx.Locals("user_id").(uint)
	userName := ctx.Locals("user_name").(string)

	models.RegistrarAuditoria(
		userID,
		userName,
		"Atualizar",
		"FaultDefinition",
		ctx.IP(),
		map[string]interface{}{
			"id":         definition.ID,
			"plc_id":     definition.PLCID,
			"eclusa":     definition.Eclusa,
			"subsistema": definition.Subsistema,
			"word_name":  definition.WordName,
			"bit_offset": definition.BitOffset,
			"descricao":  definition.Descricao,
			"ativo":      definition.Ativo,
		},
	)

	// Recarregar definições no gerenciador de falhas
	go c.faultManager.ReloadDefinitions()

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Definição de falha atualizada com sucesso",
		"dados":    definition,
	})
}

// DeleteFaultDefinition remove uma definição de falha
func (c *FaultController) DeleteFaultDefinition(ctx *fiber.Ctx) error {
	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	var definition FaultDefinition
	result := config.DB.First(&definition, id)
	if result.Error != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Definição de falha não encontrada",
		})
	}

	// Excluir do banco (vai excluir automaticamente status e histórico relacionados devido às restrições ON DELETE CASCADE)
	result = config.DB.Delete(&definition)
	if result.Error != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao excluir definição de falha",
			"erro":     result.Error.Error(),
		})
	}

	// Registrar log de auditoria
	userID := ctx.Locals("user_id").(uint)
	userName := ctx.Locals("user_name").(string)

	models.RegistrarAuditoria(
		userID,
		userName,
		"Excluir",
		"FaultDefinition",
		ctx.IP(),
		map[string]interface{}{
			"id":         definition.ID,
			"plc_id":     definition.PLCID,
			"eclusa":     definition.Eclusa,
			"subsistema": definition.Subsistema,
			"word_name":  definition.WordName,
		},
	)

	// Recarregar definições no gerenciador de falhas
	go c.faultManager.ReloadDefinitions()

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Definição de falha excluída com sucesso",
	})
}

// GetActiveFaults retorna todas as falhas ativas no momento
func (c *FaultController) GetActiveFaults(ctx *fiber.Ctx) error {
	events, err := c.faultManager.GetActiveFaults()
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao obter falhas ativas",
			"erro":     err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   events,
		"total":   len(events),
	})
}

// GetFaultHistory retorna o histórico de falhas com filtragem
func (c *FaultController) GetFaultHistory(ctx *fiber.Ctx) error {
	// Extrair parâmetros de filtragem
	eclusa := ctx.Query("eclusa")
	subsistema := ctx.Query("subsistema")

	var startTime, endTime time.Time

	if startStr := ctx.Query("start_date"); startStr != "" {
		if t, err := time.Parse("2006-01-02", startStr); err == nil {
			startTime = t
		}
	}

	if endStr := ctx.Query("end_date"); endStr != "" {
		if t, err := time.Parse("2006-01-02", endStr); err == nil {
			// Adicionar 1 dia para incluir todo o dia final
			endTime = t.Add(24 * time.Hour)
		}
	}

	history, err := c.faultManager.GetFaultHistory(eclusa, subsistema, startTime, endTime)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao obter histórico de falhas",
			"erro":     err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   history,
		"total":   len(history),
	})
}

// AcknowledgeFault reconhece uma falha ativa
func (c *FaultController) AcknowledgeFault(ctx *fiber.Ctx) error {
	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	// Verificar se a falha existe e está ativa
	var count int64
	result := config.DB.Model(&FaultStatus{}).
		Where("fault_id = ? AND ativo = true", id).
		Count(&count)

	if result.Error != nil || count == 0 {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Falha não encontrada ou não está ativa",
		})
	}

	// Obter dados do usuário
	userID := ctx.Locals("user_id").(uint)
	userName := ctx.Locals("user_name").(string)

	// Reconhecer a falha
	err = c.faultManager.AcknowledgeFault(uint(id), userID, userName)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao reconhecer falha",
			"erro":     err.Error(),
		})
	}

	// Registrar log de auditoria
	models.RegistrarAuditoria(
		userID,
		userName,
		"Reconhecer",
		"Falha",
		ctx.IP(),
		map[string]interface{}{
			"fault_id": id,
		},
	)

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Falha reconhecida com sucesso",
	})
}

// GetEclusasList retorna a lista de eclusas disponíveis
func (c *FaultController) GetEclusasList(ctx *fiber.Ctx) error {
	var eclusas []string

	result := config.DB.Model(&FaultDefinition{}).
		Distinct().
		Pluck("eclusa", &eclusas)

	if result.Error != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao obter lista de eclusas",
			"erro":     result.Error.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   eclusas,
	})
}

// GetSubsistemasList retorna a lista de subsistemas disponíveis
func (c *FaultController) GetSubsistemasList(ctx *fiber.Ctx) error {
	var subsistemas []string
	query := config.DB.Model(&FaultDefinition{}).Distinct()

	// Filtrar por eclusa se fornecido
	if eclusa := ctx.Query("eclusa"); eclusa != "" {
		query = query.Where("eclusa = ?", eclusa)
	}

	result := query.Pluck("subsistema", &subsistemas)

	if result.Error != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao obter lista de subsistemas",
			"erro":     result.Error.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   subsistemas,
	})
}

// ImportFaultDefinitions importa definições de falha em lote
func (c *FaultController) ImportFaultDefinitions(ctx *fiber.Ctx) error {
	var defs []FaultDefinition

	if err := ctx.BodyParser(&defs); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Formato de solicitação inválido",
			"erro":     err.Error(),
		})
	}

	if len(defs) == 0 {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Nenhuma definição fornecida",
		})
	}

	// Iniciar transação
	tx := config.DB.Begin()

	inserted := 0
	errors := []string{}

	for _, def := range defs {
		// Verificar se já existe uma definição para este bit nesta word
		var count int64
		tx.Model(&FaultDefinition{}).
			Where("plc_id = ? AND db_number = ? AND byte_offset = ? AND bit_offset = ?",
				def.PLCID, def.DBNumber, def.ByteOffset, def.BitOffset).
			Count(&count)

		if count > 0 {
			errors = append(errors, fmt.Sprintf(
				"Já existe definição para PLC %d, DB %d, Byte %d, Bit %d",
				def.PLCID, def.DBNumber, def.ByteOffset, def.BitOffset))
			continue
		}

		// Inserir definição
		if err := tx.Create(&def).Error; err != nil {
			errors = append(errors, err.Error())
			continue
		}

		inserted++
	}

	// Decidir se faz commit ou rollback
	if inserted > 0 {
		tx.Commit()

		// Registrar log de auditoria
		userID := ctx.Locals("user_id").(uint)
		userName := ctx.Locals("user_name").(string)

		models.RegistrarAuditoria(
			userID,
			userName,
			"Importar",
			"FaultDefinitions",
			ctx.IP(),
			map[string]interface{}{
				"total_importado": inserted,
				"total_erros":     len(errors),
			},
		)

		// Recarregar definições no gerenciador de falhas
		go c.faultManager.ReloadDefinitions()
	} else {
		tx.Rollback()
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":        true,
		"mensagem":       fmt.Sprintf("%d definições importadas com sucesso", inserted),
		"total_inserido": inserted,
		"total_erros":    len(errors),
		"erros":          errors,
	})
}
