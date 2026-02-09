package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // 开发环境允许所有来源
	},
}

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
)

// Handler WebSocket 处理器
type Handler struct {
	Hub *Hub
}

// NewHandler 创建 WebSocket 处理器
func NewHandler(hub *Hub) *Handler {
	return &Handler{Hub: hub}
}

// ServeWS 处理 WebSocket 连接请求
func (h *Handler) ServeWS(c *gin.Context) {
	// 从查询参数获取 token（WebSocket 不支持 Header）
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing_token"})
		return
	}

	// 从 context 获取 userID（需要先通过中间件验证）
	userIDStr := c.Query("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_user_id"})
		return
	}

	// 升级 HTTP 连接为 WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	client := &Client{
		UserID: userID,
		Conn:   conn,
		Send:   make(chan []byte, 256),
	}

	h.Hub.Register(client)

	// 启动读写 goroutine
	go h.writePump(client)
	go h.readPump(client)

	// 发送连接成功消息
	client.Send <- mustMarshal(&Message{
		Type: "connected",
		Payload: map[string]interface{}{
			"message":   "WebSocket connected",
			"timestamp": time.Now().Unix(),
		},
	})
}

// readPump 从 WebSocket 读取消息
func (h *Handler) readPump(client *Client) {
	defer func() {
		h.Hub.Unregister(client)
		client.Conn.Close()
	}()

	client.Conn.SetReadLimit(maxMessageSize)
	client.Conn.SetReadDeadline(time.Now().Add(pongWait))
	client.Conn.SetPongHandler(func(string) error {
		client.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := client.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// 处理客户端消息
		h.handleClientMessage(client, message)
	}
}

// writePump 向 WebSocket 写入消息
func (h *Handler) writePump(client *Client) {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		client.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-client.Send:
			client.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := client.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// 批量发送队列中的其他消息
			n := len(client.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-client.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			client.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := client.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleClientMessage 处理客户端发送的消息
func (h *Handler) handleClientMessage(client *Client, message []byte) {
	var msg Message
	if err := json.Unmarshal(message, &msg); err != nil {
		log.Printf("Invalid message from client: %v", err)
		return
	}

	switch msg.Type {
	case "ack":
		// 客户端确认收到提醒
		log.Printf("User %s acknowledged reminder", client.UserID)
	case "ping":
		// 心跳响应
		client.Send <- mustMarshal(&Message{Type: "pong", Payload: time.Now().Unix()})
	}
}
