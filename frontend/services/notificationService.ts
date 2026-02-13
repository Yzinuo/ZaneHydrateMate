import type { SettingsResponse } from '../api';
import { Capacitor } from '@capacitor/core';
import { FlashAlarmNotify } from '../src';
import {
  cancelNotifications,
  ensureNotificationPermission,
  getNotificationPermissionState,
  scheduleNotifications,
  SYSTEM_REMINDER_CHANNEL_ID
} from './notifications';

const REMINDER_TITLE = '定时饮水提醒';
const REMINDER_BODY = '该喝水啦，记得补充一点水分。';
const MINUTES_PER_DAY = 24 * 60;
const REMINDER_ID_BASE = 600000;

const toMinutesOfDay = (value: string): number => {
  const [hourText, minuteText] = value.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return 0;
  }

  return Math.max(0, Math.min(23, Math.floor(hour))) * 60 + Math.max(0, Math.min(59, Math.floor(minute)));
};

const createReminderIds = (): number[] => {
  const ids: number[] = [];
  for (let minute = 0; minute < MINUTES_PER_DAY; minute += 1) {
    ids.push(REMINDER_ID_BASE + minute);
  }
  return ids;
};

const normalizeIntervalMinutes = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 60;
  }

  const rounded = Math.round(value);
  if (rounded < 15) {
    return 15;
  }
  if (rounded > MINUTES_PER_DAY) {
    return MINUTES_PER_DAY;
  }
  return rounded;
};

const gcd = (a: number, b: number): number => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x === 0 ? 1 : x;
};

class NotificationService {
  async requestPermission(): Promise<boolean> {
    const result = await ensureNotificationPermission();
    return result === 'granted';
  }

  async syncIntervalReminder(settings: SettingsResponse): Promise<void> {
    await cancelNotifications(createReminderIds());

    const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

    if (isNativeAndroid) {
      if (!settings.reminder_enabled) {
        await FlashAlarmNotify.cancelIntervalReminder();
        return;
      }

      const permission = getNotificationPermissionState();
      if (permission !== 'granted') {
        await ensureNotificationPermission();
      }

      const intervalMinutes = normalizeIntervalMinutes(settings.reminder_interval_minutes);
      try {
        await FlashAlarmNotify.scheduleIntervalReminder({
          intervalMinutes,
          quietHoursEnabled: settings.quiet_hours_enabled,
          quietHoursStart: settings.quiet_hours_start || '23:00',
          quietHoursEnd: settings.quiet_hours_end || '07:00'
        });
      } catch {
        await FlashAlarmNotify.cancelIntervalReminder();
      }
      return;
    }

    if (!settings.reminder_enabled) {
      return;
    }

    const permission = getNotificationPermissionState();
    if (permission !== 'granted') {
      const requested = await ensureNotificationPermission();
      if (requested !== 'granted') {
        return;
      }
    }

    const intervalMinutes = normalizeIntervalMinutes(settings.reminder_interval_minutes);
    const reminderMinutes = this.buildReminderMinutes(intervalMinutes, settings);
    if (reminderMinutes.length === 0) {
      return;
    }

    await scheduleNotifications(
      reminderMinutes.map((minuteOfDay) => ({
        id: REMINDER_ID_BASE + minuteOfDay,
        title: REMINDER_TITLE,
        body: REMINDER_BODY,
        channelId: SYSTEM_REMINDER_CHANNEL_ID,
        schedule: {
          on: {
            hour: Math.floor(minuteOfDay / 60),
            minute: minuteOfDay % 60,
            second: 0
          },
          allowWhileIdle: true
        }
      }))
    );
  }

  private buildReminderMinutes(intervalMinutes: number, settings: SettingsResponse): number[] {
    const minutes: number[] = [];
    const slotsPerDay = Math.max(1, MINUTES_PER_DAY / gcd(MINUTES_PER_DAY, intervalMinutes));

    for (let slot = 0; slot < slotsPerDay; slot += 1) {
      const minuteOfDay = (slot * intervalMinutes) % MINUTES_PER_DAY;
      if (!this.isInQuietHours(minuteOfDay, settings)) {
        minutes.push(minuteOfDay);
      }
    }

    return minutes.sort((a, b) => a - b);
  }

  private isInQuietHours(minuteOfDay: number, settings: SettingsResponse): boolean {
    if (!settings.quiet_hours_enabled) {
      return false;
    }

    const start = toMinutesOfDay(settings.quiet_hours_start);
    const end = toMinutesOfDay(settings.quiet_hours_end);

    if (start === end) {
      return true;
    }
    if (start < end) {
      return minuteOfDay >= start && minuteOfDay < end;
    }
    return minuteOfDay >= start || minuteOfDay < end;
  }
}

export const notificationService = new NotificationService();
