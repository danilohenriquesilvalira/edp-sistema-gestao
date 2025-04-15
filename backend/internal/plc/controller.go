package plc

import (
	"strconv"
	"time"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
	"github.com/danilo/edp_gestao_utilizadores/internal/models"
	"github.com/gofiber/fiber/v2"
)

// Controller gerencia endpoints da API para PLCs e Tags
type Controller struct {
	manager *Manager
}

// NewController cria um novo controlador PLC
func NewController(manager *Manager) *Controller {
	return &Controller{
		manager: manager,
	}
}

// GetAllPLCs retorna todos os PLCs com paginação
func (c *Controller) GetAllPLCs(ctx *fiber.Ctx) error {
	var plcs []PLC

	result := config.DB.Find(&plcs)
	if result.Error != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao obter PLCs",
			"erro":     result.Error.Error(),
		})
	}

	// Adicionar status de conexão para PLCs ativos
	for i, plc := range plcs {
		if activePLC, exists := c.manager.GetPLC(plc.ID); exists {
			plcs[i].Conectado = activePLC.Conectado
			plcs[i].UltimoErro = activePLC.UltimoErro
			plcs[i].UltimaLeitura = activePLC.UltimaLeitura
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   plcs,
		"total":   len(plcs),
	})
}

// GetPLCByID retorna um PLC específico pelo ID
func (c *Controller) GetPLCByID(ctx *fiber.Ctx) error {
	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	var plc PLC
	result := config.DB.First(&plc, id)
	if result.Error != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "PLC não encontrado",
		})
	}

	// Adicionar status de conexão se o PLC estiver ativo
	if activePLC, exists := c.manager.GetPLC(uint(id)); exists {
		plc.Conectado = activePLC.Conectado
		plc.UltimoErro = activePLC.UltimoErro
		plc.UltimaLeitura = activePLC.UltimaLeitura
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   plc,
	})
}

// CreatePLC cria um novo PLC
func (c *Controller) CreatePLC(ctx *fiber.Ctx) error {
	var plc PLC

	if err := ctx.BodyParser(&plc); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Formato de solicitação inválido",
			"erro":     err.Error(),
		})
	}

	result := config.DB.Create(&plc)
	if result.Error != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao criar PLC",
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
		"PLC",
		ctx.IP(),
		map[string]interface{}{
			"id":       plc.ID,
			"nome":     plc.Nome,
			"endereco": plc.IPAddress,
		},
	)

	// Se o PLC estiver ativo, adicioná-lo ao gerenciador
	if plc.Ativo {
		c.manager.AddPLC(&plc)
	}

	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "PLC criado com sucesso",
		"dados":    plc,
	})
}

// UpdatePLC atualiza um PLC existente
func (c *Controller) UpdatePLC(ctx *fiber.Ctx) error {
	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	var plc PLC
	result := config.DB.First(&plc, id)
	if result.Error != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "PLC não encontrado",
		})
	}

	oldActive := plc.Ativo

	if err := ctx.BodyParser(&plc); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Formato de solicitação inválido",
			"erro":     err.Error(),
		})
	}

	// Garantir que o ID não mude
	plc.ID = uint(id)

	result = config.DB.Save(&plc)
	if result.Error != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao atualizar PLC",
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
		"PLC",
		ctx.IP(),
		map[string]interface{}{
			"id":       plc.ID,
			"nome":     plc.Nome,
			"endereco": plc.IPAddress,
			"ativo":    plc.Ativo,
		},
	)

	// Atualizar o gerenciador se o status ativo mudou
	if oldActive != plc.Ativo {
		if plc.Ativo {
			c.manager.AddPLC(&plc)
		} else {
			c.manager.RemovePLC(plc.ID)
		}
	} else if plc.Ativo {
		// Se continua ativo, reiniciar a conexão para aplicar mudanças
		c.manager.RestartPLC(&plc)
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "PLC atualizado com sucesso",
		"dados":    plc,
	})
}

// DeletePLC remove um PLC
func (c *Controller) DeletePLC(ctx *fiber.Ctx) error {
	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	var plc PLC
	result := config.DB.First(&plc, id)
	if result.Error != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "PLC não encontrado",
		})
	}

	// Remover do gerenciador primeiro se estiver ativo
	if plc.Ativo {
		c.manager.RemovePLC(plc.ID)
	}

	// Excluir o PLC (isso excluirá também as tags devido à restrição ON DELETE CASCADE)
	result = config.DB.Delete(&plc)
	if result.Error != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao excluir PLC",
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
		"PLC",
		ctx.IP(),
		map[string]interface{}{
			"id":   plc.ID,
			"nome": plc.Nome,
		},
	)

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "PLC excluído com sucesso",
	})
}

// GetPLCTags retorna todas as tags de um PLC específico
func (c *Controller) GetPLCTags(ctx *fiber.Ctx) error {
	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	var tags []Tag
	result := config.DB.Where("plc_id = ?", id).Find(&tags)
	if result.Error != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao obter tags",
			"erro":     result.Error.Error(),
		})
	}

	// Adicionar valores atuais para tags se o PLC estiver ativo
	if activePLC, exists := c.manager.GetPLC(uint(id)); exists {
		for i, tag := range tags {
			for _, activeTag := range activePLC.Tags {
				if activeTag.ID == tag.ID {
					tags[i].UltimoValor = activeTag.UltimoValor
					tags[i].UltimaLeitura = activeTag.UltimaLeitura
					tags[i].UltimoErro = activeTag.UltimoErro
					tags[i].UltimoErroTime = activeTag.UltimoErroTime
					break
				}
			}
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   tags,
		"total":   len(tags),
	})
}

// GetTagByID retorna uma tag específica pelo ID
func (c *Controller) GetTagByID(ctx *fiber.Ctx) error {
	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	var tag Tag
	result := config.DB.First(&tag, id)
	if result.Error != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Tag não encontrada",
		})
	}

	// Adicionar valor atual se o PLC estiver ativo
	if activePLC, exists := c.manager.GetPLC(tag.PLCID); exists {
		for _, activeTag := range activePLC.Tags {
			if activeTag.ID == tag.ID {
				tag.UltimoValor = activeTag.UltimoValor
				tag.UltimaLeitura = activeTag.UltimaLeitura
				tag.UltimoErro = activeTag.UltimoErro
				tag.UltimoErroTime = activeTag.UltimoErroTime
				break
			}
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   tag,
	})
}

// CreateTag cria uma nova tag
func (c *Controller) CreateTag(ctx *fiber.Ctx) error {
	var tag Tag

	if err := ctx.BodyParser(&tag); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Formato de solicitação inválido",
			"erro":     err.Error(),
		})
	}

	// Verificar se o PLC existe
	var plc PLC
	result := config.DB.First(&plc, tag.PLCID)
	if result.Error != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "PLC não encontrado",
		})
	}

	result = config.DB.Create(&tag)
	if result.Error != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao criar tag",
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
		"Tag",
		ctx.IP(),
		map[string]interface{}{
			"id":        tag.ID,
			"nome":      tag.Nome,
			"plc_id":    tag.PLCID,
			"db_number": tag.DBNumber,
			"tipo":      tag.Tipo,
		},
	)

	// Se o PLC estiver ativo e a tag estiver ativa, adicioná-la ao PLC
	if plc.Ativo && tag.Ativo {
		c.manager.AddTagToPLC(tag.PLCID, &tag)
	}

	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Tag criada com sucesso",
		"dados":    tag,
	})
}

// UpdateTag atualiza uma tag existente
func (c *Controller) UpdateTag(ctx *fiber.Ctx) error {
	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	var tag Tag
	result := config.DB.First(&tag, id)
	if result.Error != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Tag não encontrada",
		})
	}

	oldPLCID := tag.PLCID
	oldActive := tag.Ativo

	if err := ctx.BodyParser(&tag); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Formato de solicitação inválido",
			"erro":     err.Error(),
		})
	}

	// Garantir que o ID não mude
	tag.ID = uint(id)

	// Verificar se o PLC existe
	var plc PLC
	result = config.DB.First(&plc, tag.PLCID)
	if result.Error != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "PLC não encontrado",
		})
	}

	result = config.DB.Save(&tag)
	if result.Error != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao atualizar tag",
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
		"Tag",
		ctx.IP(),
		map[string]interface{}{
			"id":        tag.ID,
			"nome":      tag.Nome,
			"plc_id":    tag.PLCID,
			"db_number": tag.DBNumber,
			"tipo":      tag.Tipo,
			"ativo":     tag.Ativo,
		},
	)

	// Atualizar o gerenciador se necessário
	plcActive := plc.Ativo

	// Caso 1: A tag mudou de PLC
	if oldPLCID != tag.PLCID {
		// Remover do PLC antigo
		if oldActive {
			c.manager.RemoveTagFromPLC(oldPLCID, tag.ID)
		}

		// Adicionar ao novo PLC se ambos estiverem ativos
		if plcActive && tag.Ativo {
			c.manager.AddTagToPLC(tag.PLCID, &tag)
		}
	} else if oldActive != tag.Ativo {
		// Caso 2: O status ativo da tag mudou
		if tag.Ativo && plcActive {
			// Ativar tag
			c.manager.AddTagToPLC(tag.PLCID, &tag)
		} else {
			// Desativar tag
			c.manager.RemoveTagFromPLC(tag.PLCID, tag.ID)
		}
	} else if tag.Ativo && plcActive {
		// Caso 3: Tag continua ativa, atualizar configuração
		c.manager.UpdateTagInPLC(tag.PLCID, &tag)
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Tag atualizada com sucesso",
		"dados":    tag,
	})
}

// DeleteTag remove uma tag
func (c *Controller) DeleteTag(ctx *fiber.Ctx) error {
	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	var tag Tag
	result := config.DB.First(&tag, id)
	if result.Error != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Tag não encontrada",
		})
	}

	// Remover do gerenciador primeiro se estiver ativa
	if tag.Ativo {
		c.manager.RemoveTagFromPLC(tag.PLCID, tag.ID)
	}

	// Excluir a tag
	result = config.DB.Delete(&tag)
	if result.Error != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao excluir tag",
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
		"Tag",
		ctx.IP(),
		map[string]interface{}{
			"id":     tag.ID,
			"nome":   tag.Nome,
			"plc_id": tag.PLCID,
		},
	)

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Tag excluída com sucesso",
	})
}

// ReadTagValue lê o valor atual de uma tag
func (c *Controller) ReadTagValue(ctx *fiber.Ctx) error {
	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	var tag Tag
	result := config.DB.First(&tag, id)
	if result.Error != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Tag não encontrada",
		})
	}

	value, err := c.manager.ReadTag(tag.PLCID, tag.ID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao ler tag",
			"erro":     err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados": fiber.Map{
			"id":        tag.ID,
			"nome":      tag.Nome,
			"valor":     value,
			"timestamp": time.Now(),
		},
	})
}

// WriteTagValue escreve um valor em uma tag
func (c *Controller) WriteTagValue(ctx *fiber.Ctx) error {
	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	var tag Tag
	result := config.DB.First(&tag, id)
	if result.Error != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Tag não encontrada",
		})
	}

	var payload struct {
		Valor interface{} `json:"valor"`
	}

	if err := ctx.BodyParser(&payload); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Formato de solicitação inválido",
			"erro":     err.Error(),
		})
	}

	if err := c.manager.WriteTag(tag.PLCID, tag.ID, payload.Valor); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao escrever na tag",
			"erro":     err.Error(),
		})
	}

	// Registrar log de auditoria
	userID := ctx.Locals("user_id").(uint)
	userName := ctx.Locals("user_name").(string)

	models.RegistrarAuditoria(
		userID,
		userName,
		"Escrever",
		"Tag",
		ctx.IP(),
		map[string]interface{}{
			"id":    tag.ID,
			"nome":  tag.Nome,
			"valor": payload.Valor,
		},
	)

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Valor escrito com sucesso",
	})
}
