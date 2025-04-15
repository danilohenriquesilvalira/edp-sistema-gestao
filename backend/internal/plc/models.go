package plc

import (
	"time"
)

// PLC representa a conexão com um CLP Siemens
type PLC struct {
	ID        uint    `json:"id" gorm:"primaryKey"`
	Nome      string  `json:"nome" gorm:"size:100;not null"`
	IPAddress string  `json:"ip_address" gorm:"size:15;not null"`
	Rack      int     `json:"rack" gorm:"not null;default:0"`
	Slot      int     `json:"slot" gorm:"not null;default:0"`
	Gateway   *string `json:"gateway" gorm:"size:15"` // Ponteiro para permitir NULL
	Ativo     bool    `json:"ativo" gorm:"not null;default:true"`

	// Campos em tempo de execução (não armazenados no banco)
	Conectado     bool        `json:"conectado" gorm:"-"`
	UltimoErro    string      `json:"ultimo_erro" gorm:"-"`
	UltimaLeitura time.Time   `json:"ultima_leitura" gorm:"-"`
	Tags          []Tag       `json:"tags" gorm:"-"`
	Client        interface{} `json:"-" gorm:"-"` // Armazena o cliente S7
}

// Tag representa um ponto de dados em um CLP
type Tag struct {
	ID             uint    `json:"id" gorm:"primaryKey"`
	PLCID          uint    `json:"plc_id" gorm:"not null;column:plc_id"`
	Nome           string  `json:"nome" gorm:"size:100;not null"`
	DBNumber       int     `json:"db_number" gorm:"not null;column:db_number"`
	ByteOffset     int     `json:"byte_offset" gorm:"not null;column:byte_offset"`
	BitOffset      *int    `json:"bit_offset" gorm:"column:bit_offset"`
	Tipo           string  `json:"tipo" gorm:"size:20;not null"`
	Tamanho        int     `json:"tamanho" gorm:"default:1"`
	Subsistema     *string `json:"subsistema" gorm:"size:50"`  // Modificado para ponteiro
	Descricao      *string `json:"descricao" gorm:"type:text"` // Modificado para ponteiro
	Ativo          bool    `json:"ativo" gorm:"not null;default:true"`
	UpdateInterval int     `json:"update_interval_ms" gorm:"not null;default:1000;column:update_interval_ms"`
	OnlyOnChange   bool    `json:"only_on_change" gorm:"not null;default:false;column:only_on_change"`

	// Campos em tempo de execução (não armazenados no banco)
	UltimoValor    interface{} `json:"ultimo_valor" gorm:"-"`
	UltimaLeitura  time.Time   `json:"ultima_leitura" gorm:"-"`
	UltimoErroTime time.Time   `json:"ultimo_erro_time" gorm:"-"`
	UltimoErro     string      `json:"ultimo_erro" gorm:"-"`
}

// TableName especifica o nome da tabela para o modelo PLC
func (PLC) TableName() string {
	return "plcs"
}

// TableName especifica o nome da tabela para o modelo Tag
func (Tag) TableName() string {
	return "tags"
}
