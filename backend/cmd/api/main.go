package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
	"github.com/danilo/edp_gestao_utilizadores/internal/models"
	"github.com/danilo/edp_gestao_utilizadores/internal/plc"
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
	if err := godotenv.Load("../../.env"); err != nil {
		// Tentar carregar o .env na raiz do projeto
		if err := godotenv.Load(); err != nil {
			log.Println("Aviso: Arquivo .env não encontrado. Usando valores padrão.")
		}
	}

	// Inicializar conexões de banco de dados
	config.InitDatabase()
	config.InitRedis()

	// Migrar esquema do banco de dados para incluir as novas tabelas
	err := config.DB.AutoMigrate(
		&models.StatusUtilizador{},
		&models.PreferenciasUtilizador{},
		&plc.PLC{},
		&plc.Tag{},
		// Novas tabelas para sistema de falhas
		&plc.FaultDefinition{},
		&plc.FaultStatus{},
		&plc.FaultHistory{},
		&plc.WordMonitor{},
	)

	if err != nil {
		log.Printf("Aviso: erro na migração do banco de dados: %v", err)
	} else {
		log.Println("Esquema do banco de dados migrado com sucesso")
	}

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

	// Configuração CORS
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

	// Adicionar endpoint para informações sobre conexão NATS (para clientes)
	app.Get("/nats-info", func(c *fiber.Ctx) error {
		natsURL := os.Getenv("NATS_PUBLIC_URL")
		if natsURL == "" {
			natsURL = os.Getenv("NATS_URL")
		}
		if natsURL == "" {
			natsURL = "nats://localhost:4222"
		}

		// Se o URL começar com nats:// e não tivermos um NATS_PUBLIC_URL,
		// verificar se precisamos converter para ws:// para navegadores
		if natsURL[:7] == "nats://" && os.Getenv("NATS_PUBLIC_URL") == "" {
			// Converter para WebSocket para clientes de navegador
			natsURL = "ws://" + natsURL[7:]
			// Usar porta 8443 para WebSocket, caso esteja usando a padrão 4222
			if natsURL[len(natsURL)-5:] == ":4222" {
				natsURL = natsURL[:len(natsURL)-5] + ":8443"
			}
		}

		// Fornecer informações para o frontend se conectar ao NATS
		return c.JSON(fiber.Map{
			"url": natsURL,
			"subjects": map[string]string{
				"plc_status":  "plc.status",
				"tag_updates": "plc.tags.updates",
				"plc_updates": "plc.updates",
				"tag_write":   "plc.tags.write",
				// Novos tópicos para falhas
				"fault_updates": "eclusa.falhas",
				"fault_ack":     "eclusa.falhas.reconhecidas",
			},
		})
	})

	// Inicializar gerenciador PLC
	log.Println("Inicializando gerenciador PLC...")
	plcManager := plc.NewManager()
	if err := plcManager.Initialize(app); err != nil {
		log.Printf("Aviso: Falha ao inicializar gerenciador PLC: %v", err)
	} else {
		log.Println("Gerenciador PLC inicializado com sucesso")
	}

	// Configurar grupos de rotas
	routes.SetupRoutes(app, plcManager)

	// Configurar sinal para encerramento gracioso
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		log.Println("Servidor recebeu sinal de encerramento")

		// Parar o gerenciador PLC
		if plcManager != nil {
			log.Println("Desligando gerenciador PLC...")
			plcManager.Stop()
		}

		log.Println("Servidor encerrado com sucesso")
		os.Exit(0)
	}()

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
