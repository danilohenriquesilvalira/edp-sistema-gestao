package plc

import (
	"context"
	"log"
	"time"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
)

// RedisClient gerencia interações com Redis para dados PLC
type RedisClient struct {
	ctx context.Context
}

// NewRedisClient cria um novo cliente Redis para dados PLC
func NewRedisClient() *RedisClient {
	return &RedisClient{
		ctx: context.Background(),
	}
}

// Set armazena um valor no Redis com uma chave
func (r *RedisClient) Set(key, value string) error {
	if !config.IsRedisAvailable() {
		log.Println("Redis não disponível para armazenamento de dados PLC")
		return nil
	}

	// Armazenar com TTL de 1 hora
	err := config.RedisClient.Set(r.ctx, key, value, time.Hour).Err()
	if err != nil {
		return err
	}

	return nil
}

// Get recupera um valor do Redis pela chave
func (r *RedisClient) Get(key string) (string, error) {
	if !config.IsRedisAvailable() {
		return "", nil
	}

	val, err := config.RedisClient.Get(r.ctx, key).Result()
	if err != nil {
		return "", err
	}

	return val, nil
}

// Publish publica uma mensagem em um canal Redis
func (r *RedisClient) Publish(channel, message string) error {
	if !config.IsRedisAvailable() {
		return nil
	}

	err := config.RedisClient.Publish(r.ctx, channel, message).Err()
	if err != nil {
		return err
	}

	return nil
}
