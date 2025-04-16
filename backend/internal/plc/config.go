package plc

import "time"

// PLCConfig contém configurações para o gerenciador PLC
type PLCConfig struct {
	// Configurações de conexão
	ConnectionTimeout     time.Duration
	ConnectionRetryDelay  time.Duration
	ConnectionCheckPeriod time.Duration

	// Configurações de leitura/monitoramento
	DefaultTagInterval time.Duration

	// Configurações para monitoramento de falhas
	MonitorInterval    time.Duration
	BatchProcessPeriod time.Duration
	BatchMaxSize       int

	// Configurações de paginação
	DefaultPageSize int
	MaxPageSize     int
}

// DefaultPLCConfig retorna configurações padrão
func DefaultPLCConfig() *PLCConfig {
	return &PLCConfig{
		ConnectionTimeout:     5 * time.Second,
		ConnectionRetryDelay:  5 * time.Second,
		ConnectionCheckPeriod: 30 * time.Second,
		DefaultTagInterval:    1000 * time.Millisecond,
		MonitorInterval:       1 * time.Second,
		BatchProcessPeriod:    200 * time.Millisecond,
		BatchMaxSize:          50,
		DefaultPageSize:       20,
		MaxPageSize:           100,
	}
}

// Configuração global
var Config = DefaultPLCConfig()
