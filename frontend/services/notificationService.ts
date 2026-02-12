import { DoNotDisturbConfig } from '../types';
import { ensureNotificationPermission, getNotificationPermissionState, showNotification } from './notifications';

class NotificationService {
  private dndConfig: DoNotDisturbConfig = {
    enabled: false,
    start: '23:00',
    end: '07:00'
  };

  private scheduledTimeouts: Map<string, number> = new Map();

  constructor() {
    void this.requestPermission();
  }

  async requestPermission(): Promise<boolean> {
    const result = await ensureNotificationPermission();
    return result === 'granted';
  }

  setDoNotDisturb(config: DoNotDisturbConfig): void {
    this.dndConfig = config;
  }

  isInDoNotDisturb(date: Date = new Date()): boolean {
    if (!this.dndConfig.enabled) {
      return false;
    }

    const nowMinutes = date.getHours() * 60 + date.getMinutes();
    const [startH, startM] = this.dndConfig.start.split(':').map(Number);
    const [endH, endM] = this.dndConfig.end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes > endMinutes) {
      return nowMinutes >= startMinutes || nowMinutes <= endMinutes;
    }

    return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
  }

  scheduleNotification(id: string, title: string, body: string, delayMs: number): void {
    this.cancelNotification(id);

    const timeoutId = window.setTimeout(async () => {
      if (!this.isInDoNotDisturb()) {
        await this.dispatch(title, body, { source: 'single' });
      }

      this.scheduledTimeouts.delete(id);
    }, delayMs);

    this.scheduledTimeouts.set(id, timeoutId);
  }

  startRecurringNotification(id: string, title: string, body: string, intervalMs: number): void {
    this.cancelNotification(id);

    const intervalId = window.setInterval(async () => {
      if (this.isInDoNotDisturb()) {
        return;
      }

      await this.dispatch(title, body, { source: 'recurring' });
    }, intervalMs);

    this.scheduledTimeouts.set(id, intervalId);
  }

  cancelNotification(id: string): void {
    const handle = this.scheduledTimeouts.get(id);
    if (handle === undefined) {
      return;
    }

    window.clearTimeout(handle);
    window.clearInterval(handle);
    this.scheduledTimeouts.delete(id);
  }

  private async dispatch(title: string, body: string, extra?: unknown): Promise<void> {
    const permission = getNotificationPermissionState();
    if (permission !== 'granted') {
      const requested = await ensureNotificationPermission();
      if (requested !== 'granted') {
        return;
      }
    }

    await showNotification(title, body, extra);
  }
}

export const notificationService = new NotificationService();
