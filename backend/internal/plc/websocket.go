package plc

import (
	"encoding/json"
	"fmt"
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
	log.Println("[WebSocket] Hub iniciado e pronto para receber conexões")
	for {
		select {
		case <-h.stopChan:
			// Fecha todas as conexões de cliente
			h.mutex.Lock()
			log.Println("[WebSocket] Parando hub e fechando todas as conexões")
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
			log.Printf("[WebSocket] Novo cliente registrado: %s (total: %d)", client.clientID, len(h.clients))

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
			clientCount := len(h.clients)
			sentCount := 0
			for client := range h.clients {
				select {
				case client.send <- message:
					sentCount++
				default:
					close(client.send)
					delete(h.clients, client)
					log.Printf("[WebSocket] Cliente removido por não responder: %s", client.clientID)
				}
			}
			h.mutex.RUnlock()
			log.Printf("[WebSocket] Mensagem enviada para %d/%d clientes", sentCount, clientCount)
		}
	}
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
		log.Printf("[WebSocket] Mensagem '%s' enviada para broadcast (%d clientes)", message.Type, clientCount)
	} else {
		log.Printf("[WebSocket] Nenhum cliente conectado, mensagem '%s' descartada", message.Type)
	}
}

// Stop para o hub WebSocket
func (h *WSHub) Stop() {
	log.Println("[WebSocket] Solicitação para parar o hub recebida")
	close(h.stopChan)
}

// HandleWebSocket gerencia conexões WebSocket
func (h *WSHub) HandleWebSocket(c *websocket.Conn) {
	clientID := c.Query("client_id")
	if clientID == "" {
		clientID = fmt.Sprintf("anônimo-%p", c)
	}

	log.Printf("[WebSocket] Nova conexão recebida: %s", clientID)

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
		log.Printf("[WebSocket] readPump encerrado para cliente: %s", c.clientID)
	}()

	for {
		messageType, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[WebSocket] Erro na leitura do cliente %s: %v", c.clientID, err)
			} else {
				log.Printf("[WebSocket] Cliente %s fechou a conexão: %v", c.clientID, err)
			}
			break
		}

		log.Printf("[WebSocket] Mensagem recebida do cliente %s: tipo=%d, conteúdo=%s",
			c.clientID, messageType, string(message))

		// Aqui você pode processar a mensagem recebida do cliente se necessário
	}
}

// writePump escreve mensagens na conexão WebSocket
func (c *WSClient) writePump() {
	defer func() {
		c.conn.Close()
		log.Printf("[WebSocket] writePump encerrado para cliente: %s", c.clientID)
	}()

	for {
		message, ok := <-c.send
		if !ok {
			// Canal fechado
			log.Printf("[WebSocket] Canal de envio fechado para cliente: %s", c.clientID)
			c.conn.WriteMessage(websocket.CloseMessage, []byte{})
			return
		}

		err := c.conn.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			log.Printf("[WebSocket] Erro ao enviar mensagem para cliente %s: %v", c.clientID, err)
			return
		}

		// Descomente se quiser ver o conteúdo das mensagens enviadas
		// log.Printf("[WebSocket] Mensagem enviada para cliente %s: %s", c.clientID, string(message))
	}
}

// SetupWebSocketRoutes configura a rota WebSocket
func SetupWebSocketRoutes(app *fiber.App, hub *WSHub) {
	log.Println("[WebSocket] Configurando rotas WebSocket em /ws")

	app.Use("/ws", func(c *fiber.Ctx) error {
		// Verificar se o cliente solicita upgrade para WebSocket
		if websocket.IsWebSocketUpgrade(c) {
			log.Printf("[WebSocket] Solicitação de upgrade para WebSocket recebida de %s", c.IP())
			return c.Next()
		}
		log.Printf("[WebSocket] Solicitação rejeitada de %s - upgrade necessário", c.IP())
		return c.Status(fiber.StatusUpgradeRequired).SendString("Upgrade necessário para WebSocket")
	})

	app.Get("/ws", websocket.New(func(c *websocket.Conn) {
		log.Printf("[WebSocket] Conexão estabelecida com %s", c.RemoteAddr().String())
		hub.HandleWebSocket(c)
	}))

	log.Println("[WebSocket] Rotas WebSocket configuradas com sucesso")
}
