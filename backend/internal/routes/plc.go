package routes

import (
	"github.com/danilo/edp_gestao_utilizadores/internal/plc"
	"github.com/gofiber/fiber/v2"
)

// SetupPLCRoutes configura as rotas para gerenciamento de PLCs
func SetupPLCRoutes(router fiber.Router, manager *plc.Manager) {
	controller := plc.NewController(manager)

	// Rotas para PLCs
	router.Get("/", controller.GetAllPLCs)
	router.Post("/", controller.CreatePLC)
	router.Get("/:id", controller.GetPLCByID)
	router.Put("/:id", controller.UpdatePLC)
	router.Delete("/:id", controller.DeletePLC)

	// Rotas para Tags
	router.Get("/:id/tags", controller.GetPLCTags)
	router.Get("/tags/:id", controller.GetTagByID)
	router.Post("/tags", controller.CreateTag)
	router.Put("/tags/:id", controller.UpdateTag)
	router.Delete("/tags/:id", controller.DeleteTag)

	// Rotas para operações de tags
	router.Get("/tags/:id/value", controller.ReadTagValue)
	router.Post("/tags/:id/value", controller.WriteTagValue)
}
