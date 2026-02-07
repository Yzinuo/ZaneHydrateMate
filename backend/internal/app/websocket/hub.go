package websocket

import (
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// Client 代表一个 WebSocket 连接
type Client struct {
	UserID uuid.UUID
	Conn   *websocket.Conn
	Send   chan []byte
}

// Hub 管理所有活跃的 WebSocket 连接
type Hub struct {
	// 用户ID -> 客户端连接映射（支持一个用户多设备）
	clients    map[uuid.UUID]map[*Client]bool
	register   chan *Client
	unregister chan *Client
	broadcast  chan *Message
	mu         sync.RWMutex
}

// Message 提醒消息结构
type Message struct {
	Type    string      `json:"type"`    // "reminder", "sync", "ack"
	Payload interface{} `json:"payload"`
	UserID  uuid.UUID   `json:"-"` // 目标用户（不发送给客户端）
}

// ReminderPayload 提醒内容
type ReminderPayload struct {
	Title     string `json:"title"`
	Body      string `json:"body"`
	CurrentMl int    `json:"current_ml"`
	GoalMl    int    `json:"goal_ml"`
	Timestamp int64  `json:"timestamp"`
}

// NewHub 创建新的 Hub 实例
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[uuid.UUID]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *Message, 256),
	}
}

// Run 启动 Hub 的主循环
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if h.clients[client.UserID] == nil {
				h.clients[client.UserID] = make(map[*Client]bool)
			}
			h.clients[client.UserID][client] = true
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.clients[client.UserID]; ok {
				if _, exists := clients[client]; exists {
					delete(clients, client)
					close(client.Send)
					if len(clients) == 0 {
						delete(h.clients, client.UserID)
					}
				}
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			if clients, ok := h.clients[message.UserID]; ok {
				for client := range clients {
					select {
					case client.Send <- mustMarshal(message):
					default:
						// 发送缓冲区满，关闭连接
						close(client.Send)
						delete(clients, client)
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Register 注册客户端
func (h *Hub) Register(client *Client) {
	h.register <- client
}

// Unregister 注销客户端
func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}

// SendToUser 向特定用户发送消息
func (h *Hub) SendToUser(userID uuid.UUID, msgType string, payload interface{}) {
	h.broadcast <- &Message{
		Type:    msgType,
		Payload: payload,
		UserID:  userID,
	}
}

// IsUserOnline 检查用户是否在线
func (h *Hub) IsUserOnline(userID uuid.UUID) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	clients, ok := h.clients[userID]
	return ok && len(clients) > 0
}

// GetOnlineUserCount 获取在线用户数
func (h *Hub) GetOnlineUserCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}
