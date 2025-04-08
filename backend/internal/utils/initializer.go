package utils

import (
	"log"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
	"github.com/danilo/edp_gestao_utilizadores/internal/models"
)

// InitializeDatabase inicializa algumas configurações básicas no banco de dados
func InitializeDatabase() {
	// Verificar se o usuário admin@rls.pt já existe
	var adminCount int64
	config.DB.Model(&models.Utilizador{}).Where("email = ?", "admin@rls.pt").Count(&adminCount)

	if adminCount == 0 {
		log.Println("Criando usuário administrador padrão")

		// Hash da senha admin123 usando argon2id
		adminHash := "$argon2id$v=19$m=65536,t=1,p=4$c2FsdHNhbHRzYWx0c2FsdA==$UZdatNrFdL3H7HHrPIlTGVEaYimSrOR9QRh2OifbAYQ="

		admin := models.Utilizador{
			Nome:             "Administrador",
			Email:            "admin@rls.pt",
			SenhaHash:        adminHash,
			Perfil:           "Administrador",
			Estado:           "Ativo",
			DoisFatoresAtivo: false,
		}

		if err := config.DB.Create(&admin).Error; err != nil {
			log.Printf("Erro ao criar usuário administrador: %v", err)
		} else {
			log.Println("Usuário administrador criado com sucesso")
		}
	}

	// Inicializar permissões básicas do sistema
	initializePermissions()

	// Inicializar algumas configurações do sistema
	initializeSystemConfigs()
}

// initializePermissions inicializa as permissões básicas do sistema
func initializePermissions() {
	// Lista de permissões básicas
	permissions := []models.Permissao{
		{Nome: "Gerir Utilizadores", Descricao: "Gerenciar utilizadores do sistema", Modulo: "Utilizadores", Acao: "Gerenciar"},
		{Nome: "Ver Logs Auditoria", Descricao: "Visualizar logs de auditoria", Modulo: "Auditoria", Acao: "Visualizar"},
		{Nome: "Gerir Configurações", Descricao: "Gerenciar configurações do sistema", Modulo: "Configurações", Acao: "Gerenciar"},
		{Nome: "Gerir Permissões", Descricao: "Gerenciar permissões e perfis", Modulo: "Permissões", Acao: "Gerenciar"},
	}

	// Criar permissões se não existirem
	for _, perm := range permissions {
		var count int64
		config.DB.Model(&models.Permissao{}).Where("nome = ?", perm.Nome).Count(&count)

		if count == 0 {
			if err := config.DB.Create(&perm).Error; err != nil {
				log.Printf("Erro ao criar permissão '%s': %v", perm.Nome, err)
			} else {
				log.Printf("Permissão '%s' criada com sucesso", perm.Nome)
			}
		}
	}

	// Atribuir todas as permissões ao perfil Administrador
	var adminPermissions []models.Permissao
	config.DB.Find(&adminPermissions)

	// Limpar permissões existentes do administrador
	config.DB.Where("perfil = ?", "Administrador").Delete(&models.PerfilPermissao{})

	// Adicionar novas permissões
	for _, perm := range adminPermissions {
		profilePerm := models.PerfilPermissao{
			Perfil:      "Administrador",
			PermissaoID: perm.ID,
		}

		if err := config.DB.Create(&profilePerm).Error; err != nil {
			log.Printf("Erro ao atribuir permissão '%s' ao perfil Administrador: %v", perm.Nome, err)
		}
	}
}

// initializeSystemConfigs inicializa algumas configurações básicas do sistema
func initializeSystemConfigs() {
	configs := []models.ConfiguracaoSistema{
		{Chave: "app_name", Valor: "EDP Gestão de Utilizadores", Descricao: "Nome da aplicação"},
		{Chave: "max_login_attempts", Valor: "5", Descricao: "Número máximo de tentativas de login"},
		{Chave: "session_timeout", Valor: "30", Descricao: "Tempo de inatividade para encerramento da sessão (minutos)"},
	}

	for _, cfg := range configs {
		var count int64
		config.DB.Model(&models.ConfiguracaoSistema{}).Where("chave = ?", cfg.Chave).Count(&count)

		if count == 0 {
			if err := config.DB.Create(&cfg).Error; err != nil {
				log.Printf("Erro ao criar configuração '%s': %v", cfg.Chave, err)
			} else {
				log.Printf("Configuração '%s' criada com sucesso", cfg.Chave)
			}
		}
	}
}
