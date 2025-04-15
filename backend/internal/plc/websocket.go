package plc

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

// WSMessage representa uma mensagem WebSocket
type WSMessage struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

// ComandoEscrita representa um comando de escrita recebido do cliente
type ComandoEscrita struct {
	TagID uint        `json:"tag_id"`
	Valor interface{} `json:"valor"`
}

// WSClient representa uma conexão de cliente WebSocket
type WSClient struct {
	hub      *WSHub
	conn     *websocket.Conn
	send     chan []byte
	clientID string
}

// WSHub mantém conexões WebSocket ativas
type WSHub struct {
	clients    map[*WSClient]bool
	broadcast  chan []byte
	register   chan *WSClient
	unregister chan *WSClient
	manager    *Manager // Referência ao gerenciador PLC
	mutex      sync.RWMutex
}

// NewWSHub cria um novo hub WebSocket
// NewWSHub cria um novo hub WebSocket
func NewWSHub() *WSHub {
	return &WSHub{
		clients:    make(map[*WSClient]bool),
		broadcast:  make(chan []byte, 100),
		register:   make(chan *WSClient), // Inicialize com make()
		unregister: make(chan *WSClient), // Inicialize com make()
		// Não inicialize o manager aqui, será feito depois
	}
}

// SetPLCManager associa o gerenciador PLC ao hub WebSocket
func (h *WSHub) SetPLCManager(manager *Manager) {
	h.manager = manager
}

// Run inicia o hub WebSocket
func (h *WSHub) Run() {
	log.Println("[WebSocket] Hub iniciado e pronto para receber conexões")
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			h.clients[client] = true
			clientCount := len(h.clients)
			h.mutex.Unlock()

			log.Printf("[WebSocket] Novo cliente registrado: %s (total: %d)", client.clientID, clientCount)

			// Enviar status inicial para o novo cliente
			h.enviarStatusInicial(client)

		case client := <-h.unregister:
			h.mutex.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				log.Printf("[WebSocket] Cliente desconectado: %s (total: %d)", client.clientID, len(h.clients))
			}
			h.mutex.Unlock()

		case message := <-h.broadcast:
			h.mutex.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
					// Mensagem enviada com sucesso
				default:
					// Canal de envio cheio, desconectar cliente
					h.mutex.RUnlock()
					h.mutex.Lock()
					delete(h.clients, client)
					close(client.send)
					h.mutex.Unlock()
					h.mutex.RLock()
				}
			}
			h.mutex.RUnlock()
		}
	}
}

// enviarStatusInicial envia o status atual de todos os PLCs e tags para um novo cliente
func (h *WSHub) enviarStatusInicial(client *WSClient) {
	if h.manager == nil {
		log.Println("[WebSocket] Gerenciador PLC não configurado")
		return
	}

	// Preparar mensagem de boas-vindas
	welcomeMsg := WSMessage{
		Type: "connected",
		Data: map[string]interface{}{
			"message": "Conexão WebSocket estabelecida com sucesso",
			"time":    time.Now(),
		},
	}

	if welcomeJSON, err := json.Marshal(welcomeMsg); err == nil {
		client.send <- welcomeJSON
	}

	// Enviar status de todos os PLCs
	h.mutex.RLock()
	for plcID, plc := range h.manager.plcs {
		// Status do PLC
		statusMsg := WSMessage{
			Type: "plc_status",
			Data: map[string]interface{}{
				"id":          plcID,
				"nome":        plc.Nome,
				"ip_address":  plc.IPAddress,
				"conectado":   plc.Conectado,
				"ultimo_erro": plc.UltimoErro,
				"timestamp":   time.Now(),
			},
		}

		statusJSON, err := json.Marshal(statusMsg)
		if err == nil {
			client.send <- statusJSON
		}

		// Valores de todas as tags
		for _, tag := range plc.Tags {
			if tag.UltimoValor != nil {
				tagMsg := WSMessage{
					Type: "tag_update",
					Data: map[string]interface{}{
						"plc_id":    plcID,
						"plc_nome":  plc.Nome,
						"tag_id":    tag.ID,
						"tag_nome":  tag.Nome,
						"valor":     tag.UltimoValor,
						"timestamp": tag.UltimaLeitura,
					},
				}

				tagJSON, err := json.Marshal(tagMsg)
				if err == nil {
					client.send <- tagJSON
				}
			}
		}
	}
	h.mutex.RUnlock()
}

// Broadcast envia uma mensagem para todos os clientes conectados
func (h *WSHub) Broadcast(message WSMessage) {
	jsonMsg, err := json.Marshal(message)
	if err != nil {
		log.Printf("[WebSocket] Erro ao serializar mensagem: %v", err)
		return
	}

	h.mutex.RLock()
	clientCount := len(h.clients)
	h.mutex.RUnlock()

	if clientCount > 0 {
		h.broadcast <- jsonMsg
	} else {
		log.Printf("[WebSocket] Nenhum cliente conectado, mensagem '%s' descartada", message.Type)
	}
}

// Stop para o hub WebSocket
func (h *WSHub) Stop() {
	log.Println("[WebSocket] Solicitação para parar o hub recebida")

	h.mutex.Lock()
	for client := range h.clients {
		close(client.send)
	}
	h.clients = make(map[*WSClient]bool)
	h.mutex.Unlock()
}

// HandleWebSocket gerencia conexões WebSocket
func (h *WSHub) HandleWebSocket(c *websocket.Conn) {
	clientID := c.Query("client_id")
	if clientID == "" {
		clientID = fmt.Sprintf("anônimo-%p", c)
	}

	log.Printf("[WebSocket] Nova conexão recebida: %s de %s", clientID, c.RemoteAddr().String())

	client := &WSClient{
		hub:      h,
		conn:     c,
		send:     make(chan []byte, 100), // Buffer maior
		clientID: clientID,
	}

	h.register <- client

	// Inicia goroutines para leitura e escrita
	go client.bombearLeitura()
	go client.bombearEscrita()
}

// bombearLeitura lê mensagens da conexão WebSocket
func (c *WSClient) bombearLeitura() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
		log.Printf("[WebSocket] bombearLeitura encerrado para cliente: %s", c.clientID)
	}()

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err) {
				log.Printf("[WebSocket] Erro na leitura do cliente %s: %v", c.clientID, err)
			}
			break
		}

		log.Printf("[WebSocket] Mensagem recebida do cliente %s: %s", c.clientID, string(message))

		// Processar comandos de escrita
		var comando ComandoEscrita
		if err := json.Unmarshal(message, &comando); err != nil {
			log.Printf("[WebSocket] Erro ao decodificar comando: %v", err)
			continue
		}

		if comando.TagID > 0 && c.hub.manager != nil {
			// Encontrar a tag para escrever
			var plcID uint
			var tagEncontrada bool

			c.hub.mutex.RLock()
			for pid, plc := range c.hub.manager.plcs {
				for _, tag := range plc.Tags {
					if tag.ID == comando.TagID {
						plcID = pid
						tagEncontrada = true
						break
					}
				}
				if tagEncontrada {
					break
				}
			}
			c.hub.mutex.RUnlock()

			if tagEncontrada {
				log.Printf("[WebSocket] Escrevendo valor na tag ID %d: %v", comando.TagID, comando.Valor)
				err := c.hub.manager.WriteTag(plcID, comando.TagID, comando.Valor)
				if err != nil {
					log.Printf("[WebSocket] Erro ao escrever na tag: %v", err)
				} else {
					log.Printf("[WebSocket] Valor escrito com sucesso na tag ID %d", comando.TagID)
				}
			} else {
				log.Printf("[WebSocket] Tag ID %d não encontrada", comando.TagID)
			}
		}
	}
}

// bombearEscrita escreve mensagens na conexão WebSocket
func (c *WSClient) bombearEscrita() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
		log.Printf("[WebSocket] bombearEscrita encerrado para cliente: %s", c.clientID)
	}()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				// Canal fechado
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			err := c.conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				log.Printf("[WebSocket] Erro ao enviar mensagem para cliente %s: %v", c.clientID, err)
				return
			}

		case <-ticker.C:
			// Enviar ping para manter a conexão viva
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// SetupWebSocketRoutes configura a rota WebSocket
func SetupWebSocketRoutes(app *fiber.App, hub *WSHub) {
	log.Println("[WebSocket] Configurando rotas WebSocket em /ws")

	// Rota para verificar status
	app.Get("/ws-status", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":   "online",
			"clientes": len(hub.clients),
		})
	})

	// Middleware que aceita qualquer origem para WebSocket
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed_origins", "*") // Permite todas as origens
			return c.Next()
		}
		return c.Status(fiber.StatusUpgradeRequired).SendString("Upgrade para WebSocket necessário")
	})

	// Rota WebSocket
	app.Get("/ws", websocket.New(func(c *websocket.Conn) {
		hub.HandleWebSocket(c)
	}, websocket.Config{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}))

	log.Println("[WebSocket] Rotas WebSocket configuradas com sucesso")
}
