package websocket

import (
	"encoding/json"
	"log"
)

// mustMarshal JSON 序列化，失败时返回错误消息
func mustMarshal(v interface{}) []byte {
	data, err := json.Marshal(v)
	if err != nil {
		log.Printf("WebSocket: Failed to marshal message: %v", err)
		return []byte(`{"type":"error","payload":"marshal_failed"}`)
	}
	return data
}
