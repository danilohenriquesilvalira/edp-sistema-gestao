package plc

import (
	"encoding/json"
	"fmt"
	"log"
	"sort"
	"sync"
	"time"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
)

// WordMonitorInfo estrutura para monitoramento eficiente de words
type WordMonitorInfo struct {
	PLCID      uint
	PLCNome    string
	DBNumber   int
	ByteOffset int
	LastValue  uint16
	FaultDefs  map[int]*FaultDefinition // Mapa de bit_offset -> definição
	mutex      sync.RWMutex
}

// WordValueChange estrutura para tracking de mudanças de valores
type WordValueChange struct {
	MonitorKey string
	PLCID      uint
	PLCNome    string
	OldValue   uint16
	NewValue   uint16
	Timestamp  time.Time
}

// FaultManager gerencia o monitoramento de falhas
type FaultManager struct {
	wordMonitors     map[string]*WordMonitorInfo // Chave: "plc_id:db_number:byte_offset"
	activeStatuses   map[uint]*FaultStatus       // Cache dos status ativos (fault_id -> status)
	wordBatchChan    chan WordValueChange        // Canal para mudanças em lote
	monitorMutex     sync.RWMutex
	statusCacheMutex sync.RWMutex
	natsClient       *NatsClient            // Referência ao cliente NATS
	stopChans        map[uint]chan struct{} // Canais de parada por PLC
	stopChansMutex   sync.Mutex
}

// NewFaultManager cria um novo gerenciador de falhas
func NewFaultManager() *FaultManager {
	return &FaultManager{
		wordMonitors:   make(map[string]*WordMonitorInfo),
		activeStatuses: make(map[uint]*FaultStatus),
		wordBatchChan:  make(chan WordValueChange, 1000),
		stopChans:      make(map[uint]chan struct{}),
	}
}

// Initialize inicializa o sistema de monitoramento de falhas
func (fm *FaultManager) Initialize(natsClient *NatsClient) error {
	fm.natsClient = natsClient

	// Carregar definições de falhas
	if err := fm.loadFaultDefinitions(); err != nil {
		return fmt.Errorf("falha ao carregar definições de falha: %v", err)
	}

	// Pré-carregar status ativos
	if err := fm.loadActiveStatuses(); err != nil {
		return fmt.Errorf("falha ao carregar status ativos: %v", err)
	}

	// Iniciar processador em lote
	go fm.processBatchUpdates()

	log.Println("Sistema de monitoramento de falhas inicializado com sucesso")
	return nil
}

// loadFaultDefinitions carrega definições de falha do banco de dados
func (fm *FaultManager) loadFaultDefinitions() error {
	var definitions []FaultDefinition
	result := config.DB.Where("ativo = ?", true).Find(&definitions)
	if result.Error != nil {
		return result.Error
	}

	fm.monitorMutex.Lock()
	defer fm.monitorMutex.Unlock()

	// Organizar por word para monitoramento eficiente
	for i := range definitions {
		def := &definitions[i]
		key := fmt.Sprintf("%d:%d:%d", def.PLCID, def.DBNumber, def.ByteOffset)

		monitor, exists := fm.wordMonitors[key]
		if !exists {
			// Buscar nome do PLC
			var plc PLC
			config.DB.Select("nome").First(&plc, def.PLCID)

			// Criar novo monitor
			monitor = &WordMonitorInfo{
				PLCID:      def.PLCID,
				PLCNome:    plc.Nome,
				DBNumber:   def.DBNumber,
				ByteOffset: def.ByteOffset,
				LastValue:  0, // Valor inicial
				FaultDefs:  make(map[int]*FaultDefinition),
			}
			fm.wordMonitors[key] = monitor
		}

		// Adicionar definição ao monitor
		monitor.FaultDefs[def.BitOffset] = def
	}

	log.Printf("Monitoramento configurado para %d words", len(fm.wordMonitors))
	return nil
}

// loadActiveStatuses pré-carrega status ativos para o cache
func (fm *FaultManager) loadActiveStatuses() error {
	var statuses []FaultStatus
	result := config.DB.Where("ativo = ?", true).Find(&statuses)
	if result.Error != nil {
		return result.Error
	}

	fm.statusCacheMutex.Lock()
	defer fm.statusCacheMutex.Unlock()

	for i := range statuses {
		status := &statuses[i]
		fm.activeStatuses[status.FaultID] = status
	}

	log.Printf("Cache carregado com %d status ativos", len(fm.activeStatuses))
	return nil
}

// StartMonitoring inicia o monitoramento para um PLC específico
func (fm *FaultManager) StartMonitoring(plc *PLC) {
	fm.stopChansMutex.Lock()
	if _, exists := fm.stopChans[plc.ID]; exists {
		// Já está monitorando, parar o existente primeiro
		close(fm.stopChans[plc.ID])
	}
	// Criar novo canal de parada
	stopChan := make(chan struct{})
	fm.stopChans[plc.ID] = stopChan
	fm.stopChansMutex.Unlock()

	// Encontrar words para monitorar neste PLC
	fm.monitorMutex.RLock()
	var monitorsForPLC []*WordMonitorInfo
	for _, monitor := range fm.wordMonitors {
		if monitor.PLCID == plc.ID {
			monitorsForPLC = append(monitorsForPLC, monitor)
		}
	}
	fm.monitorMutex.RUnlock()

	if len(monitorsForPLC) == 0 {
		log.Printf("Nenhuma word configurada para monitoramento no PLC %s (ID: %d)", plc.Nome, plc.ID)
		return
	}

	log.Printf("Iniciando monitoramento de %d words no PLC %s", len(monitorsForPLC), plc.Nome)

	// Agrupar monitores por DB para leitura eficiente
	monitorsByDB := make(map[int][]*WordMonitorInfo)
	for _, monitor := range monitorsForPLC {
		monitorsByDB[monitor.DBNumber] = append(monitorsByDB[monitor.DBNumber], monitor)
	}

	// Um goroutine por DB para leitura eficiente
	for dbNumber, monitors := range monitorsByDB {
		// Ordenar por ByteOffset para leitura sequencial
		sort.Slice(monitors, func(i, j int) bool {
			return monitors[i].ByteOffset < monitors[j].ByteOffset
		})

		go fm.monitorDBWords(plc, dbNumber, monitors, stopChan)
	}
}

// StopMonitoring para o monitoramento para um PLC específico
func (fm *FaultManager) StopMonitoring(plcID uint) {
	fm.stopChansMutex.Lock()
	defer fm.stopChansMutex.Unlock()

	if stopChan, exists := fm.stopChans[plcID]; exists {
		close(stopChan)
		delete(fm.stopChans, plcID)
		log.Printf("Monitoramento de falhas parado para PLC ID %d", plcID)
	}
}

// monitorDBWords monitora words em um DB específico
func (fm *FaultManager) monitorDBWords(plc *PLC, dbNumber int, monitors []*WordMonitorInfo, stopChan chan struct{}) {
	s7Client, ok := plc.Client.(*S7Client)
	if !ok {
		log.Printf("Erro: Cliente S7 não disponível para PLC %s (ID: %d)", plc.Nome, plc.ID)
		return
	}

	ticker := time.NewTicker(1 * time.Second) // Taxa de amostragem adequada
	defer ticker.Stop()

	log.Printf("Iniciando monitoramento do DB %d no PLC %s", dbNumber, plc.Nome)

	for {
		select {
		case <-stopChan:
			log.Printf("Parando monitoramento do DB %d no PLC %s", dbNumber, plc.Nome)
			return
		case <-ticker.C:
			if !plc.Conectado {
				continue
			}

			now := time.Now()

			// Para cada monitor neste DB
			for _, monitor := range monitors {
				// Ler word do PLC
				tmpTag := Tag{
					DBNumber:   dbNumber,
					ByteOffset: monitor.ByteOffset,
					Tipo:       "Word",
				}

				valueInterface, err := s7Client.ReadTag(&tmpTag)
				if err != nil {
					log.Printf("Erro ao ler word DB%d.DBW%d no PLC %s: %v",
						dbNumber, monitor.ByteOffset, plc.Nome, err)
					continue // Falha na leitura - tentar próxima vez
				}

				newValue, ok := valueInterface.(uint16)
				if !ok {
					log.Printf("Tipo inválido retornado para DB%d.DBW%d no PLC %s",
						dbNumber, monitor.ByteOffset, plc.Nome)
					continue // Tipo inválido
				}

				// Verificar se o valor mudou
				monitor.mutex.Lock()
				oldValue := monitor.LastValue
				if newValue != oldValue {
					// Valor mudou - atualizar e enviar para processamento
					monitor.LastValue = newValue

					key := fmt.Sprintf("%d:%d:%d", monitor.PLCID, monitor.DBNumber, monitor.ByteOffset)
					change := WordValueChange{
						MonitorKey: key,
						PLCID:      monitor.PLCID,
						PLCNome:    monitor.PLCNome,
						OldValue:   oldValue,
						NewValue:   newValue,
						Timestamp:  now,
					}

					// Enviar para o canal de processamento em lote (non-blocking)
					select {
					case fm.wordBatchChan <- change:
						// Enviado com sucesso
					default:
						// Canal cheio - log para diagnóstico
						log.Printf("AVISO: Canal de processamento cheio - descartando atualização para %s", key)
					}
				}
				monitor.mutex.Unlock()
			}
		}
	}
}

// processBatchUpdates processa atualizações em lote para melhor desempenho
func (fm *FaultManager) processBatchUpdates() {
	log.Println("Iniciando processador de lotes de atualizações de falhas")

	batchSize := 0
	pendingChanges := make([]WordValueChange, 0, 100)
	ticker := time.NewTicker(200 * time.Millisecond)

	for {
		select {
		case change := <-fm.wordBatchChan:
			// Adicionar à batch
			pendingChanges = append(pendingChanges, change)
			batchSize++

			// Processar imediatamente se o tamanho do lote atingir o limite
			if batchSize >= 50 {
				fm.processChangeBatch(pendingChanges)
				pendingChanges = pendingChanges[:0] // Limpar slice mantendo capacidade
				batchSize = 0
			}

		case <-ticker.C:
			// Processar lote atual periodicamente mesmo se pequeno
			if batchSize > 0 {
				fm.processChangeBatch(pendingChanges)
				pendingChanges = pendingChanges[:0]
				batchSize = 0
			}
		}
	}
}

// processChangeBatch processa um lote de mudanças
func (fm *FaultManager) processChangeBatch(changes []WordValueChange) {
	if len(changes) == 0 {
		return
	}

	// log.Printf("Processando lote de %d mudanças de words", len(changes))

	// Acumular mudanças de status para atualizar banco em uma única transação
	statusUpdates := make(map[uint]bool) // fault_id -> novo estado (true=ativo, false=inativo)
	statusChanges := make([]*FaultStatus, 0)
	historyEntries := make([]*FaultHistory, 0)

	// Para cada mudança de word
	for _, change := range changes {
		// Obter o monitor
		fm.monitorMutex.RLock()
		monitor, exists := fm.wordMonitors[change.MonitorKey]
		fm.monitorMutex.RUnlock()

		if !exists {
			continue
		}

		// Para cada bit definido nesta word
		monitor.mutex.RLock()
		for bitOffset, faultDef := range monitor.FaultDefs {
			// Verificar se este bit mudou
			mask := uint16(1 << bitOffset)
			oldBitState := (change.OldValue & mask) > 0
			newBitState := (change.NewValue & mask) > 0

			if oldBitState == newBitState {
				continue // Bit não mudou
			}

			// Este bit mudou - verificar status atual
			fm.statusCacheMutex.RLock()
			currentStatus, statusExists := fm.activeStatuses[faultDef.ID]
			fm.statusCacheMutex.RUnlock()

			// Atualizar status
			if newBitState {
				// Falha ativada
				if !statusExists || !currentStatus.Ativo {
					// Nova falha ou mudança de estado
					status := &FaultStatus{
						FaultID:         faultDef.ID,
						Ativo:           true,
						InicioTimestamp: &change.Timestamp,
						Reconhecido:     false,
					}

					statusChanges = append(statusChanges, status)
					statusUpdates[faultDef.ID] = true

					// Publicar via NATS (em background)
					go fm.publishFaultEvent(faultDef, true, change.Timestamp, change.PLCNome)
				}
			} else {
				// Falha resolvida
				if statusExists && currentStatus.Ativo {
					// Desativar o status
					updatedStatus := &FaultStatus{
						FaultID:         currentStatus.FaultID,
						Ativo:           false,
						InicioTimestamp: currentStatus.InicioTimestamp,
						Reconhecido:     currentStatus.Reconhecido,
						ReconhecidoPor:  currentStatus.ReconhecidoPor,
						ReconhecidoEm:   currentStatus.ReconhecidoEm,
					}
					statusChanges = append(statusChanges, updatedStatus)
					statusUpdates[faultDef.ID] = false

					// Adicionar ao histórico
					if currentStatus.InicioTimestamp != nil {
						duration := int(change.Timestamp.Sub(*currentStatus.InicioTimestamp).Seconds())
						history := &FaultHistory{
							FaultID:         faultDef.ID,
							InicioTimestamp: *currentStatus.InicioTimestamp,
							FimTimestamp:    change.Timestamp,
							DuracaoSegundos: duration,
							Reconhecido:     currentStatus.Reconhecido,
							ReconhecidoPor:  currentStatus.ReconhecidoPor,
							ReconhecidoEm:   currentStatus.ReconhecidoEm,
						}

						historyEntries = append(historyEntries, history)
					}

					// Publicar via NATS (em background)
					go fm.publishFaultEvent(faultDef, false, change.Timestamp, change.PLCNome)
				}
			}
		}
		monitor.mutex.RUnlock()
	}

	// Atualizar banco de dados em uma única transação
	if len(statusChanges) > 0 || len(historyEntries) > 0 {
		// Usar transação para garantir consistência
		tx := config.DB.Begin()

		// Atualizar status
		for _, status := range statusChanges {
			if status.Ativo {
				// Inserir ou atualizar para ativo
				if err := tx.Exec(`
					INSERT INTO fault_status 
					(fault_id, ativo, inicio_timestamp, reconhecido) 
					VALUES (?, true, ?, false)
					ON CONFLICT (fault_id) 
					DO UPDATE SET 
						ativo = true, 
						inicio_timestamp = ?, 
						reconhecido = false,
						reconhecido_por = NULL,
						reconhecido_em = NULL
				`, status.FaultID, status.InicioTimestamp, status.InicioTimestamp).Error; err != nil {
					log.Printf("Erro ao inserir status de falha: %v", err)
				}
			} else {
				// Desativar
				if err := tx.Exec(`
					UPDATE fault_status 
					SET ativo = false 
					WHERE fault_id = ?
				`, status.FaultID).Error; err != nil {
					log.Printf("Erro ao atualizar status de falha: %v", err)
				}
			}
		}

		// Inserir histórico
		for _, history := range historyEntries {
			if err := tx.Create(history).Error; err != nil {
				log.Printf("Erro ao inserir histórico de falha: %v", err)
			}
		}

		// Commit da transação
		if err := tx.Commit().Error; err != nil {
			log.Printf("Erro ao atualizar banco de dados: %v", err)
			tx.Rollback()
		} else {
			// Atualizar cache em memória
			fm.statusCacheMutex.Lock()
			for faultID, isActive := range statusUpdates {
				if isActive {
					// Atualizar ou adicionar ao cache
					for _, status := range statusChanges {
						if status.FaultID == faultID {
							fm.activeStatuses[faultID] = status
							break
						}
					}
				} else {
					// Remover do cache de ativos
					delete(fm.activeStatuses, faultID)
				}
			}
			fm.statusCacheMutex.Unlock()
		}
	}
}

// publishFaultEvent publica evento de falha via NATS
func (fm *FaultManager) publishFaultEvent(def *FaultDefinition, isActive bool, timestamp time.Time, plcNome string) {
	if fm.natsClient == nil || !fm.natsClient.IsConnected() {
		return
	}

	// Criar evento
	event := map[string]interface{}{
		"id":         def.ID,
		"plc_id":     def.PLCID,
		"plc_nome":   plcNome,
		"word_name":  def.WordName,
		"bit_offset": def.BitOffset,
		"eclusa":     def.Eclusa,
		"subsistema": def.Subsistema,
		"descricao":  def.Descricao,
		"tipo":       def.Tipo,
		"ativo":      isActive,
		"timestamp":  timestamp,
	}

	// Publicar em um único tópico consolidado para evitar sobrecarga
	msg := NatsMessage{
		Type: "fault_update",
		Data: event,
	}

	if payload, err := json.Marshal(msg); err == nil {
		// Publicar em um único subject para maior eficiência
		if err := fm.natsClient.conn.Publish("eclusa.falhas", payload); err != nil {
			log.Printf("Erro ao publicar evento de falha no NATS: %v", err)
		}
	}
}

// GetActiveFaults retorna todas as falhas ativas no momento
func (fm *FaultManager) GetActiveFaults() ([]FaultEvent, error) {
	var events []FaultEvent

	// Usar JOIN para obter as informações completas sobre as falhas ativas
	rows, err := config.DB.Raw(`
		SELECT 
			fd.id, fd.plc_id, p.nome as plc_nome, fd.word_name, fd.bit_offset, 
			fd.eclusa, fd.subsistema, fd.descricao, fd.tipo, 
			fs.ativo, fs.inicio_timestamp, fs.reconhecido
		FROM 
			fault_status fs
		JOIN 
			fault_definitions fd ON fs.fault_id = fd.id
		JOIN
			plcs p ON fd.plc_id = p.id
		WHERE 
			fs.ativo = true
		ORDER BY 
			fs.inicio_timestamp DESC
	`).Rows()

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var event FaultEvent
		var inicioTimestamp string // Para lidar com formato de data do banco

		err := rows.Scan(
			&event.ID, &event.PLCID, &event.PLCNome, &event.WordName, &event.BitOffset,
			&event.Eclusa, &event.Subsistema, &event.Descricao, &event.Tipo,
			&event.Ativo, &inicioTimestamp, &event.Reconhecido,
		)

		if err != nil {
			log.Printf("Erro ao escanear falha ativa: %v", err)
			continue
		}

		// Converter string de data para time.Time
		if t, err := time.Parse("2006-01-02 15:04:05", inicioTimestamp); err == nil {
			event.InicioTimestamp = t
		} else {
			event.InicioTimestamp = time.Now() // Fallback
		}

		events = append(events, event)
	}

	return events, nil
}

// GetFaultHistory retorna o histórico de falhas com filtragem
func (fm *FaultManager) GetFaultHistory(eclusa string, subsistema string, startTime, endTime time.Time) ([]FaultHistory, error) {
	var history []FaultHistory

	query := config.DB.Table("fault_history").
		Joins("JOIN fault_definitions ON fault_history.fault_id = fault_definitions.id")

	// Aplicar filtros
	if eclusa != "" {
		query = query.Where("fault_definitions.eclusa = ?", eclusa)
	}
	if subsistema != "" {
		query = query.Where("fault_definitions.subsistema = ?", subsistema)
	}
	if !startTime.IsZero() {
		query = query.Where("fault_history.fim_timestamp >= ?", startTime)
	}
	if !endTime.IsZero() {
		query = query.Where("fault_history.inicio_timestamp <= ?", endTime)
	}

	// Ordenar e obter resultados
	err := query.Order("fault_history.inicio_timestamp DESC").
		Find(&history).Error

	return history, err
}

// AcknowledgeFault marca uma falha como reconhecida
func (fm *FaultManager) AcknowledgeFault(faultID uint, userID uint, userName string) error {
	now := time.Now()

	// Atualizar o banco
	err := config.DB.Exec(`
		UPDATE fault_status 
		SET reconhecido = true, reconhecido_por = ?, reconhecido_em = ? 
		WHERE fault_id = ? AND ativo = true
	`, userID, now, faultID).Error

	if err != nil {
		return err
	}

	// Atualizar cache
	fm.statusCacheMutex.Lock()
	if status, exists := fm.activeStatuses[faultID]; exists {
		status.Reconhecido = true
		status.ReconhecidoPor = &userID
		status.ReconhecidoEm = &now
	}
	fm.statusCacheMutex.Unlock()

	// Buscar informações da falha para publicação
	var def FaultDefinition
	if err := config.DB.First(&def, "id = ?", faultID).Error; err != nil {
		return err
	}

	// Buscar nome do PLC
	var plc PLC
	config.DB.Select("nome").First(&plc, def.PLCID)

	// Publicar evento de reconhecimento via NATS
	if fm.natsClient != nil && fm.natsClient.IsConnected() {
		event := map[string]interface{}{
			"id":              def.ID,
			"plc_id":          def.PLCID,
			"plc_nome":        plc.Nome,
			"word_name":       def.WordName,
			"bit_offset":      def.BitOffset,
			"eclusa":          def.Eclusa,
			"subsistema":      def.Subsistema,
			"descricao":       def.Descricao,
			"tipo":            def.Tipo,
			"reconhecido":     true,
			"reconhecido_por": userID,
			"user_name":       userName,
			"reconhecido_em":  now,
		}

		msg := NatsMessage{
			Type: "fault_acknowledged",
			Data: event,
		}

		if payload, err := json.Marshal(msg); err == nil {
			fm.natsClient.conn.Publish("eclusa.falhas.reconhecidas", payload)
		}
	}

	return nil
}

// ReloadDefinitions recarrega as definições de falha do banco de dados
func (fm *FaultManager) ReloadDefinitions() error {
	// Parar todos os monitores atuais
	fm.stopChansMutex.Lock()
	for plcID, stopChan := range fm.stopChans {
		close(stopChan)
		delete(fm.stopChans, plcID)
	}
	fm.stopChansMutex.Unlock()

	// Limpar os monitores existentes
	fm.monitorMutex.Lock()
	fm.wordMonitors = make(map[string]*WordMonitorInfo)
	fm.monitorMutex.Unlock()

	// Recarregar definições
	err := fm.loadFaultDefinitions()
	if err != nil {
		return err
	}

	// Os PLCs ativos irão reiniciar o monitoramento automaticamente
	return nil
}
