package plc

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/danilo/edp_gestao_utilizadores/internal/config"
	"github.com/gofiber/fiber/v2"
)

// Manager gerencia conexões PLC e coleta de dados
type Manager struct {
	plcs        map[uint]*PLC
	redisClient *RedisClient
	natsClient  *NatsClient // Cliente NATS para comunicação em tempo real
	stopChan    chan struct{}
	wg          sync.WaitGroup
	mutex       sync.RWMutex
}

// NewManager cria um novo gerenciador PLC
func NewManager() *Manager {
	return &Manager{
		plcs:     make(map[uint]*PLC),
		stopChan: make(chan struct{}),
	}
}

// Initialize carrega PLCs e tags do banco de dados e inicia conexões
func (m *Manager) Initialize(app *fiber.App) error {
	// Inicializar cliente Redis (mantido para compatibilidade com código existente)
	m.redisClient = NewRedisClient()

	// Inicializar cliente NATS
	m.natsClient = NewNatsClient()
	m.natsClient.SetPLCManager(m)

	// Obter URL do NATS do ambiente ou usar padrão
	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = "nats://localhost:4222" // URL padrão
	}

	// Conectar ao servidor NATS
	if err := m.natsClient.Connect(natsURL); err != nil {
		log.Printf("Aviso: Falha ao conectar com servidor NATS: %v", err)
		// Continuar mesmo com falha, pois o NATS tentará reconectar automaticamente
	}

	// Carregar PLCs do banco de dados
	err := m.loadPLCs()
	if err != nil {
		return fmt.Errorf("falha ao carregar PLCs: %v", err)
	}

	// Iniciar conexões e coleta de dados
	m.startAll()

	return nil
}

// loadPLCs consulta o banco de dados para PLCs e suas tags
func (m *Manager) loadPLCs() error {
	// Consultar PLCs
	rows, err := config.DB.Raw("SELECT id, nome, ip_address, rack, slot, gateway, ativo FROM plcs").Rows()
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var plc PLC
		var gateway sql.NullString // Usar sql.NullString para colunas que podem ser NULL

		// Escanear para variáveis, usando gateway como NullString
		err := rows.Scan(&plc.ID, &plc.Nome, &plc.IPAddress, &plc.Rack, &plc.Slot, &gateway, &plc.Ativo)
		if err != nil {
			return err
		}

		// Converter o valor NULL ou string para a estrutura
		if gateway.Valid {
			gatewayStr := gateway.String
			plc.Gateway = &gatewayStr
		} else {
			plc.Gateway = nil
		}

		// Apenas considerar PLCs ativos
		if !plc.Ativo {
			continue
		}

		// Carregar tags para este PLC
		err = m.loadTags(&plc)
		if err != nil {
			log.Printf("Falha ao carregar tags para PLC %d: %v", plc.ID, err)
			continue
		}

		m.mutex.Lock()
		m.plcs[plc.ID] = &plc
		m.mutex.Unlock()
	}

	log.Printf("Carregados %d PLCs do banco de dados", len(m.plcs))
	return nil
}

// loadTags consulta o banco de dados para tags associadas a um PLC
func (m *Manager) loadTags(plc *PLC) error {
	rows, err := config.DB.Raw(`
		SELECT id, plc_id, nome, db_number, byte_offset, bit_offset, 
		       tipo, tamanho, subsistema, descricao, ativo, 
		       update_interval_ms, only_on_change 
		FROM tags 
		WHERE plc_id = ? AND ativo = true
	`, plc.ID).Rows()

	if err != nil {
		return err
	}
	defer rows.Close()

	var tags []Tag

	for rows.Next() {
		var tag Tag
		var subsistema sql.NullString
		var descricao sql.NullString

		err := rows.Scan(
			&tag.ID, &tag.PLCID, &tag.Nome, &tag.DBNumber,
			&tag.ByteOffset, &tag.BitOffset, &tag.Tipo,
			&tag.Tamanho, &subsistema, &descricao,
			&tag.Ativo, &tag.UpdateInterval, &tag.OnlyOnChange,
		)
		if err != nil {
			return err
		}

		// Converter o valor NULL ou string para a estrutura
		if subsistema.Valid {
			subsistemaStr := subsistema.String
			tag.Subsistema = &subsistemaStr
		} else {
			tag.Subsistema = nil
		}

		// Converter o valor NULL ou string para a estrutura
		if descricao.Valid {
			descricaoStr := descricao.String
			tag.Descricao = &descricaoStr
		} else {
			tag.Descricao = nil
		}

		tags = append(tags, tag)
	}

	plc.Tags = tags
	log.Printf("Carregadas %d tags para PLC %s (ID: %d)", len(tags), plc.Nome, plc.ID)

	return nil
}

// startAll inicializa conexões com todos os PLCs e inicia coleta de dados
func (m *Manager) startAll() {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	for _, plc := range m.plcs {
		m.wg.Add(1)
		go m.startPLC(plc)
	}
}

// startPLC inicializa uma conexão com um PLC e inicia coleta de dados
func (m *Manager) startPLC(plc *PLC) {
	defer m.wg.Done()

	client, err := NewS7Client(plc)
	if err != nil {
		log.Printf("Falha ao criar cliente S7 para PLC %s: %v", plc.Nome, err)
		plc.UltimoErro = err.Error()
		return
	}

	plc.Client = client

	// Criar um stopChan para este PLC
	plcStopChan := make(chan struct{})

	// Escutar pelo sinal global de parada
	go func() {
		select {
		case <-m.stopChan:
			close(plcStopChan)
		}
	}()

	// Loop de tentativa de conexão
	for {
		select {
		case <-plcStopChan:
			client.Disconnect()
			return
		default:
			err := client.Connect()
			if err != nil {
				log.Printf("Falha ao conectar com PLC %s: %v. Tentando novamente em 5s...", plc.Nome, err)
				plc.Conectado = false
				plc.UltimoErro = err.Error()

				// Publicar status de conexão
				m.publishPLCStatus(plc)

				// Esperar antes de tentar novamente
				time.Sleep(5 * time.Second)
				continue
			}

			plc.Conectado = true
			plc.UltimoErro = ""
			log.Printf("Conectado ao PLC %s em %s", plc.Nome, plc.IPAddress)

			// Publicar status de conexão
			m.publishPLCStatus(plc)

			// Iniciar leitores de tag
			tagStopChans := make([]chan struct{}, len(plc.Tags))
			for i := range plc.Tags {
				tagStopChans[i] = make(chan struct{})
				m.wg.Add(1)
				go m.readTag(plc, &plc.Tags[i], tagStopChans[i])
			}

			// Monitorar conexão
			for {
				select {
				case <-plcStopChan:
					// Fechar todos os canais de parada de tag
					for _, ch := range tagStopChans {
						close(ch)
					}
					client.Disconnect()
					return
				case <-time.After(30 * time.Second):
					// Verificação periódica de conexão
					if !client.IsConnected() {
						log.Printf("Perdeu conexão com PLC %s. Reconectando...", plc.Nome)
						plc.Conectado = false

						// Fechar todos os canais de parada de tag
						for _, ch := range tagStopChans {
							close(ch)
						}

						// Publicar status de conexão
						m.publishPLCStatus(plc)

						// Sair deste loop para reconectar
						break
					}
				}

				// Se saímos do select devido à perda de conexão, também saímos do loop for
				if !plc.Conectado {
					break
				}
			}
		}
	}
}

// readTag lê periodicamente uma tag do PLC
func (m *Manager) readTag(plc *PLC, tag *Tag, stopChan chan struct{}) {
	defer m.wg.Done()

	ticker := time.NewTicker(time.Duration(tag.UpdateInterval) * time.Millisecond)
	defer ticker.Stop()

	s7Client := plc.Client.(*S7Client)

	for {
		select {
		case <-stopChan:
			return
		case <-ticker.C:
			if !plc.Conectado {
				continue
			}

			value, err := s7Client.ReadTag(tag)

			tag.UltimaLeitura = time.Now()

			if err != nil {
				tag.UltimoErro = err.Error()
				tag.UltimoErroTime = time.Now()
				fmt.Printf("\033[31m[ERRO] PLC %s - Tag %s: %v\033[0m\n", plc.Nome, tag.Nome, err)
				continue
			}

			// Verificar se o valor mudou
			valueChanged := tag.UltimoValor != value

			// Publicar apenas se o valor mudou ou não estamos publicando apenas em mudanças
			if !tag.OnlyOnChange || valueChanged {
				tag.UltimoValor = value

				// Apresentar o valor no terminal de forma clara
				// Usar cores para melhor visualização
				tagInfo := ""
				if tag.Subsistema != nil {
					tagInfo = fmt.Sprintf("%s.", *tag.Subsistema)
				}

				// Cor para valores diferentes tipos
				var valueStr string
				switch v := value.(type) {
				case bool:
					if v {
						valueStr = fmt.Sprintf("\033[32m%v\033[0m", v) // Verde para true
					} else {
						valueStr = fmt.Sprintf("\033[31m%v\033[0m", v) // Vermelho para false
					}
				case float32, float64:
					valueStr = fmt.Sprintf("\033[36m%.2f\033[0m", v) // Ciano para floats
				case int, int16, int32, int64, uint, uint16, uint32, uint64:
					valueStr = fmt.Sprintf("\033[33m%v\033[0m", v) // Amarelo para inteiros
				case string:
					valueStr = fmt.Sprintf("\033[35m\"%s\"\033[0m", v) // Roxo para strings
				default:
					valueStr = fmt.Sprintf("%v", v)
				}

				fmt.Printf("\033[1m[PLC]\033[0m \033[34m%s\033[0m - \033[36m%s%s\033[0m: %s\n",
					plc.Nome, tagInfo, tag.Nome, valueStr)

				// Publicar no Redis (mantido para compatibilidade)
				m.publishTagValue(plc, tag, value)

				// Publicar no NATS
				if m.natsClient != nil && m.natsClient.IsConnected() {
					if err := m.natsClient.PublishTagValue(plc, tag, value); err != nil {
						log.Printf("Falha ao publicar valor da tag no NATS: %v", err)
					}
				}
			}
		}
	}
}

// publishPLCStatus publica o status de conexão do PLC via NATS e Redis
func (m *Manager) publishPLCStatus(plc *PLC) {
	// Publicar no NATS
	if m.natsClient != nil && m.natsClient.IsConnected() {
		if err := m.natsClient.PublishPLCStatus(plc); err != nil {
			log.Printf("Falha ao publicar status PLC no NATS: %v", err)
		}
	}

	// Manter publicação no Redis para compatibilidade com código existente
	if m.redisClient != nil {
		// Criar dados de status
		status := map[string]interface{}{
			"id":          plc.ID,
			"nome":        plc.Nome,
			"ip_address":  plc.IPAddress,
			"conectado":   plc.Conectado,
			"ultimo_erro": plc.UltimoErro,
			"timestamp":   time.Now(),
		}

		// Converter para JSON
		statusJSON, err := json.Marshal(status)
		if err != nil {
			log.Printf("Falha ao serializar status PLC: %v", err)
			return
		}

		// Publicar no Redis
		err = m.redisClient.Publish("plc:status", string(statusJSON))
		if err != nil {
			log.Printf("Falha ao publicar status PLC no Redis: %v", err)
		}
	}
}

// publishTagValue publica um valor de tag no Redis e NATS
func (m *Manager) publishTagValue(plc *PLC, tag *Tag, value interface{}) {
	// Manter publicação no Redis para compatibilidade
	if m.redisClient != nil {
		// Criar dados de valor
		data := map[string]interface{}{
			"plc_id":    plc.ID,
			"plc_nome":  plc.Nome,
			"tag_id":    tag.ID,
			"tag_nome":  tag.Nome,
			"valor":     value,
			"timestamp": tag.UltimaLeitura,
		}

		// Converter para JSON
		dataJSON, err := json.Marshal(data)
		if err != nil {
			log.Printf("Falha ao serializar valor da tag: %v", err)
			return
		}

		// Publicar no Redis
		redisKey := fmt.Sprintf("plc:%d:tag:%d", plc.ID, tag.ID)
		err = m.redisClient.Set(redisKey, string(dataJSON))
		if err != nil {
			log.Printf("Falha ao definir valor da tag no Redis: %v", err)
		}

		// Também publicar em um canal para assinantes
		channelName := fmt.Sprintf("plc:%d:tag:%d:updates", plc.ID, tag.ID)
		err = m.redisClient.Publish(channelName, string(dataJSON))
		if err != nil {
			log.Printf("Falha ao publicar valor da tag no canal Redis: %v", err)
		}
	}

	// Nota: A publicação NATS é feita diretamente no método readTag
}

// Stop para todas as conexões PLC e coleta de dados
func (m *Manager) Stop() {
	close(m.stopChan)
	m.wg.Wait()

	// Fechar conexão NATS
	if m.natsClient != nil {
		m.natsClient.Close()
	}

	log.Println("Gerenciador PLC parado")
}

// GetPLC retorna um PLC gerenciado pelo ID
func (m *Manager) GetPLC(id uint) (*PLC, bool) {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	plc, exists := m.plcs[id]
	return plc, exists
}

// AddPLC adiciona um novo PLC ao gerenciador
func (m *Manager) AddPLC(plc *PLC) {
	// Verificar se o PLC já existe
	m.mutex.RLock()
	_, exists := m.plcs[plc.ID]
	m.mutex.RUnlock()

	if exists {
		m.RemovePLC(plc.ID) // Remover versão existente
	}

	// Carregar tags para este PLC
	err := m.loadTags(plc)
	if err != nil {
		log.Printf("Falha ao carregar tags para PLC %d: %v", plc.ID, err)
		return
	}

	m.mutex.Lock()
	m.plcs[plc.ID] = plc
	m.mutex.Unlock()

	m.wg.Add(1)
	go m.startPLC(plc)

	log.Printf("PLC adicionado ao gerenciador: %s (ID: %d)", plc.Nome, plc.ID)
}

// RemovePLC remove um PLC do gerenciador
func (m *Manager) RemovePLC(id uint) {
	m.mutex.Lock()
	plc, exists := m.plcs[id]
	if exists {
		delete(m.plcs, id)
	}
	m.mutex.Unlock()

	if exists {
		// Se o cliente existir, desconectar
		if s7Client, ok := plc.Client.(*S7Client); ok {
			s7Client.Disconnect()
		}

		log.Printf("PLC removido do gerenciador: %s (ID: %d)", plc.Nome, plc.ID)
	}
}

// RestartPLC reinicia a conexão com um PLC
func (m *Manager) RestartPLC(plc *PLC) {
	m.RemovePLC(plc.ID)
	m.AddPLC(plc)
}

// AddTagToPLC adiciona uma tag a um PLC gerenciado
func (m *Manager) AddTagToPLC(plcID uint, tag *Tag) {
	m.mutex.RLock()
	plc, exists := m.plcs[plcID]
	m.mutex.RUnlock()

	if !exists {
		log.Printf("Tentativa de adicionar tag a PLC não gerenciado: %d", plcID)
		return
	}

	// Verificar se a tag já existe
	for i, existingTag := range plc.Tags {
		if existingTag.ID == tag.ID {
			// Atualizar tag existente
			plc.Tags[i] = *tag
			log.Printf("Tag atualizada no PLC %s: %s (ID: %d)", plc.Nome, tag.Nome, tag.ID)
			return
		}
	}

	// Adicionar nova tag
	plc.Tags = append(plc.Tags, *tag)

	// Iniciar leitura da tag
	m.wg.Add(1)
	tagStopChan := make(chan struct{})
	go m.readTag(plc, tag, tagStopChan)

	log.Printf("Tag adicionada ao PLC %s: %s (ID: %d)", plc.Nome, tag.Nome, tag.ID)
}

// RemoveTagFromPLC remove uma tag de um PLC gerenciado
func (m *Manager) RemoveTagFromPLC(plcID uint, tagID uint) {
	m.mutex.RLock()
	plc, exists := m.plcs[plcID]
	m.mutex.RUnlock()

	if !exists {
		return
	}

	// Encontrar e remover a tag
	for i, tag := range plc.Tags {
		if tag.ID == tagID {
			// Remover tag do slice
			plc.Tags = append(plc.Tags[:i], plc.Tags[i+1:]...)
			log.Printf("Tag removida do PLC %s: ID %d", plc.Nome, tagID)
			return
		}
	}
}

// UpdateTagInPLC atualiza a configuração de uma tag em um PLC gerenciado
func (m *Manager) UpdateTagInPLC(plcID uint, tag *Tag) {
	m.RemoveTagFromPLC(plcID, tag.ID)
	m.AddTagToPLC(plcID, tag)
}

// ReadTag lê o valor atual de uma tag específica
func (m *Manager) ReadTag(plcID uint, tagID uint) (interface{}, error) {
	m.mutex.RLock()
	plc, exists := m.plcs[plcID]
	m.mutex.RUnlock()

	if !exists {
		return nil, fmt.Errorf("PLC não encontrado")
	}

	if !plc.Conectado {
		return nil, fmt.Errorf("PLC não está conectado")
	}

	// Encontrar a tag
	var tagToRead *Tag
	for i := range plc.Tags {
		if plc.Tags[i].ID == tagID {
			tagToRead = &plc.Tags[i]
			break
		}
	}

	if tagToRead == nil {
		return nil, fmt.Errorf("Tag não encontrada")
	}

	// Ler valor da tag
	s7Client := plc.Client.(*S7Client)
	value, err := s7Client.ReadTag(tagToRead)
	if err != nil {
		return nil, err
	}

	// Atualizar último valor
	tagToRead.UltimoValor = value
	tagToRead.UltimaLeitura = time.Now()

	return value, nil
}

// WriteTag escreve um valor em uma tag específica
func (m *Manager) WriteTag(plcID uint, tagID uint, value interface{}) error {
	m.mutex.RLock()
	plc, exists := m.plcs[plcID]
	m.mutex.RUnlock()

	if !exists {
		return fmt.Errorf("PLC não encontrado")
	}

	if !plc.Conectado {
		return fmt.Errorf("PLC não está conectado")
	}

	// Encontrar a tag
	var tagToWrite *Tag
	for i := range plc.Tags {
		if plc.Tags[i].ID == tagID {
			tagToWrite = &plc.Tags[i]
			break
		}
	}

	if tagToWrite == nil {
		return fmt.Errorf("Tag não encontrada")
	}

	// Escrever valor na tag
	s7Client := plc.Client.(*S7Client)
	err := s7Client.WriteTag(tagToWrite, value)
	if err != nil {
		return err
	}

	// Atualizar último valor
	tagToWrite.UltimoValor = value
	tagToWrite.UltimaLeitura = time.Now()

	// Publicar o novo valor no Redis (compatibilidade)
	m.publishTagValue(plc, tagToWrite, value)

	// Publicar no NATS
	if m.natsClient != nil && m.natsClient.IsConnected() {
		if err := m.natsClient.PublishTagValue(plc, tagToWrite, value); err != nil {
			log.Printf("Falha ao publicar valor escrito da tag no NATS: %v", err)
		}
	}

	return nil
}
