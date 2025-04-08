package models

import (
	"time"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
)

// PreferenciasUtilizador representa as preferências de um utilizador
type PreferenciasUtilizador struct {
	UtilizadorID uint      `gorm:"primaryKey" json:"utilizador_id"`
	TemaEscuro   bool      `gorm:"default:false" json:"tema_escuro"`
	Idioma       string    `gorm:"size:10;default:'pt'" json:"idioma"`
	Notificacoes bool      `gorm:"default:true" json:"notificacoes"`
	Dashboard    string    `gorm:"type:jsonb;default:'{}'" json:"dashboard"`
	AtualizadoEm time.Time `gorm:"autoUpdateTime" json:"atualizado_em"`
}

// TableName especifica o nome da tabela para o modelo PreferenciasUtilizador
func (PreferenciasUtilizador) TableName() string {
	return "preferencias_utilizadores"
}

// GetUserPreferences obtém as preferências de um utilizador, criando um registro padrão se não existir
func GetUserPreferences(userID uint) (*PreferenciasUtilizador, error) {
	var prefs PreferenciasUtilizador

	result := config.DB.Where("utilizador_id = ?", userID).First(&prefs)

	if result.Error != nil {
		// Criar preferências padrão
		prefs = PreferenciasUtilizador{
			UtilizadorID: userID,
			TemaEscuro:   false,
			Idioma:       "pt",
			Notificacoes: true,
			Dashboard:    "{}",
		}

		if err := config.DB.Create(&prefs).Error; err != nil {
			return nil, err
		}
	}

	return &prefs, nil
}

// UpdateUserPreferences atualiza as preferências de um utilizador
func UpdateUserPreferences(prefs *PreferenciasUtilizador) error {
	// Verificar se já existe
	var count int64
	config.DB.Model(&PreferenciasUtilizador{}).Where("utilizador_id = ?", prefs.UtilizadorID).Count(&count)

	if count == 0 {
		// Criar novo registro
		return config.DB.Create(prefs).Error
	}

	// Atualizar registro existente
	return config.DB.Model(&PreferenciasUtilizador{}).
		Where("utilizador_id = ?", prefs.UtilizadorID).
		Updates(map[string]interface{}{
			"tema_escuro":  prefs.TemaEscuro,
			"idioma":       prefs.Idioma,
			"notificacoes": prefs.Notificacoes,
			"dashboard":    prefs.Dashboard,
		}).Error
}
