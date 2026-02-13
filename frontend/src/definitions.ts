export interface FlashAlarmNotifyPlugin {
  trigger(): Promise<void>;
}
