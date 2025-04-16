package plc

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/nats-io/nats.go"
)

// NatsMessage representa uma mensagem NATS
type NatsMessage struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

// NatsClient gerencia comunicação com servidor NATS
type NatsClient struct {
	conn      *nats.Conn
	manager   *Manager
	subjects  map[string]string
	connected bool
}

// NewNatsClient cria um novo cliente NATS
func NewNatsClient() *NatsClient {
	return &NatsClient{
		subjects: map[string]string{
			"plc_status":  "plc.status",
			"tag_updates": "plc.tags.updates",
			"plc_updates": "plc.updates",
			"tag_write":   "plc.tags.write",
		},
		connected: false,
	}
}

// SetPLCManager associa o gerenciador PLC ao cliente NATS
func (c *NatsClient) SetPLCManager(manager *Manager) {
	c.manager = manager
}

// Connect conecta ao servidor NATS
func (c *NatsClient) Connect(url string) error {
	// Opções de conexão com retry automático
	opts := []nats.Option{
		nats.Name("PLC Manager NATS Client"),
		nats.ReconnectWait(time.Second * 5),
		nats.MaxReconnects(-1),
		nats.DisconnectErrHandler(func(nc *nats.Conn, err error) {
			log.Printf("[NATS] Desconectado do servidor: %v", err)
			c.connected = false
		}),
		nats.ReconnectHandler(func(nc *nats.Conn) {
			log.Printf("[NATS] Reconectado ao servidor em %s", nc.ConnectedUrl())
			c.connected = true
		}),
		nats.ErrorHandler(func(nc *nats.Conn, sub *nats.Subscription, err error) {
			log.Printf("[NATS] Erro na assinatura: %v", err)
		}),
	}

	var err error
	c.conn, err = nats.Connect(url, opts...)
	if err != nil {
		return fmt.Errorf("falha ao conectar com servidor NATS: %v", err)
	}

	c.connected = true
	log.Printf("[NATS] Conectado com sucesso ao servidor em %s", c.conn.ConnectedUrl())

	// Configurar assinatura para comandos de escrita
	_, err = c.conn.Subscribe(c.subjects["tag_write"], c.handleTagWriteCommand)
	if err != nil {
		return fmt.Errorf("falha ao assinar canal de escrita de tags: %v", err)
	}

	return nil
}

// IsConnected retorna o status da conexão
func (c *NatsClient) IsConnected() bool {
	return c.connected && c.conn != nil && c.conn.IsConnected()
}

// PublishPLCStatus publica o status do PLC
func (c *NatsClient) PublishPLCStatus(plc *PLC) error {
	if !c.IsConnected() {
		return fmt.Errorf("cliente NATS não está conectado")
	}

	status := map[string]interface{}{
		"id":          plc.ID,
		"nome":        plc.Nome,
		"ip_address":  plc.IPAddress,
		"conectado":   plc.Conectado,
		"ultimo_erro": plc.UltimoErro,
		"timestamp":   time.Now(),
	}

	// Publicar para o subject específico deste PLC e para o subject geral
	specificSubject := fmt.Sprintf("%s.%d", c.subjects["plc_status"], plc.ID)

	msg := NatsMessage{
		Type: "plc_status",
		Data: status,
	}

	payload, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("falha ao serializar status do PLC: %v", err)
	}

	// Publicar no canal específico do PLC
	if err := c.conn.Publish(specificSubject, payload); err != nil {
		return fmt.Errorf("falha ao publicar status específico do PLC: %v", err)
	}

	// Publicar no canal geral de status de PLCs
	if err := c.conn.Publish(c.subjects["plc_status"], payload); err != nil {
		return fmt.Errorf("falha ao publicar status geral do PLC: %v", err)
	}

	return nil
}

// PublishTagValue publica o valor de uma tag
func (c *NatsClient) PublishTagValue(plc *PLC, tag *Tag, value interface{}) error {
	if !c.IsConnected() {
		return fmt.Errorf("cliente NATS não está conectado")
	}

	data := map[string]interface{}{
		"plc_id":    plc.ID,
		"plc_nome":  plc.Nome,
		"tag_id":    tag.ID,
		"tag_nome":  tag.Nome,
		"valor":     value,
		"timestamp": tag.UltimaLeitura,
	}

	// Definir subjects para publicação
	specificTagSubject := fmt.Sprintf("%s.%d.%d", c.subjects["tag_updates"], plc.ID, tag.ID)
	plcTagsSubject := fmt.Sprintf("%s.%d", c.subjects["tag_updates"], plc.ID)

	msg := NatsMessage{
		Type: "tag_update",
		Data: data,
	}

	payload, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("falha ao serializar valor da tag: %v", err)
	}

	// Publicar no canal específico da tag
	if err := c.conn.Publish(specificTagSubject, payload); err != nil {
		return fmt.Errorf("falha ao publicar valor específico da tag: %v", err)
	}

	// Publicar no canal de todas as tags do PLC
	if err := c.conn.Publish(plcTagsSubject, payload); err != nil {
		return fmt.Errorf("falha ao publicar no canal de tags do PLC: %v", err)
	}

	// Publicar no canal geral de atualizações de tags
	if err := c.conn.Publish(c.subjects["tag_updates"], payload); err != nil {
		return fmt.Errorf("falha ao publicar no canal geral de tags: %v", err)
	}

	return nil
}

// handleTagWriteCommand processa comandos de escrita de tags recebidos via NATS
func (c *NatsClient) handleTagWriteCommand(msg *nats.Msg) {
	log.Printf("[NATS] Recebido comando de escrita: %s", string(msg.Data))

	var comando struct {
		TagID uint        `json:"tag_id"`
		PLCID uint        `json:"plc_id"`
		Valor interface{} `json:"valor"`
	}

	if err := json.Unmarshal(msg.Data, &comando); err != nil {
		log.Printf("[NATS] Erro ao decodificar comando: %v", err)
		return
	}

	if c.manager == nil {
		log.Printf("[NATS] Gerenciador PLC não configurado")
		return
	}

	// Verificar se o PLC existe
	if _, exists := c.manager.GetPLC(comando.PLCID); !exists {
		log.Printf("[NATS] PLC ID %d não encontrado", comando.PLCID)
		return
	}

	// Escrever valor na tag
	err := c.manager.WriteTag(comando.PLCID, comando.TagID, comando.Valor)
	if err != nil {
		log.Printf("[NATS] Erro ao escrever na tag %d: %v", comando.TagID, err)

		// Responder com erro se houver um reply subject
		if msg.Reply != "" {
			response := map[string]interface{}{
				"sucesso":  false,
				"mensagem": fmt.Sprintf("Erro ao escrever na tag: %v", err),
			}

			responseJSON, _ := json.Marshal(response)
			c.conn.Publish(msg.Reply, responseJSON)
		}
		return
	}

	log.Printf("[NATS] Valor escrito com sucesso na tag ID %d", comando.TagID)

	// Responder com sucesso se houver um reply subject
	if msg.Reply != "" {
		response := map[string]interface{}{
			"sucesso":  true,
			"mensagem": "Valor escrito com sucesso",
		}

		responseJSON, _ := json.Marshal(response)
		c.conn.Publish(msg.Reply, responseJSON)
	}
}

// Close fecha a conexão NATS
func (c *NatsClient) Close() {
	if c.conn != nil {
		c.conn.Close()
		log.Println("[NATS] Conexão fechada")
	}
}
