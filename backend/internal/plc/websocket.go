package plc

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

// WSMessage representa uma mensagem WebSocket
type WSMessage struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
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
	stopChan   chan struct{}
	mutex      sync.RWMutex
}

// NewWSHub cria um novo hub WebSocket
func NewWSHub() *WSHub {
	return &WSHub{
		clients:    make(map[*WSClient]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *WSClient),
		unregister: make(chan *WSClient),
		stopChan:   make(chan struct{}),
	}
}

// Run inicia o hub WebSocket
func (h *WSHub) Run() {
	for {
		select {
		case <-h.stopChan:
			// Fecha todas as conexões de cliente
			h.mutex.Lock()
			for client := range h.clients {
				close(client.send)
				delete(h.clients, client)
			}
			h.mutex.Unlock()
			return

		case client := <-h.register:
			h.mutex.Lock()
			h.clients[client] = true
			h.mutex.Unlock()

		case client := <-h.unregister:
			h.mutex.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mutex.Unlock()

		case message := <-h.broadcast:
			h.mutex.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mutex.RUnlock()
		}
	}
}

// Broadcast envia uma mensagem para todos os clientes conectados
func (h *WSHub) Broadcast(message WSMessage) {
	jsonMsg, err := json.Marshal(message)
	if err != nil {
		log.Printf("Erro ao serializar mensagem WebSocket: %v", err)
		return
	}

	h.broadcast <- jsonMsg
}

// Stop para o hub WebSocket
func (h *WSHub) Stop() {
	close(h.stopChan)
}

// HandleWebSocket gerencia conexões WebSocket
func (h *WSHub) HandleWebSocket(c *websocket.Conn) {
	clientID := c.Query("client_id")
	if clientID == "" {
		clientID = "anonimo"
	}

	client := &WSClient{
		hub:      h,
		conn:     c,
		send:     make(chan []byte, 256),
		clientID: clientID,
	}

	client.hub.register <- client

	// Inicia goroutines para leitura e escrita
	go client.readPump()
	go client.writePump()
}

// readPump lê mensagens da conexão WebSocket
func (c *WSClient) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			break
		}

		// Não estamos processando mensagens recebidas por enquanto
	}
}

// writePump escreve mensagens na conexão WebSocket
func (c *WSClient) writePump() {
	defer c.conn.Close()

	for {
		message, ok := <-c.send
		if !ok {
			// Canal fechado
			c.conn.WriteMessage(websocket.CloseMessage, []byte{})
			return
		}

		err := c.conn.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			log.Printf("Erro ao escrever no WebSocket: %v", err)
			return
		}
	}
}

// SetupWebSocketRoutes configura a rota WebSocket
func SetupWebSocketRoutes(app *fiber.App, hub *WSHub) {
	app.Use("/ws", func(c *fiber.Ctx) error {
		// Verificar se o cliente solicita upgrade para WebSocket
		if websocket.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return c.Status(fiber.StatusUpgradeRequired).SendString("Upgrade necessário para WebSocket")
	})

	app.Get("/ws", websocket.New(func(c *websocket.Conn) {
		hub.HandleWebSocket(c)
	}))
}
