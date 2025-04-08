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
		tokenTypeRaw, exists := claims["token_type"]
		if !exists {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"sucesso":  false,
				"mensagem": "Token inválido: tipo não especificado",
			})
		}

		tokenType, ok := tokenTypeRaw.(string)
		if !ok || tokenType != "access" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"sucesso":  false,
				"mensagem": "Tipo de token inválido",
			})
		}

		// Extrair ID do utilizador
		userIDRaw, exists := claims["sub"]
		if !exists {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"sucesso":  false,
				"mensagem": "Token inválido: ID do utilizador ausente",
			})
		}

		// Converter ID para uint
		var userID uint
		switch v := userIDRaw.(type) {
		case float64:
			userID = uint(v)
		case int:
			userID = uint(v)
		case uint:
			userID = v
		default:
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"sucesso":  false,
				"mensagem": "Token inválido: formato de ID incorreto",
			})
		}

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

		// Verificar outros campos essenciais
		if email, ok := claims["email"]; ok {
			c.Locals("user_email", email)
		}

		if name, ok := claims["name"]; ok {
			c.Locals("user_name", name)
		} else {
			// Fallback para o nome do banco de dados se não estiver no token
			c.Locals("user_name", user.Nome)
		}

		if profile, ok := claims["profile"]; ok {
			c.Locals("user_profile", profile)
		} else {
			// Fallback para o perfil do banco de dados
			c.Locals("user_profile", user.Perfil)
		}

		// Continuar para o próximo middleware/handler
		return c.Next()
	}
}

// AdminOnlyMiddleware verifica se o utilizador é um administrador
func AdminOnlyMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Obter perfil do utilizador do contexto
		userProfileRaw := c.Locals("user_profile")
		if userProfileRaw == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"sucesso":  false,
				"mensagem": "Usuário não autenticado",
			})
		}

		userProfile, ok := userProfileRaw.(string)
		if !ok {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"sucesso":  false,
				"mensagem": "Erro interno no processamento dos dados do usuário",
			})
		}

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
