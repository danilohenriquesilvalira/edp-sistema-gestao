package middleware

import (
	"github.com/danilo/edp_gestao_utilizadores/internal/models"
	"github.com/gofiber/fiber/v2"
)

// ActivityTrackingMiddleware atualiza a última atividade do utilizador
func ActivityTrackingMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Continuar para o próximo middleware/handler
		err := c.Next()

		// Após a resposta, atualizar o status se o utilizador estiver autenticado
		if userID, ok := c.Locals("user_id").(uint); ok {
			// Não precisamos verificar o erro aqui, pois não queremos interromper a resposta
			models.AtualizarStatusUtilizador(
				userID,
				true,
				c.IP(),
				c.Get("User-Agent"),
			)
		}

		return err
	}
}
