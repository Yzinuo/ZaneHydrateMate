/**
 * Local notification utilities (no websocket dependency).
 */

export type ScheduleEvery = 'year' | 'month' | 'two-weeks' | 'week' | 'day' | 'hour' | 'minute' | 'second';

export interface LocalNotificationSchedule {
  at?: Date;
  repeats?: boolean;
  allowWhileIdle?: boolean;
  on?: {
    year?: number;
    month?: number;
    day?: number;
    weekday?: number;
    hour?: number;
    minute?: number;
    second?: number;
  };
  every?: ScheduleEvery;
  count?: number;
}

export interface LocalNotificationSchema {
  title: string;
  body: string;
  id: number;
  sound?: string;
  extra?: unknown;
  channelId?: string;
  schedule?: LocalNotificationSchedule;
}

interface LocalNotificationChannel {
  id: string;
  name: string;
  description?: string;
  importance?: number;
  visibility?: number;
  vibration?: boolean;
  lights?: boolean;
  sound?: string;
}

interface LocalNotificationsPlugin {
  schedule(options: { notifications: LocalNotificationSchema[] }): Promise<void>;
  cancel(options: { notifications: Array<{ id: number }> }): Promise<void>;
  createChannel(channel: LocalNotificationChannel): Promise<void>;
  requestPermissions(): Promise<{ display: string }>;
  checkPermissions(): Promise<{ display: string }>;
}

export interface ReminderPayload {
  title: string;
  body: string;
  current_ml: number;
  goal_ml: number;
  timestamp: number;
}

export interface ReminderEvent {
  type: 'connected' | 'disconnected' | 'error';
  payload: unknown;
}

export type NotificationPermissionState = NotificationPermission | 'unsupported';

export interface ReminderServiceCallbacks {
  onReminder?: (payload: ReminderPayload) => void;
  onConnectionChange?: (connected: boolean) => void;
  onConnectionEvent?: (message: ReminderEvent) => void;
}

export const SYSTEM_REMINDER_CHANNEL_ID = 'hydration-reminders';

let LocalNotifications: LocalNotificationsPlugin | null = null;
let localNotificationId = 1;
let reminderConnected = false;
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

export async function ensureReminderChannel(): Promise<void> {
  await initCapacitorNotifications();
  if (!LocalNotifications || typeof LocalNotifications.createChannel !== 'function') {
    return;
  }

  await LocalNotifications.createChannel({
    id: SYSTEM_REMINDER_CHANNEL_ID,
    name: 'Hydration Reminders',
    description: 'Scheduled hydration reminder alerts',
    importance: 4,
    vibration: true
  });
}

export async function scheduleNotifications(notifications: LocalNotificationSchema[]): Promise<boolean> {
  await initCapacitorNotifications();
  if (!LocalNotifications || notifications.length === 0) {
    return false;
  }

  await LocalNotifications.schedule({ notifications });
  return true;
}

export async function cancelNotifications(ids: number[]): Promise<boolean> {
  await initCapacitorNotifications();
  if (!LocalNotifications || ids.length === 0) {
    return false;
  }

  await LocalNotifications.cancel({
    notifications: ids.map((id) => ({ id }))
  });
  return true;
}

export async function showNotification(title: string, body: string, extra?: unknown): Promise<boolean> {
  await initCapacitorNotifications();

  if (LocalNotifications) {
    await ensureReminderChannel();
    await LocalNotifications.schedule({
      notifications: [
        {
          id: localNotificationId++,
          title,
          body,
          sound: 'default',
          channelId: SYSTEM_REMINDER_CHANNEL_ID,
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

export function connectReminderService(
  _token: string | null,
  _userId: string | null,
  callbacks: ReminderServiceCallbacks = {}
): () => void {
  if (reminderCleanup) {
    reminderCleanup();
    reminderCleanup = null;
  }

  reminderConnected = true;
  callbacks.onConnectionChange?.(true);
  callbacks.onConnectionEvent?.({ type: 'connected', payload: { mode: 'local' } });

  const cleanup = () => {
    reminderConnected = false;
    callbacks.onConnectionChange?.(false);
    callbacks.onConnectionEvent?.({ type: 'disconnected', payload: { mode: 'local' } });
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

  reminderConnected = false;
}

export function isReminderServiceConnected(): boolean {
  return reminderConnected;
}
