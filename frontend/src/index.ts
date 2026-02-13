import { registerPlugin } from '@capacitor/core';
import type { FlashAlarmNotifyPlugin } from './definitions';

export const FlashAlarmNotify = registerPlugin<FlashAlarmNotifyPlugin>('FlashAlarmNotify');

export type { FlashAlarmNotifyPlugin } from './definitions';
