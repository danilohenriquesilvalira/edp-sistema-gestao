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

	var adminID uint

	if adminCount == 0 {
		log.Println("Criando usuário administrador padrão")

		// Hash validado para a senha "admin123"
		adminHash := "$argon2id$v=19$m=65536,t=1,p=4$MTIzNDU2Nzg5MDEyMzQ1Ng$KPbx7DYJ9J4Z1TA2dJZ5qEWGHKBHCQ5kk4Yx/9jxiM4"

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
			adminID = admin.ID
		}
	} else {
		// Obter ID do admin existente
		var admin models.Utilizador
		config.DB.Where("email = ?", "admin@rls.pt").First(&admin)
		adminID = admin.ID
	}

	// Inicializar preferências padrão para o administrador
	if adminID > 0 {
		initializeAdminPreferences(adminID)
	}

	// Inicializar permissões básicas do sistema
	initializePermissions()

	// Inicializar algumas configurações do sistema
	initializeSystemConfigs()
}

// initializeAdminPreferences inicializa as preferências padrão para o administrador
func initializeAdminPreferences(adminID uint) {
	var prefsCount int64
	config.DB.Model(&models.PreferenciasUtilizador{}).Where("utilizador_id = ?", adminID).Count(&prefsCount)

	if prefsCount == 0 {
		prefs := models.PreferenciasUtilizador{
			UtilizadorID: adminID,
			TemaEscuro:   false,
			Idioma:       "pt",
			Notificacoes: true,
			Dashboard:    "{}",
		}

		if err := config.DB.Create(&prefs).Error; err != nil {
			log.Printf("Erro ao criar preferências para o administrador: %v", err)
		} else {
			log.Println("Preferências do administrador criadas com sucesso")
		}
	}
}

// initializePermissions inicializa as permissões básicas do sistema
func initializePermissions() {
	// Lista de permissões básicas
	permissions := []models.Permissao{
		{Nome: "Gerir Utilizadores", Descricao: "Gerenciar utilizadores do sistema", Modulo: "Utilizadores", Acao: "Gerenciar"},
		{Nome: "Ver Logs Auditoria", Descricao: "Visualizar logs de auditoria", Modulo: "Auditoria", Acao: "Visualizar"},
		{Nome: "Gerir Configurações", Descricao: "Gerenciar configurações do sistema", Modulo: "Configurações", Acao: "Gerenciar"},
		{Nome: "Gerir Permissões", Descricao: "Gerenciar permissões e perfis", Modulo: "Permissões", Acao: "Gerenciar"},
		// Novas permissões para os novos recursos
		{Nome: "Ver Utilizadores Ativos", Descricao: "Visualizar utilizadores ativos no sistema", Modulo: "Status", Acao: "Visualizar"},
		{Nome: "Gerir Sessões", Descricao: "Gerenciar sessões de utilizadores", Modulo: "Sessões", Acao: "Gerenciar"},
		{Nome: "Ver Preferências", Descricao: "Visualizar preferências de utilizadores", Modulo: "Preferências", Acao: "Visualizar"},
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
		// Novas configurações para os novos recursos
		{Chave: "user_activity_timeout", Valor: "15", Descricao: "Tempo em minutos para considerar um utilizador inativo"},
		{Chave: "tema_padrao", Valor: "claro", Descricao: "Tema padrão do sistema (claro/escuro)"},
		{Chave: "idioma_padrao", Valor: "pt", Descricao: "Idioma padrão do sistema"},
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
