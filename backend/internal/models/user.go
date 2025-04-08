package models

import (
	"encoding/json"
	"time"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
	"gorm.io/gorm"
)

// Utilizador representa o modelo de utilizador no sistema
type Utilizador struct {
	ID                 uint      `gorm:"primarykey" json:"id"`
	Nome               string    `gorm:"size:100;not null" json:"nome"`
	Email              string    `gorm:"size:100;uniqueIndex;not null" json:"email"`
	SenhaHash          string    `gorm:"size:100;not null" json:"-"`                          // Não expor o hash da senha
	Perfil             string    `gorm:"size:50;not null;default:'Utilizador'" json:"perfil"` // Administrador, Utilizador
	Estado             string    `gorm:"size:20;not null;default:'Ativo'" json:"estado"`      // Ativo, Inativo
	TentativasLogin    int       `gorm:"default:0" json:"tentativas_login"`
	UltimoLogin        time.Time `json:"ultimo_login"`
	CriadoEm           time.Time `gorm:"autoCreateTime" json:"criado_em"`
	AtualizadoEm       time.Time `gorm:"autoUpdateTime" json:"atualizado_em"`
	FotoPerfil         string    `gorm:"size:255" json:"foto_perfil"`
	DoisFatoresAtivo   bool      `gorm:"default:false" json:"dois_fatores_ativo"`
	SegredoDoisFatores string    `gorm:"size:100" json:"-"` // Não expor o segredo 2FA
}

// TableName especifica o nome da tabela para o modelo Utilizador
func (Utilizador) TableName() string {
	return "utilizadores"
}

// Permissao representa o modelo de permissão no sistema
type Permissao struct {
	ID        uint   `gorm:"primarykey" json:"id"`
	Nome      string `gorm:"size:100;not null" json:"nome"`
	Descricao string `gorm:"size:255" json:"descricao"`
	Modulo    string `gorm:"size:50;not null" json:"modulo"`
	Acao      string `gorm:"size:50;not null" json:"acao"`
}

// TableName especifica o nome da tabela para o modelo Permissao
func (Permissao) TableName() string {
	return "permissoes"
}

// PerfilPermissao representa a relação entre perfis e permissões
type PerfilPermissao struct {
	Perfil      string `gorm:"primaryKey;size:50" json:"perfil"`
	PermissaoID uint   `gorm:"primaryKey" json:"permissao_id"`
}

// TableName especifica o nome da tabela para o modelo PerfilPermissao
func (PerfilPermissao) TableName() string {
	return "perfil_permissoes"
}

// LogAuditoria representa um log de auditoria no sistema
type LogAuditoria struct {
	ID             uint      `gorm:"primarykey" json:"id"`
	UtilizadorID   uint      `json:"utilizador_id"`
	NomeUtilizador string    `gorm:"size:100" json:"nome_utilizador"`
	Acao           string    `gorm:"size:50;not null" json:"acao"`
	Modulo         string    `gorm:"size:50;not null" json:"modulo"`
	IP             string    `gorm:"size:50" json:"ip"`
	Detalhes       string    `gorm:"type:jsonb" json:"detalhes"`
	CriadoEm       time.Time `gorm:"autoCreateTime" json:"criado_em"`
}

// TableName especifica o nome da tabela para o modelo LogAuditoria
func (LogAuditoria) TableName() string {
	return "logs_auditoria"
}

// TokenRecuperacao representa um token para recuperação de senha
type TokenRecuperacao struct {
	ID           uint      `gorm:"primarykey" json:"id"`
	UtilizadorID uint      `gorm:"not null" json:"utilizador_id"`
	Token        string    `gorm:"size:100;not null" json:"-"` // Não expor o token
	CriadoEm     time.Time `gorm:"autoCreateTime" json:"criado_em"`
	ExpiraEm     time.Time `json:"expira_em"`
	Usado        bool      `gorm:"default:false" json:"usado"`
}

// TableName especifica o nome da tabela para o modelo TokenRecuperacao
func (TokenRecuperacao) TableName() string {
	return "tokens_recuperacao"
}

// ConfiguracaoSistema representa uma configuração do sistema
type ConfiguracaoSistema struct {
	ID           uint      `gorm:"primarykey" json:"id"`
	Chave        string    `gorm:"size:100;uniqueIndex;not null" json:"chave"`
	Valor        string    `gorm:"type:text" json:"valor"`
	Descricao    string    `gorm:"size:255" json:"descricao"`
	AtualizadoEm time.Time `gorm:"autoUpdateTime" json:"atualizado_em"`
}

// TableName especifica o nome da tabela para o modelo ConfiguracaoSistema
func (ConfiguracaoSistema) TableName() string {
	return "configuracoes_sistema"
}

// RegistrarAuditoria registra uma ação de auditoria no sistema
func RegistrarAuditoria(utilizadorID uint, nomeUtilizador, acao, modulo, ip string, detalhes interface{}) error {
	log := LogAuditoria{
		UtilizadorID:   utilizadorID,
		NomeUtilizador: nomeUtilizador,
		Acao:           acao,
		Modulo:         modulo,
		IP:             ip,
	}

	// Converter detalhes para JSON se não for nulo
	if detalhes != nil {
		detalhesJSON, err := json.Marshal(detalhes)
		if err != nil {
			return err
		}
		log.Detalhes = string(detalhesJSON)
	} else {
		log.Detalhes = "{}"
	}

	return config.DB.Create(&log).Error
}

// GetUserByEmail busca um utilizador pelo email
func GetUserByEmail(email string) (*Utilizador, error) {
	var user Utilizador
	result := config.DB.Where("email = ?", email).First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}

// GetUserByID busca um utilizador pelo ID
func GetUserByID(id uint) (*Utilizador, error) {
	var user Utilizador
	result := config.DB.First(&user, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}

// UpdateUserLoginStats atualiza as estatísticas de login de um utilizador
func UpdateUserLoginStats(userID uint, successful bool) error {
	db := config.DB
	if successful {
		return db.Model(&Utilizador{}).
			Where("id = ?", userID).
			Updates(map[string]interface{}{
				"ultimo_login":     time.Now(),
				"tentativas_login": 0,
			}).Error
	} else {
		return db.Model(&Utilizador{}).
			Where("id = ?", userID).
			UpdateColumn("tentativas_login", gorm.Expr("tentativas_login + 1")).
			Error
	}
}
