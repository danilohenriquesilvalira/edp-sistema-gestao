package config

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

var DB *gorm.DB

// InitDatabase inicializa a conexão com o PostgreSQL
func InitDatabase() {
	// Obter variáveis de ambiente para conexão com o banco
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres") // Valor genérico
	dbPass := getEnv("DB_PASS", "postgres") // Valor genérico
	dbName := getEnv("DB_NAME", "edp_gestao_utilizadores")

	// Verificar se estamos em produção
	if os.Getenv("ENV") == "production" {
		// Verificar se as credenciais foram sobrescritas em produção
		if os.Getenv("DB_USER") == "" || os.Getenv("DB_PASS") == "" {
			log.Println("AVISO: Credenciais de banco de dados não configuradas em ambiente de produção!")
		}
	}

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Europe/Lisbon",
		dbHost, dbPort, dbUser, dbPass, dbName)

	// Configurar logger do GORM
	dbLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logger.Info,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	// Configurações GORM - desativar pluralização automática
	gormConfig := &gorm.Config{
		Logger: dbLogger,
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,  // Usar nomes de tabela no singular
			NoLowerCase:   false, // Manter maiúsculas/minúsculas
		},
		PrepareStmt: true, // Preparar statements para melhor performance
	}

	// Conectar ao banco de dados
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), gormConfig)

	if err != nil {
		log.Fatalf("Falha ao conectar ao banco de dados: %v", err)
	}

	log.Println("Conexão com o banco de dados estabelecida com sucesso")

	// Obter conexão SQL para configurar pool
	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatalf("Falha ao obter conexão SQL: %v", err)
	}

	// Configurar pool de conexões
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)
}

// GetDB retorna a instância do banco de dados
func GetDB() *gorm.DB {
	return DB
}

// Função auxiliar para obter variáveis de ambiente com valor padrão
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
