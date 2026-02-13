export interface FlashAlarmNotifyResult {
  channelId?: string;
  silentSoundFound?: boolean;
  channelExists?: boolean;
  channelImportance?: number;
  channelShouldVibrate?: boolean;
}

export interface FlashAlarmIntervalOptions {
  intervalMinutes: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface FlashAlarmScheduleResult {
  nextTriggerAt?: number;
  scheduled?: boolean;
}

export interface FlashAlarmNotifyPlugin {
  trigger(): Promise<FlashAlarmNotifyResult>;
  openChannelSettings(): Promise<void>;
  scheduleIntervalReminder(options: FlashAlarmIntervalOptions): Promise<FlashAlarmScheduleResult>;
  cancelIntervalReminder(): Promise<void>;
}
