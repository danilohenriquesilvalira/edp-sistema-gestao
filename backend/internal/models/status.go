package models

import (
	"time"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
)

// StatusUtilizador representa o status de atividade de um utilizador
type StatusUtilizador struct {
	UtilizadorID    uint      `gorm:"primaryKey" json:"utilizador_id"`
	Online          bool      `gorm:"default:false" json:"online"`
	UltimaAtividade time.Time `json:"ultima_atividade"`
	IP              string    `gorm:"size:50" json:"ip"`
	Dispositivo     string    `gorm:"size:255" json:"dispositivo"` // Aumentado para 255
}

// TableName especifica o nome da tabela para o modelo StatusUtilizador
func (StatusUtilizador) TableName() string {
	return "status_utilizadores"
}

// AtualizarStatusUtilizador atualiza o status de um utilizador
func AtualizarStatusUtilizador(userID uint, online bool, ip string, dispositivo string) error {
	var status StatusUtilizador

	// Limitar o tamanho do dispositivo para evitar erro
	if len(dispositivo) > 250 {
		dispositivo = dispositivo[:250]
	}

	result := config.DB.Where("utilizador_id = ?", userID).First(&status)

	if result.Error != nil {
		// Criar novo registro se não existir
		status = StatusUtilizador{
			UtilizadorID:    userID,
			Online:          online,
			UltimaAtividade: time.Now(),
			IP:              ip,
			Dispositivo:     dispositivo,
		}
		return config.DB.Create(&status).Error
	}

	// Atualizar registro existente
	status.Online = online
	status.UltimaAtividade = time.Now()
	status.IP = ip
	status.Dispositivo = dispositivo

	return config.DB.Save(&status).Error
}

// GetActiveUsers retorna todos os utilizadores ativos
func GetActiveUsers(timeoutMinutes int) ([]StatusUtilizador, error) {
	var statuses []StatusUtilizador

	cutoffTime := time.Now().Add(-time.Minute * time.Duration(timeoutMinutes))

	err := config.DB.Where("online = ? AND ultima_atividade > ?", true, cutoffTime).Find(&statuses).Error

	return statuses, err
}

// LimparStatusOffline marca como offline utilizadores inativos há um determinado tempo
func LimparStatusOffline(timeoutMinutes int) error {
	cutoffTime := time.Now().Add(-time.Minute * time.Duration(timeoutMinutes))

	return config.DB.Model(&StatusUtilizador{}).
		Where("online = ? AND ultima_atividade < ?", true, cutoffTime).
		Updates(map[string]interface{}{"online": false}).Error
}
