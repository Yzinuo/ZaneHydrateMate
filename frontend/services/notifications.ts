/**
 * Notification bridge for websocket reminders.
 */

import { wsClient, ReminderPayload, WebSocketMessage } from './websocket';

interface LocalNotificationSchema {
  title: string;
  body: string;
  id: number;
  sound?: string;
  extra?: unknown;
}

interface LocalNotificationsPlugin {
  schedule(options: { notifications: LocalNotificationSchema[] }): Promise<void>;
  requestPermissions(): Promise<{ display: string }>;
  checkPermissions(): Promise<{ display: string }>;
}

export type NotificationPermissionState = NotificationPermission | 'unsupported';

export interface ReminderServiceCallbacks {
  onReminder?: (payload: ReminderPayload) => void;
  onConnectionChange?: (connected: boolean) => void;
  onConnectionEvent?: (message: WebSocketMessage) => void;
}

let LocalNotifications: LocalNotificationsPlugin | null = null;
let localNotificationId = 1;
let reminderCleanup: (() => void) | null = null;

async function initCapacitorNotifications(): Promise<void> {
  if (LocalNotifications) {
    return;
  }

  try {
    const moduleName = '@capacitor/local-notifications';
    const capacitor = await import(/* @vite-ignore */ moduleName);
    LocalNotifications = capacitor.LocalNotifications as LocalNotificationsPlugin;
  } catch {
    LocalNotifications = null;
  }
}

export const getNotificationPermissionState = (): NotificationPermissionState => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  return Notification.permission;
};

export async function ensureNotificationPermission(): Promise<NotificationPermissionState> {
  await initCapacitorNotifications();

  if (LocalNotifications) {
    const current = await LocalNotifications.checkPermissions();
    if (current.display === 'granted') {
      return 'granted';
    }

    const requested = await LocalNotifications.requestPermissions();
    return requested.display === 'granted' ? 'granted' : 'denied';
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }

  return Notification.requestPermission();
}

export async function initNotifications(): Promise<boolean> {
  const permission = await ensureNotificationPermission();
  return permission === 'granted';
}

export async function showNotification(title: string, body: string, extra?: unknown): Promise<boolean> {
  await initCapacitorNotifications();

  if (LocalNotifications) {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: localNotificationId++,
          title,
          body,
          sound: 'default',
          extra
        }
      ]
    });
    return true;
  }

  const permission = getNotificationPermissionState();
  if (permission === 'unsupported') {
    return false;
  }

  if (permission !== 'granted') {
    const requested = await ensureNotificationPermission();
    if (requested !== 'granted') {
      return false;
    }
  }

  new Notification(title, { body, icon: '/img/1阶段.png' });
  return true;
}

function isReminderPayload(value: unknown): value is ReminderPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Partial<ReminderPayload>;
  return (
    typeof payload.title === 'string' &&
    typeof payload.body === 'string' &&
    typeof payload.current_ml === 'number' &&
    typeof payload.goal_ml === 'number' &&
    typeof payload.timestamp === 'number'
  );
}

export function connectReminderService(
  token: string,
  userId: string,
  callbacks: ReminderServiceCallbacks = {}
): () => void {
  if (reminderCleanup) {
    reminderCleanup();
    reminderCleanup = null;
  }

  const handleReminder = async (message: WebSocketMessage) => {
    if (!isReminderPayload(message.payload)) {
      return;
    }

    const payload = message.payload;
    callbacks.onReminder?.(payload);

    await showNotification(payload.title, payload.body, {
      current_ml: payload.current_ml,
      goal_ml: payload.goal_ml,
      timestamp: payload.timestamp
    });

    wsClient.ackReminder();
  };

  const handleConnected = (message: WebSocketMessage) => {
    callbacks.onConnectionChange?.(true);
    callbacks.onConnectionEvent?.(message);
  };

  const handleDisconnected = (message: WebSocketMessage) => {
    callbacks.onConnectionChange?.(false);
    callbacks.onConnectionEvent?.(message);
  };

  const handleReconnect = (message: WebSocketMessage) => {
    callbacks.onConnectionChange?.(false);
    callbacks.onConnectionEvent?.(message);
  };

  const handleError = (message: WebSocketMessage) => {
    callbacks.onConnectionEvent?.(message);
  };

  wsClient.on('reminder', handleReminder);
  wsClient.on('connected', handleConnected);
  wsClient.on('disconnected', handleDisconnected);
  wsClient.on('reconnecting', handleReconnect);
  wsClient.on('error', handleError);

  wsClient.connect(token, userId);

  const cleanup = () => {
    wsClient.off('reminder', handleReminder);
    wsClient.off('connected', handleConnected);
    wsClient.off('disconnected', handleDisconnected);
    wsClient.off('reconnecting', handleReconnect);
    wsClient.off('error', handleError);
    wsClient.disconnect();
  };

  reminderCleanup = cleanup;
  return cleanup;
}

export function disconnectReminderService(): void {
  if (reminderCleanup) {
    reminderCleanup();
    reminderCleanup = null;
    return;
  }

  wsClient.disconnect();
}

export function isReminderServiceConnected(): boolean {
  return wsClient.isConnected;
}



