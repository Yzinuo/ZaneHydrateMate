/**
 * WebSocket client for reminder messages.
 */

import { getWebSocketBaseUrl } from '../api';

type MessageHandler = (message: WebSocketMessage) => void;

export type WebSocketMessageType =
  | 'reminder'
  | 'connected'
  | 'pong'
  | 'error'
  | 'disconnected'
  | 'reconnecting';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: unknown;
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
  private baseUrl: string;
  private token = '';
  private userId = '';
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 6;
  private readonly baseReconnectDelay = 1500;
  private readonly maxReconnectDelay = 15000;
  private reconnectTimer: number | null = null;
  private pingInterval: number | null = null;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private shouldReconnect = false;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  connect(token: string, userId: string): void {
    this.token = token;
    this.userId = userId;
    this.shouldReconnect = true;

    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.openSocket();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.reconnectAttempts = 0;

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopPingInterval();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.dispatchMessage({ type: 'disconnected', payload: { reason: 'manual_disconnect' } });
  }

  on(type: WebSocketMessageType | '*', handler: MessageHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }

    this.handlers.get(type)?.add(handler);
  }

  off(type: WebSocketMessageType | '*', handler: MessageHandler): void {
    this.handlers.get(type)?.delete(handler);
  }

  send(type: string, payload: unknown = {}): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return;
    }

    this.ws.send(JSON.stringify({ type, payload }));
  }

  ackReminder(): void {
    this.send('ack');
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private openSocket(): void {
    if (!this.token || !this.userId) {
      return;
    }

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const url = `${this.baseUrl}/api/v1/ws?token=${encodeURIComponent(this.token)}&user_id=${encodeURIComponent(this.userId)}`;

    try {
      this.ws = new WebSocket(url);
      this.setupEventHandlers();
    } catch (error) {
      this.dispatchMessage({ type: 'error', payload: { reason: 'connect_exception', error } });
      this.scheduleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) {
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.startPingInterval();
    };

    this.ws.onclose = (event) => {
      this.stopPingInterval();
      this.ws = null;

      this.dispatchMessage({
        type: 'disconnected',
        payload: { code: event.code, reason: event.reason }
      });

      if (this.shouldReconnect && event.code !== 1000) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      this.dispatchMessage({ type: 'error', payload: { reason: 'socket_error', error } });
    };

    this.ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as WebSocketMessage;
        this.dispatchMessage(parsed);
      } catch (error) {
        this.dispatchMessage({ type: 'error', payload: { reason: 'parse_error', error } });
      }
    };
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.dispatchMessage({
        type: 'error',
        payload: { reason: 'max_retries_reached', attempts: this.reconnectAttempts }
      });
      return;
    }

    this.reconnectAttempts += 1;

    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    this.dispatchMessage({
      type: 'reconnecting',
      payload: { attempt: this.reconnectAttempts, delay }
    });

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, delay);
  }

  private startPingInterval(): void {
    this.stopPingInterval();

    this.pingInterval = window.setInterval(() => {
      this.send('ping');
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval !== null) {
      window.clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private dispatchMessage(message: WebSocketMessage): void {
    const specific = this.handlers.get(message.type);
    specific?.forEach((handler) => handler(message));

    const allHandlers = this.handlers.get('*');
    allHandlers?.forEach((handler) => handler(message));
  }
}

export const wsClient = new WebSocketClient(getWebSocketBaseUrl());

