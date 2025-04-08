package main

import (
	"log"
	"os"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
	"github.com/danilo/edp_gestao_utilizadores/internal/routes"
	"github.com/danilo/edp_gestao_utilizadores/internal/tasks"
	"github.com/danilo/edp_gestao_utilizadores/internal/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
)

func main() {
	// Carregar variáveis de ambiente
	if err := godotenv.Load(); err != nil {
		log.Println("Aviso: Arquivo .env não encontrado")
	}

	// Inicializar conexões de banco de dados
	config.InitDatabase()
	config.InitRedis()

	// Inicializar configurações básicas
	utils.InitializeDatabase()

	// Iniciar tarefas de limpeza em background
	tasks.StartCleanupTasks()

	// Criar aplicação Fiber
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"sucesso":  false,
				"mensagem": err.Error(),
			})
		},
	})

	// Middleware global
	app.Use(logger.New())
	app.Use(recover.New())

	// Correção da configuração CORS
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173, http://127.0.0.1:5173",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE",
		AllowCredentials: true,
	}))

	// Servir arquivos estáticos para avatares
	app.Static("/uploads", "./uploads")

	// Configurar rotas
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"mensagem": "API de Gestão de Utilizadores EDP",
			"estado":   "online",
		})
	})

	// Configurar grupos de rotas
	routes.SetupRoutes(app)

	// Iniciar servidor
	host := os.Getenv("HOST")
	if host == "" {
		host = "0.0.0.0" // Escutar em todos os IPs disponíveis
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Servidor iniciado em http://%s:%s", host, port)
	if err := app.Listen(host + ":" + port); err != nil {
		log.Fatalf("Erro ao iniciar servidor: %v", err)
	}
}
