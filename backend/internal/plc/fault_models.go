package plc

import (
	"time"
)

// FaultDefinition representa a definição de uma falha/evento monitorado
type FaultDefinition struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	PLCID      uint      `json:"plc_id" gorm:"not null;column:plc_id"`
	WordName   string    `json:"word_name" gorm:"size:100;not null"`
	DBNumber   int       `json:"db_number" gorm:"not null;column:db_number"`
	ByteOffset int       `json:"byte_offset" gorm:"not null;column:byte_offset"`
	BitOffset  int       `json:"bit_offset" gorm:"not null;check:bit_offset >= 0 AND bit_offset <= 15"`
	Eclusa     string    `json:"eclusa" gorm:"size:50;not null"`
	Subsistema string    `json:"subsistema" gorm:"size:50;not null"`
	Descricao  string    `json:"descricao" gorm:"type:text;not null"`
	Tipo       string    `json:"tipo" gorm:"size:20;not null"` // 'Alarme' ou 'Evento'
	Ativo      bool      `json:"ativo" gorm:"not null;default:true"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// FaultStatus representa o estado atual de uma falha
type FaultStatus struct {
	FaultID         uint       `json:"fault_id" gorm:"primaryKey"`
	Ativo           bool       `json:"ativo" gorm:"not null;default:false"`
	InicioTimestamp *time.Time `json:"inicio_timestamp"`
	Reconhecido     bool       `json:"reconhecido" gorm:"not null;default:false"`
	ReconhecidoPor  *uint      `json:"reconhecido_por"`
	ReconhecidoEm   *time.Time `json:"reconhecido_em"`
}

// FaultHistory representa o histórico de uma falha (quando foi ativada e resolvida)
type FaultHistory struct {
	ID              uint       `json:"id" gorm:"primaryKey"`
	FaultID         uint       `json:"fault_id" gorm:"not null"`
	InicioTimestamp time.Time  `json:"inicio_timestamp" gorm:"not null"`
	FimTimestamp    time.Time  `json:"fim_timestamp" gorm:"not null"`
	DuracaoSegundos int        `json:"duracao_segundos" gorm:"not null"`
	Reconhecido     bool       `json:"reconhecido" gorm:"not null;default:false"`
	ReconhecidoPor  *uint      `json:"reconhecido_por"`
	ReconhecidoEm   *time.Time `json:"reconhecido_em"`
	Notas           *string    `json:"notas"`
	CreatedAt       time.Time  `json:"created_at"`
}

// WordMonitor representa o monitoramento de uma word no PLC
type WordMonitor struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	PLCID      uint      `json:"plc_id" gorm:"not null"`
	DBNumber   int       `json:"db_number" gorm:"not null"`
	ByteOffset int       `json:"byte_offset" gorm:"not null"`
	LastValue  uint16    `json:"last_value" gorm:"not null;default:0"`
	LastChange time.Time `json:"last_change" gorm:"not null"`
}

// TableName define o nome da tabela para FaultDefinition
func (FaultDefinition) TableName() string {
	return "fault_definitions"
}

// TableName define o nome da tabela para FaultStatus
func (FaultStatus) TableName() string {
	return "fault_status"
}

// TableName define o nome da tabela para FaultHistory
func (FaultHistory) TableName() string {
	return "fault_history"
}

// TableName define o nome da tabela para WordMonitor
func (WordMonitor) TableName() string {
	return "word_monitor"
}

// FaultEvent é usado para enviar informações sobre falhas para o frontend
type FaultEvent struct {
	ID              uint      `json:"id"`
	PLCID           uint      `json:"plc_id"`
	PLCNome         string    `json:"plc_nome"`
	WordName        string    `json:"word_name"`
	BitOffset       int       `json:"bit_offset"`
	Eclusa          string    `json:"eclusa"`
	Subsistema      string    `json:"subsistema"`
	Descricao       string    `json:"descricao"`
	Tipo            string    `json:"tipo"`
	Ativo           bool      `json:"ativo"`
	InicioTimestamp time.Time `json:"inicio_timestamp"`
	Reconhecido     bool      `json:"reconhecido"`
}
