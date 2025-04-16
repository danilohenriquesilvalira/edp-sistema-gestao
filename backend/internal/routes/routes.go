package routes

import (
	"github.com/danilo/edp_gestao_utilizadores/internal/controllers"
	"github.com/danilo/edp_gestao_utilizadores/internal/middleware"
	"github.com/danilo/edp_gestao_utilizadores/internal/plc"
	"github.com/gofiber/fiber/v2"
)

// SetupRoutes configura todas as rotas da aplicação
func SetupRoutes(app *fiber.App, plcManager *plc.Manager) {
	// API grupo
	api := app.Group("/api")

	// Rotas de autenticação (públicas)
	SetupAuthRoutes(api.Group("/auth"))

	// Rotas de recuperação de senha (públicas)
	SetupPasswordRoutes(api.Group("/password"))

	// Rotas protegidas (requerem autenticação)
	protected := api.Group("/", middleware.AuthMiddleware())

	// Aplicar middleware de rastreamento de atividade a todas as rotas protegidas
	protected.Use(middleware.ActivityTrackingMiddleware())

	// Rotas de utilizadores
	SetupUserRoutes(protected.Group("/utilizadores"))

	// Rotas de configurações do sistema
	SetupConfigRoutes(protected.Group("/configuracoes"))

	// Rotas de auditoria
	SetupAuditRoutes(protected.Group("/auditoria"))

	// Rotas de permissões
	SetupPermissionRoutes(protected.Group("/permissoes"))

	// Novas rotas
	SetupStatusRoutes(protected.Group("/status"))
	SetupPreferencesRoutes(protected.Group("/preferencias"))
	SetupSessionRoutes(protected.Group("/sessoes"))

	// Rotas PLC (requer autenticação e permissão de admin)
	adminRouter := protected.Group("/", middleware.AdminOnlyMiddleware())
	SetupPLCRoutes(adminRouter.Group("/plc"), plcManager)

	// Novo: Rotas para o sistema de falhas
	faultManager := plcManager.GetFaultManager()
	setupFaultRoutes(protected.Group("/falhas"), plcManager, faultManager)
}

// SetupAuthRoutes configura as rotas de autenticação
func SetupAuthRoutes(router fiber.Router) {
	router.Post("/login", controllers.Login)
	router.Post("/refresh", controllers.RefreshToken)
	router.Post("/logout", middleware.AuthMiddleware(), controllers.Logout)
	router.Get("/me", middleware.AuthMiddleware(), controllers.GetCurrentUser)
}

// SetupPasswordRoutes configura as rotas de recuperação e alteração de senha
func SetupPasswordRoutes(router fiber.Router) {
	router.Post("/forgot", controllers.ForgotPassword)
	router.Post("/reset", controllers.ResetPassword)
	router.Post("/change", middleware.AuthMiddleware(), controllers.ChangePassword)
}

// SetupUserRoutes configura as rotas de gestão de utilizadores
func SetupUserRoutes(router fiber.Router) {
	// Rotas disponíveis para todos os utilizadores autenticados
	router.Get("/me", controllers.GetCurrentUser)
	// Adicionar rotas para gerenciar a própria foto de perfil
	router.Post("/me/avatar", controllers.UploadMyProfilePicture)
	router.Delete("/me/avatar", controllers.RemoveMyProfilePicture)

	// Rotas que requerem permissão de administrador
	adminRouter := router.Group("/", middleware.AdminOnlyMiddleware())

	adminRouter.Get("/", controllers.GetAllUsers)
	adminRouter.Post("/", controllers.CreateUser)
	adminRouter.Get("/:id", controllers.GetUserByID)
	adminRouter.Put("/:id", controllers.UpdateUser)
	adminRouter.Delete("/:id", controllers.DeleteUser)
	adminRouter.Post("/:id/avatar", controllers.UploadProfilePicture)
	adminRouter.Delete("/:id/avatar", controllers.RemoveProfilePicture)
}

// SetupConfigRoutes configura as rotas de configurações do sistema
func SetupConfigRoutes(router fiber.Router) {
	// Configurações do sistema são acessíveis apenas por administradores
	router.Use(middleware.AdminOnlyMiddleware())

	router.Get("/", controllers.GetAllConfigs)
	router.Post("/", controllers.CreateConfig)
	router.Get("/:id", controllers.GetConfigByID)
	router.Get("/chave/:chave", controllers.GetConfigByKey)
	router.Put("/:id", controllers.UpdateConfig)
	router.Delete("/:id", controllers.DeleteConfig)
}

// SetupAuditRoutes configura as rotas de logs de auditoria
func SetupAuditRoutes(router fiber.Router) {
	// Logs de auditoria são acessíveis apenas por administradores
	router.Use(middleware.AdminOnlyMiddleware())

	router.Get("/", controllers.GetAuditLogs)
	router.Get("/:id", controllers.GetAuditLogByID)
	router.Get("/acoes", controllers.GetAuditActions)
	router.Get("/modulos", controllers.GetAuditModules)
}

// SetupPermissionRoutes configura as rotas de permissões
func SetupPermissionRoutes(router fiber.Router) {
	// Permissões são gerenciadas apenas por administradores
	router.Use(middleware.AdminOnlyMiddleware())

	// Rotas de permissões
	router.Get("/", controllers.GetAllPermissions)
	router.Post("/", controllers.CreatePermission)
	router.Get("/:id", controllers.GetPermissionByID)
	router.Put("/:id", controllers.UpdatePermission)
	router.Delete("/:id", controllers.DeletePermission)

	// Rotas de perfil e permissões
	router.Get("/perfil/:perfil", controllers.GetProfilePermissions)
	router.Put("/perfil/:perfil", controllers.SetProfilePermissions)
}

// SetupStatusRoutes configura as rotas de status de utilizadores
func SetupStatusRoutes(router fiber.Router) {
	// Rota para atualizar o status do próprio utilizador (heartbeat)
	router.Post("/heartbeat", controllers.UpdateUserStatus)

	// Rotas que requerem permissão de administrador
	adminRouter := router.Group("/", middleware.AdminOnlyMiddleware())

	adminRouter.Get("/ativos", controllers.GetActiveUsers)
	adminRouter.Get("/:id", controllers.GetUserStatus)
}

// SetupPreferencesRoutes configura as rotas de preferências
func SetupPreferencesRoutes(router fiber.Router) {
	// Rotas para o próprio utilizador
	router.Get("/", controllers.GetUserPreferences)
	router.Put("/", controllers.UpdateUserPreferences)

	// Rotas que requerem permissão de administrador
	adminRouter := router.Group("/", middleware.AdminOnlyMiddleware())
	adminRouter.Get("/:id", controllers.GetUserPreferencesByID)
}

// SetupSessionRoutes configura as rotas de sessões
func SetupSessionRoutes(router fiber.Router) {
	// Obter sessões e encerrar sessões
	router.Get("/:id", controllers.GetUserSessions)
	router.Delete("/:id", controllers.TerminateSession)
	router.Delete("/utilizador/:id", controllers.TerminateAllUserSessions)
}

// setupFaultRoutes configura as rotas para gerenciamento de falhas
// Nota: Função com inicial minúscula para que não seja exportada e evitar conflito
func setupFaultRoutes(router fiber.Router, manager *plc.Manager, faultManager *plc.FaultManager) {
	controller := plc.NewFaultController(manager, faultManager)

	// Rotas para visualização (disponíveis para todos os usuários autenticados)
	router.Get("/ativas", controller.GetActiveFaults)
	router.Get("/historico", controller.GetFaultHistory)
	router.Post("/reconhecer/:id", controller.AcknowledgeFault)

	// Rotas para metadados
	router.Get("/eclusas", controller.GetEclusasList)
	router.Get("/subsistemas", controller.GetSubsistemasList)

	// Rotas para administração (requerem permissão de administrador)
	adminRouter := router.Group("/admin", middleware.AdminOnlyMiddleware())

	// Rotas para definições de falhas
	adminRouter.Get("/definicoes", controller.GetAllFaultDefinitions)
	adminRouter.Get("/definicoes/:id", controller.GetFaultDefinitionByID)
	adminRouter.Post("/definicoes", controller.CreateFaultDefinition)
	adminRouter.Put("/definicoes/:id", controller.UpdateFaultDefinition)
	adminRouter.Delete("/definicoes/:id", controller.DeleteFaultDefinition)
	adminRouter.Post("/definicoes/importar", controller.ImportFaultDefinitions)
}
