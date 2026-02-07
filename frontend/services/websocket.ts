/**
 * WebSocket 客户端 - 用于接收后端提醒推送
 */

type MessageHandler = (message: WebSocketMessage) => void;

export interface WebSocketMessage {
    type: 'reminder' | 'connected' | 'pong' | 'error';
    payload: any;
}

export interface ReminderPayload {
    title: string;
    body: string;
    current_ml: number;
    goal_ml: number;
    timestamp: number;
}

class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string;
    private token: string = '';
    private userId: string = '';
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 3000;
    private handlers: Map<string, MessageHandler[]> = new Map();
    private pingInterval: number | null = null;

    constructor(baseUrl: string = 'ws://localhost:8080') {
        this.url = baseUrl;
    }

    /**
     * 连接到 WebSocket 服务器
     */
    connect(token: string, userId: string): void {
        this.token = token;
        this.userId = userId;

        if (this.ws?.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
        }

        const wsUrl = `${this.url}/api/v1/ws?token=${encodeURIComponent(token)}&user_id=${encodeURIComponent(userId)}`;

        try {
            this.ws = new WebSocket(wsUrl);
            this.setupEventHandlers();
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.scheduleReconnect();
        }
    }

    /**
     * 断开连接
     */
    disconnect(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }

        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }

        this.reconnectAttempts = 0;
    }

    /**
     * 注册消息处理器
     */
    on(type: string, handler: MessageHandler): void {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, []);
        }
        this.handlers.get(type)!.push(handler);
    }

    /**
     * 移除消息处理器
     */
    off(type: string, handler: MessageHandler): void {
        const handlers = this.handlers.get(type);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * 发送消息
     */
    send(type: string, payload: any = {}): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, payload }));
        }
    }

    /**
     * 发送确认收到提醒
     */
    ackReminder(): void {
        this.send('ack');
    }

    private setupEventHandlers(): void {
        if (!this.ws) return;

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
            this.startPingInterval();
        };

        this.ws.onclose = (event) => {
            console.log('WebSocket closed:', event.code, event.reason);
            this.stopPingInterval();

            if (event.code !== 1000) {
                this.scheduleReconnect();
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onmessage = (event) => {
            try {
                const message: WebSocketMessage = JSON.parse(event.data);
                this.dispatchMessage(message);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };
    }

    private dispatchMessage(message: WebSocketMessage): void {
        // 调用特定类型的处理器
        const handlers = this.handlers.get(message.type);
        if (handlers) {
            handlers.forEach(handler => handler(message));
        }

        // 调用通用处理器
        const allHandlers = this.handlers.get('*');
        if (allHandlers) {
            allHandlers.forEach(handler => handler(message));
        }
    }

    private scheduleReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnect attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
            if (this.token && this.userId) {
                this.connect(this.token, this.userId);
            }
        }, delay);
    }

    private startPingInterval(): void {
        this.pingInterval = window.setInterval(() => {
            this.send('ping');
        }, 30000);
    }

    private stopPingInterval(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

// 单例导出
export const wsClient = new WebSocketClient(
    import.meta.env.VITE_WS_URL || 'ws://localhost:8080'
);
