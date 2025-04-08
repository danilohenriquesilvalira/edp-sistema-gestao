package config

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client
var ctx = context.Background()

// InitRedis inicializa a conexão com o Redis
func InitRedis() {
	// Obter variáveis de ambiente para conexão com o Redis
	redisHost := getEnv("REDIS_HOST", "localhost")
	redisPort := getEnv("REDIS_PORT", "6379")
	redisPass := getEnv("REDIS_PASS", "")
	redisDB := 0

	// Criar cliente Redis
	RedisClient = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", redisHost, redisPort),
		Password: redisPass,
		DB:       redisDB,
	})

	// Verificar conexão
	_, err := RedisClient.Ping(ctx).Result()
	if err != nil {
		log.Printf("Aviso: Falha ao conectar ao Redis: %v", err)
		log.Println("O sistema continuará a funcionar, mas os refresh tokens serão armazenados apenas no banco de dados.")
		return
	}

	log.Println("Conexão com o Redis estabelecida com sucesso")
}

// GetRedisClient retorna o cliente Redis
func GetRedisClient() *redis.Client {
	return RedisClient
}

// SaveRefreshToken salva um token de atualização no Redis
func SaveRefreshToken(userId uint, tokenId string, token string, expiresIn time.Duration) error {
	// Se o Redis não estiver disponível, apenas retornar sem erro
	if RedisClient == nil {
		log.Println("Redis não disponível, token será armazenado apenas no banco de dados")
		return nil
	}

	// Chave no formato: refresh_token:{user_id}:{token_id}
	key := fmt.Sprintf("refresh_token:%d:%s", userId, tokenId)

	err := RedisClient.Set(ctx, key, token, expiresIn).Err()
	if err != nil {
		return fmt.Errorf("erro ao salvar refresh token no Redis: %v", err)
	}

	return nil
}

// GetRefreshToken recupera um token de atualização do Redis
func GetRefreshToken(userId uint, tokenId string) (string, error) {
	// Se o Redis não estiver disponível, retornar erro
	if RedisClient == nil {
		return "", fmt.Errorf("Redis não disponível")
	}

	key := fmt.Sprintf("refresh_token:%d:%s", userId, tokenId)

	token, err := RedisClient.Get(ctx, key).Result()
	if err == redis.Nil {
		return "", fmt.Errorf("refresh token não encontrado no Redis")
	} else if err != nil {
		return "", fmt.Errorf("erro ao obter refresh token do Redis: %v", err)
	}

	return token, nil
}

// DeleteRefreshToken remove um token de atualização do Redis
func DeleteRefreshToken(userId uint, tokenId string) error {
	// Se o Redis não estiver disponível, apenas retornar sem erro
	if RedisClient == nil {
		return nil
	}

	key := fmt.Sprintf("refresh_token:%d:%s", userId, tokenId)

	_, err := RedisClient.Del(ctx, key).Result()
	if err != nil {
		return fmt.Errorf("erro ao remover refresh token do Redis: %v", err)
	}

	return nil
}

// DeleteAllUserRefreshTokens remove todos os tokens de atualização de um utilizador
func DeleteAllUserRefreshTokens(userId uint) error {
	// Se o Redis não estiver disponível, apenas retornar sem erro
	if RedisClient == nil {
		return nil
	}

	pattern := fmt.Sprintf("refresh_token:%d:*", userId)

	iter := RedisClient.Scan(ctx, 0, pattern, 100).Iterator()
	for iter.Next(ctx) {
		if err := RedisClient.Del(ctx, iter.Val()).Err(); err != nil {
			return fmt.Errorf("erro ao remover tokens do Redis: %v", err)
		}
	}

	if err := iter.Err(); err != nil {
		return fmt.Errorf("erro na iteração do Redis: %v", err)
	}

	return nil
}
