export interface FlashAlarmNotifyResult {
  channelId?: string;
  silentSoundFound?: boolean;
  channelExists?: boolean;
  channelImportance?: number;
  channelShouldVibrate?: boolean;
}

export interface FlashAlarmNotifyPlugin {
  trigger(): Promise<FlashAlarmNotifyResult>;
  openChannelSettings(): Promise<void>;
}
