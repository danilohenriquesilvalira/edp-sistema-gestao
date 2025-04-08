package models

import (
	"github.com/danilo/edp_gestao_utilizadores/internal/config"
	"gorm.io/gorm"
)

// GetDB é uma função de utilitário para obter o banco de dados
func GetDB() *gorm.DB {
	return config.DB
}
