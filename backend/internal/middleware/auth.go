package middleware

import (
	"fmt"
	"strings"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
	"github.com/danilo/edp_gestao_utilizadores/internal/models"
	"github.com/danilo/edp_gestao_utilizadores/internal/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware verifica se o utilizador está autenticado
func AuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Obter o token do cabeçalho de autorização
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"sucesso":  false,
				"mensagem": "Acesso não autorizado: Token não fornecido",
			})
		}

		// Verificar se o formato é "Bearer {token}"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"sucesso":  false,
				"mensagem": "Formato de token inválido",
			})
		}

		tokenString := parts[1]

		// Validar o token JWT
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Verificar algoritmo de assinatura
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("método de assinatura inesperado: %v", token.Header["alg"])
			}

			// Retornar chave de verificação
			return []byte(utils.GetJWTSecret()), nil
		})

		// Verificar erro na validação do token
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"sucesso":  false,
				"mensagem": "Token inválido",
				"erro":     err.Error(),
			})
		}

		// Verificar se o token é válido
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"sucesso":  false,
				"mensagem": "Token inválido",
			})
		}

		// Verificar tipo de token
		tokenType, ok := claims["token_type"].(string)
		if !ok || tokenType != "access" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"sucesso":  false,
				"mensagem": "Tipo de token inválido",
			})
		}

		// Extrair ID do utilizador
		userID := uint(claims["sub"].(float64))

		// Verificar se o utilizador existe e está ativo
		var user models.Utilizador
		result := config.DB.Where("id = ? AND estado = ?", userID, "Ativo").First(&user)
		if result.Error != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"sucesso":  false,
				"mensagem": "Utilizador não encontrado ou inativo",
			})
		}

		// Guardar informações do utilizador no contexto para uso posterior
		c.Locals("user_id", userID)
		c.Locals("user_email", claims["email"])
		c.Locals("user_name", claims["name"])
		c.Locals("user_profile", claims["profile"])

		// Continuar para o próximo middleware/handler
		return c.Next()
	}
}

// AdminOnlyMiddleware verifica se o utilizador é um administrador
func AdminOnlyMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Obter perfil do utilizador do contexto
		userProfile := c.Locals("user_profile").(string)

		// Verificar se é administrador
		if userProfile != "Administrador" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"sucesso":  false,
				"mensagem": "Apenas administradores podem aceder a este recurso",
			})
		}

		// Continuar para o próximo middleware/handler
		return c.Next()
	}
}
