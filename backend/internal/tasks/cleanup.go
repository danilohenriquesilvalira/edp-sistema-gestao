package tasks

import (
	"log"
	"time"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
	"github.com/danilo/edp_gestao_utilizadores/internal/models"
)

// CleanupExpiredSessions remove sessões expiradas antigas do banco de dados
func CleanupExpiredSessions() {
	// Remover sessões que expiraram há mais de 30 dias
	// Isso mantém um histórico razoável para auditoria, mas evita crescimento indefinido
	cutoffDate := time.Now().AddDate(0, 0, -30) // 30 dias atrás

	result := config.DB.Where("expira_em < ?", cutoffDate).Delete(&models.Sessao{})

	if result.Error != nil {
		log.Printf("Erro ao limpar sessões expiradas: %v", result.Error)
	} else {
		log.Printf("Limpeza concluída: %d sessões antigas removidas", result.RowsAffected)
	}
}

// CleanupUnusedTokens remove tokens de recuperação não utilizados e expirados
func CleanupUnusedTokens() {
	// Remover tokens de recuperação expirados há mais de 7 dias
	cutoffDate := time.Now().AddDate(0, 0, -7) // 7 dias atrás

	result := config.DB.Where("expira_em < ? AND usado = ?", cutoffDate, false).Delete(&models.TokenRecuperacao{})

	if result.Error != nil {
		log.Printf("Erro ao limpar tokens não utilizados: %v", result.Error)
	} else {
		log.Printf("Limpeza concluída: %d tokens não utilizados removidos", result.RowsAffected)
	}
}

// CleanupInactiveUsers marca como offline utilizadores inativos
func CleanupInactiveUsers() {
	timeoutMinutes := 15 // Considerar offline após 15 minutos de inatividade

	if err := models.LimparStatusOffline(timeoutMinutes); err != nil {
		log.Printf("Erro ao limpar status de utilizadores inativos: %v", err)
	} else {
		log.Println("Status de utilizadores inativos atualizado com sucesso")
	}
}

// StartCleanupTasks inicia as tarefas de limpeza periódicas
func StartCleanupTasks() {
	// Executar as tarefas imediatamente uma vez
	go RunCleanupTasks()

	// Configurar execução periódica
	ticker := time.NewTicker(7 * 24 * time.Hour) // A cada 7 dias

	go func() {
		for range ticker.C {
			RunCleanupTasks()
		}
	}()

	log.Println("Tarefas de limpeza agendadas com sucesso")
}

// RunCleanupTasks executa todas as tarefas de limpeza
func RunCleanupTasks() {
	// Escolher um horário de menor utilização (4:00 AM)
	now := time.Now()
	targetHour := 4 // 4 AM

	if now.Hour() != targetHour {
		// Calcular quanto tempo falta até o próximo horário alvo
		var hoursToWait int
		if now.Hour() < targetHour {
			hoursToWait = targetHour - now.Hour()
		} else {
			hoursToWait = 24 - now.Hour() + targetHour
		}

		// Esperar até o próximo horário alvo
		time.Sleep(time.Duration(hoursToWait) * time.Hour)
	}

	// Executar as tarefas de limpeza
	log.Println("Iniciando tarefas de limpeza...")

	CleanupExpiredSessions()
	CleanupUnusedTokens()
	CleanupInactiveUsers() // Nova tarefa

	log.Println("Tarefas de limpeza concluídas com sucesso")
}
