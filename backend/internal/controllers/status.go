package controllers

import (
	"strconv"
	"time"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
	"github.com/danilo/edp_gestao_utilizadores/internal/models"
	"github.com/gofiber/fiber/v2"
)

// StatusResponse é a estrutura de resposta para um status de utilizador
type StatusResponse struct {
	UtilizadorID    uint      `json:"utilizador_id"`
	NomeUtilizador  string    `json:"nome_utilizador"`
	Email           string    `json:"email"`
	Online          bool      `json:"online"`
	UltimaAtividade time.Time `json:"ultima_atividade"`
	IP              string    `json:"ip"`
	Dispositivo     string    `json:"dispositivo"`
}

// GetActiveUsers retorna todos os utilizadores ativos
func GetActiveUsers(c *fiber.Ctx) error {
	// Definir tempo limite para considerar um utilizador como ativo (em minutos)
	timeoutMinutes, _ := strconv.Atoi(c.Query("timeout", "5"))

	statuses, err := models.GetActiveUsers(timeoutMinutes)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao buscar utilizadores ativos",
			"erro":     err.Error(),
		})
	}

	// Se não houver utilizadores ativos, retornar lista vazia
	if len(statuses) == 0 {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"sucesso": true,
			"dados":   []StatusResponse{},
			"total":   0,
		})
	}

	// Obter informações adicionais dos utilizadores
	var responseStatuses []StatusResponse
	for _, status := range statuses {
		var user models.Utilizador
		if err := config.DB.First(&user, status.UtilizadorID).Error; err == nil {
			responseStatuses = append(responseStatuses, StatusResponse{
				UtilizadorID:    status.UtilizadorID,
				NomeUtilizador:  user.Nome,
				Email:           user.Email,
				Online:          status.Online,
				UltimaAtividade: status.UltimaAtividade,
				IP:              status.IP,
				Dispositivo:     status.Dispositivo,
			})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados":   responseStatuses,
		"total":   len(responseStatuses),
	})
}

// GetUserStatus retorna o status de um utilizador específico
func GetUserStatus(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "ID inválido",
		})
	}

	var status models.StatusUtilizador
	if err := config.DB.Where("utilizador_id = ?", id).First(&status).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Status do utilizador não encontrado",
		})
	}

	// Verificar se o utilizador está realmente ativo (considerando timeout)
	timeoutMinutes, _ := strconv.Atoi(c.Query("timeout", "5"))
	cutoffTime := time.Now().Add(-time.Minute * time.Duration(timeoutMinutes))

	if status.Online && status.UltimaAtividade.Before(cutoffTime) {
		status.Online = false
		config.DB.Save(&status)
	}

	// Obter informações do utilizador
	var user models.Utilizador
	if err := config.DB.First(&user, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Utilizador não encontrado",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso": true,
		"dados": StatusResponse{
			UtilizadorID:    status.UtilizadorID,
			NomeUtilizador:  user.Nome,
			Email:           user.Email,
			Online:          status.Online,
			UltimaAtividade: status.UltimaAtividade,
			IP:              status.IP,
			Dispositivo:     status.Dispositivo,
		},
	})
}

// UpdateUserStatus atualiza o status de um utilizador (usado para heartbeat)
func UpdateUserStatus(c *fiber.Ctx) error {
	// Obter ID do utilizador do contexto (definido pelo middleware de autenticação)
	userID := c.Locals("user_id").(uint)

	// Obter informações do request
	ip := c.IP()
	dispositivo := c.Get("User-Agent")

	// Atualizar status
	if err := models.AtualizarStatusUtilizador(userID, true, ip, dispositivo); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"sucesso":  false,
			"mensagem": "Erro ao atualizar status do utilizador",
			"erro":     err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"sucesso":  true,
		"mensagem": "Status atualizado com sucesso",
	})
}
