package controllers

import (
	"strconv"

	"github.com/danilo/edp_gestao_utilizadores/internal/models"
	"github.com/gofiber/fiber/v2"
)

// UpdatePreferencesRequest é a estrutura para atualizar preferências
type UpdatePreferencesRequest struct {
	TemaEscuro   bool   `json:"tema_escuro"`
	Idioma       string `json:"idioma" validate:"omitempty,oneof=pt en es fr"`
	Notificacoes bool   `json:"notificacoes"`
	Dashboard    string `json:"dashboard" validate:"omitempty,json"`
}

// GetUserPreferences retorna as preferências do utilizador atual
func GetUserPreferences(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	prefs, err := models.GetUserPreferences(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao obter preferências",
			"erro":     err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   prefs,
	})
}

// UpdateUserPreferences atualiza as preferências do utilizador atual
func UpdateUserPreferences(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	var req UpdatePreferencesRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Formato de solicitação inválido",
			"erro":     err.Error(),
		})
	}

	// Obter preferências atuais
	prefs, err := models.GetUserPreferences(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao obter preferências atuais",
			"erro":     err.Error(),
		})
	}

	// Atualizar campos
	prefs.TemaEscuro = req.TemaEscuro
	if req.Idioma != "" {
		prefs.Idioma = req.Idioma
	}
	prefs.Notificacoes = req.Notificacoes
	if req.Dashboard != "" {
		prefs.Dashboard = req.Dashboard
	}

	// Salvar alterações
	if err := models.UpdateUserPreferences(prefs); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao atualizar preferências",
			"erro":     err.Error(),
		})
	}

	// Registrar log de auditoria
	userName := c.Locals("user_name").(string)
	models.RegistrarAuditoria(
		userID,
		userName,
		"Atualizar",
		"Preferências",
		c.IP(),
		map[string]interface{}{
			"tema_escuro":  prefs.TemaEscuro,
			"idioma":       prefs.Idioma,
			"notificacoes": prefs.Notificacoes,
		},
	)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Preferências atualizadas com sucesso",
		"dados":    prefs,
	})
}

// GetUserPreferencesByID retorna as preferências de um utilizador específico (apenas admin)
func GetUserPreferencesByID(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	prefs, err := models.GetUserPreferences(uint(id))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao obter preferências",
			"erro":     err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   prefs,
	})
}
