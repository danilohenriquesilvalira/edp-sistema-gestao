package models

import (
	"time"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
)

// Sessao representa uma sessão de utilizador
type Sessao struct {
	ID           uint      `gorm:"primarykey" json:"id"`
	UtilizadorID uint      `gorm:"not null" json:"utilizador_id"`
	Token        string    `gorm:"size:500;not null" json:"-"` // Não expor o token
	IP           string    `gorm:"size:50" json:"ip"`
	Dispositivo  string    `gorm:"size:100" json:"dispositivo"`
	UserAgent    string    `gorm:"size:255" json:"user_agent"`
	CriadoEm     time.Time `gorm:"autoCreateTime" json:"criado_em"`
	ExpiraEm     time.Time `json:"expira_em"`
}

// TableName especifica o nome da tabela para o modelo Sessao
func (Sessao) TableName() string {
	return "sessoes"
}

// CreateSession cria uma nova sessão no banco de dados
func CreateSession(session *Sessao) error {
	return config.DB.Create(session).Error
}

// GetSessionByID busca uma sessão pelo ID
func GetSessionByID(id uint) (*Sessao, error) {
	var session Sessao
	result := config.DB.Where("id = ?", id).First(&session)
	if result.Error != nil {
		return nil, result.Error
	}
	return &session, nil
}

// GetSessionByToken busca uma sessão pelo token
func GetSessionByToken(token string) (*Sessao, error) {
	var session Sessao
	result := config.DB.Where("token = ?", token).First(&session)
	if result.Error != nil {
		return nil, result.Error
	}
	return &session, nil
}

// InvalidateSession invalida uma sessão definindo sua data de expiração para agora
func InvalidateSession(id uint) error {
	return config.DB.Model(&Sessao{}).
		Where("id = ?", id).
		Update("expira_em", time.Now()).
		Error
}

// InvalidateAllUserSessions invalida todas as sessões de um utilizador
func InvalidateAllUserSessions(userID uint) error {
	return config.DB.Model(&Sessao{}).
		Where("utilizador_id = ?", userID).
		Update("expira_em", time.Now()).
		Error
}
