package utils

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/danilo/edp_gestao_utilizadores/internal/models"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/argon2"
)

// GetJWTSecret retorna a chave secreta para assinatura de JWT
func GetJWTSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		// Em ambiente de produção, não permitir secret padrão
		if os.Getenv("ENV") == "production" {
			// Em produção, registramos o erro e usamos um secret aleatório temporário
			fmt.Println("AVISO: JWT_SECRET não definido em ambiente de produção! Usando valor temporário.")

			// Gerar um secret aleatório temporário para esta execução
			b := make([]byte, 32)
			rand.Read(b)
			return base64.StdEncoding.EncodeToString(b)
		}
		// Para desenvolvimento, usar valor consistente
		return "edp_gestao_utilizadores_secret_key_desenvolvimento_apenas"
	}
	return secret
}

// GetJWTExpiration retorna o tempo de expiração do token JWT
func GetJWTExpiration() time.Duration {
	expiresIn := os.Getenv("JWT_EXPIRES_IN")
	if expiresIn == "" {
		return time.Minute * 15 // Padrão: 15 minutos
	}

	duration, err := time.ParseDuration(expiresIn)
	if err != nil {
		return time.Minute * 15 // Padrão: 15 minutos
	}

	return duration
}

// GetRefreshTokenExpiration retorna o tempo de expiração do refresh token
func GetRefreshTokenExpiration() time.Duration {
	expiresIn := os.Getenv("REFRESH_TOKEN_EXPIRES_IN")
	if expiresIn == "" {
		return time.Hour * 24 * 7 // Padrão: 7 dias
	}

	duration, err := time.ParseDuration(expiresIn)
	if err != nil {
		return time.Hour * 24 * 7 // Padrão: 7 dias
	}

	return duration
}

// GenerateAccessToken gera um token JWT de acesso
func GenerateAccessToken(user *models.Utilizador) (string, time.Time, error) {
	// Definir duração e claims para o access token
	accessDuration := GetJWTExpiration()
	expiresAt := time.Now().Add(accessDuration)

	// Criar claims para o token
	claims := jwt.MapClaims{
		"sub":        user.ID,
		"name":       user.Nome,
		"email":      user.Email,
		"profile":    user.Perfil,
		"exp":        expiresAt.Unix(),
		"iat":        time.Now().Unix(),
		"token_type": "access",
	}

	// Criar token com claims
	tokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Assinar token
	token, err := tokenObj.SignedString([]byte(GetJWTSecret()))
	if err != nil {
		return "", time.Time{}, fmt.Errorf("erro ao assinar access token: %v", err)
	}

	return token, expiresAt, nil
}

// GenerateRefreshToken gera um token JWT de atualização
func GenerateRefreshToken(user *models.Utilizador) (string, time.Time, error) {
	// Gerar ID de sessão para o refresh token
	sessionID := GenerateRandomSessionID()

	// Definir duração e claims para o refresh token
	refreshDuration := GetRefreshTokenExpiration()
	expiresAt := time.Now().Add(refreshDuration)

	refreshClaims := jwt.MapClaims{
		"sub":        user.ID,
		"exp":        expiresAt.Unix(),
		"iat":        time.Now().Unix(),
		"session_id": sessionID,
		"token_type": "refresh",
	}

	// Criar token com claims
	refreshTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)

	// Assinar token
	refreshToken, err := refreshTokenObj.SignedString([]byte(GetJWTSecret()))
	if err != nil {
		return "", time.Time{}, fmt.Errorf("erro ao assinar refresh token: %v", err)
	}

	return refreshToken, expiresAt, nil
}

// GenerateRandomSessionID gera um ID de sessão aleatório
func GenerateRandomSessionID() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

// HashPassword gera um hash de senha usando argon2id
func HashPassword(password string) (string, error) {
	// Parâmetros do argon2id
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	time := uint32(1)
	memory := uint32(64 * 1024) // 64MB
	threads := uint8(4)
	keyLen := uint32(32)

	// Calcular o hash
	hash := argon2.IDKey([]byte(password), salt, time, memory, threads, keyLen)

	// Codificar o hash e o salt em base64
	saltBase64 := base64.StdEncoding.EncodeToString(salt)
	hashBase64 := base64.StdEncoding.EncodeToString(hash)

	// Formato: $argon2id$v=19$m=65536,t=1,p=4$<salt>$<hash>
	encodedHash := fmt.Sprintf("$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s",
		memory, time, threads, saltBase64, hashBase64)

	return encodedHash, nil
}

// VerifyPassword verifica se a senha está correta usando argon2id
func VerifyPassword(password, encodedHash string) bool {
	// Formato esperado: $argon2id$v=19$m=65536,t=1,p=4$<salt>$<hash>
	parts := strings.Split(encodedHash, "$")
	if len(parts) < 6 {
		return false
	}

	var memory uint32 = 64 * 1024 // 64MB
	var iterations uint32 = 1
	var parallelism uint8 = 4

	// Extrair parâmetros do formato do hash
	paramParts := strings.Split(parts[3], ",")
	for _, param := range paramParts {
		if strings.HasPrefix(param, "m=") {
			fmt.Sscanf(param, "m=%d", &memory)
		} else if strings.HasPrefix(param, "t=") {
			fmt.Sscanf(param, "t=%d", &iterations)
		} else if strings.HasPrefix(param, "p=") {
			var p uint32
			fmt.Sscanf(param, "p=%d", &p)
			parallelism = uint8(p)
		}
	}

	// Extrair salt e hash
	saltBase64 := parts[4]
	storedHashBase64 := parts[5]

	salt, err := base64.StdEncoding.DecodeString(saltBase64)
	if err != nil {
		return false
	}

	// Calcular hash com a senha fornecida
	keyLen := uint32(32)
	computedHash := argon2.IDKey([]byte(password), salt, iterations, memory, parallelism, keyLen)
	computedHashBase64 := base64.StdEncoding.EncodeToString(computedHash)

	// Comparar hash calculado com o armazenado
	return computedHashBase64 == storedHashBase64
}

// ExtractDeviceInfo extrai informações do dispositivo a partir do user agent
func ExtractDeviceInfo(userAgent string) string {
	// Implementação simplificada - em uma implementação real, analisaria o User-Agent
	if userAgent == "" {
		return "Dispositivo Desconhecido"
	}

	// Detectar tipo de dispositivo básico
	if strings.Contains(userAgent, "Android") ||
		strings.Contains(userAgent, "iPhone") ||
		strings.Contains(userAgent, "iPad") ||
		strings.Contains(userAgent, "Mobile") {
		return "Dispositivo Móvel"
	}

	return "Navegador Web"
}
