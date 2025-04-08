package controllers

import (
	"strconv"
	"time"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
	"github.com/danilo/edp_gestao_utilizadores/internal/models"
	"github.com/gofiber/fiber/v2"
)

// SessionResponse é a estrutura de resposta para uma sessão
type SessionResponse struct {
	ID           uint      `json:"id"`
	UtilizadorID uint      `json:"utilizador_id"`
	IP           string    `json:"ip"`
	Dispositivo  string    `json:"dispositivo"`
	UserAgent    string    `json:"user_agent"`
	CriadoEm     time.Time `json:"criado_em"`
	ExpiraEm     time.Time `json:"expira_em"`
	Ativa        bool      `json:"ativa"`
}

// GetUserSessions retorna todas as sessões ativas de um utilizador
func GetUserSessions(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	// Verificar permissões: apenas admin ou o próprio utilizador
	userID := c.Locals("user_id").(uint)
	perfil := c.Locals("user_profile").(string)

	if perfil != "Administrador" && userID != uint(id) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Sem permissão para ver sessões de outro utilizador",
		})
	}

	// Definir se devemos mostrar apenas sessões ativas ou todas
	onlyActive := c.Query("ativas", "true") == "true"

	var sessions []models.Sessao
	query := config.DB.Where("utilizador_id = ?", id)

	if onlyActive {
		query = query.Where("expira_em > ?", time.Now())
	}

	if err := query.Order("criado_em DESC").Find(&sessions).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao buscar sessões",
			"erro":     err.Error(),
		})
	}

	// Preparar resposta
	var responseSessions []SessionResponse
	now := time.Now()

	for _, session := range sessions {
		responseSessions = append(responseSessions, SessionResponse{
			ID:           session.ID,
			UtilizadorID: session.UtilizadorID,
			IP:           session.IP,
			Dispositivo:  session.Dispositivo,
			UserAgent:    session.UserAgent,
			CriadoEm:     session.CriadoEm,
			ExpiraEm:     session.ExpiraEm,
			Ativa:        session.ExpiraEm.After(now),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   responseSessions,
		"total":   len(responseSessions),
	})
}

// TerminateSession encerra uma sessão específica
func TerminateSession(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID de sessão inválido",
		})
	}

	// Buscar a sessão
	var session models.Sessao
	if err := config.DB.First(&session, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Sessão não encontrada",
		})
	}

	// Verificar permissões: apenas admin ou o próprio utilizador
	userID := c.Locals("user_id").(uint)
	perfil := c.Locals("user_profile").(string)

	if perfil != "Administrador" && userID != session.UtilizadorID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Sem permissão para encerrar sessão de outro utilizador",
		})
	}

	// Invalidar a sessão
	if err := models.InvalidateSession(uint(id)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao encerrar sessão",
			"erro":     err.Error(),
		})
	}

	// Registrar log de auditoria
	userName := c.Locals("user_name").(string)
	models.RegistrarAuditoria(
		userID,
		userName,
		"Encerrar Sessão",
		"Sessões",
		c.IP(),
		map[string]interface{}{
			"sessao_id":     id,
			"utilizador_id": session.UtilizadorID,
		},
	)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Sessão encerrada com sucesso",
	})
}

// TerminateAllUserSessions encerra todas as sessões de um utilizador
func TerminateAllUserSessions(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	// Verificar permissões: apenas admin ou o próprio utilizador
	userID := c.Locals("user_id").(uint)
	perfil := c.Locals("user_profile").(string)

	if perfil != "Administrador" && userID != uint(id) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Sem permissão para encerrar sessões de outro utilizador",
		})
	}

	// Invalidar todas as sessões do utilizador
	if err := models.InvalidateAllUserSessions(uint(id)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao encerrar sessões",
			"erro":     err.Error(),
		})
	}

	// Excluir tokens de atualização
	config.DeleteAllUserRefreshTokens(uint(id))

	// Registrar log de auditoria
	userName := c.Locals("user_name").(string)
	models.RegistrarAuditoria(
		userID,
		userName,
		"Encerrar Todas Sessões",
		"Sessões",
		c.IP(),
		map[string]interface{}{
			"utilizador_id": id,
		},
	)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Todas as sessões do utilizador foram encerradas com sucesso",
	})
}
