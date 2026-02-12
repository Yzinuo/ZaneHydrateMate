import React from 'react';
import { ChevronLeft, Moon, Zap } from 'lucide-react';
import type { SettingsResponse, SettingsUpdateRequest } from '../api';
import type { NotificationPermissionState } from '../services/notifications';

interface ReminderSettingsProps {
  settings: SettingsResponse | null;
  saving: boolean;
  errorMessage: string | null;
  wsConnected: boolean;
  notificationPermission: NotificationPermissionState;
  onRequestNotificationPermission: () => Promise<NotificationPermissionState>;
  onSaveSettings: (patch: SettingsUpdateRequest) => Promise<void>;
  onBack: () => void;
}

const DEFAULT_SETTINGS: SettingsResponse = {
  daily_goal_ml: 2000,
  reminder_intensity: 2,
  reminder_enabled: false,
  reminder_interval_minutes: 60,
  quiet_hours_enabled: true,
  quiet_hours_start: '23:00',
  quiet_hours_end: '07:00'
};

const INTERVAL_OPTIONS = [30, 60, 90, 120, 180, 240];

export const ReminderSettings: React.FC<ReminderSettingsProps> = ({
  settings,
  saving,
  errorMessage,
  wsConnected,
  notificationPermission,
  onRequestNotificationPermission,
  onSaveSettings,
  onBack
}) => {
  const effectiveSettings = settings ?? DEFAULT_SETTINGS;

  const toggleInterval = async () => {
    const nextEnabled = !effectiveSettings.reminder_enabled;
    if (nextEnabled) {
      const permission =
        notificationPermission === 'granted'
          ? 'granted'
          : await onRequestNotificationPermission();
      if (permission !== 'granted') {
        return;
      }
    }

    await onSaveSettings({ reminder_enabled: nextEnabled });
  };

  const updateIntervalMinutes = async (minutes: number) => {
    await onSaveSettings({ reminder_interval_minutes: minutes });
  };

  const updateQuietHours = async (patch: SettingsUpdateRequest) => {
    await onSaveSettings(patch);
  };

  return (
    <div className="flex flex-col h-full bg-[#fbffff] text-gray-800 p-6 gap-6 overflow-y-auto scrollbar-hide">
      <header className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">提醒设置</h1>
        <div className="w-10" />
      </header>

      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Zap size={14} /> 间隔提醒
          </h2>
          <div
            onClick={() => {
              void toggleInterval();
            }}
            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
              effectiveSettings.reminder_enabled ? 'bg-[#0dc792]' : 'bg-gray-200'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                effectiveSettings.reminder_enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        <div
          className={`bg-white border transition-all shadow-sm p-4 rounded-2xl ${
            effectiveSettings.reminder_enabled ? 'border-[#0dc792]/30 shadow-[#0dc792]/10' : 'border-gray-100'
          }`}
        >
          <p className="text-xs text-gray-400 mb-3">启用后，系统会按固定间隔发送本地提醒。</p>
          <div className="grid grid-cols-3 gap-3">
            {INTERVAL_OPTIONS.map((minutes) => (
              <button
                key={minutes}
                onClick={() => {
                  void updateIntervalMinutes(minutes);
                }}
                className={`p-3 rounded-xl text-sm font-bold transition-all border ${
                  effectiveSettings.reminder_interval_minutes === minutes
                    ? 'bg-[#e0f7fa] border-[#0dc792] text-[#00838f]'
                    : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
                }`}
              >
                {minutes < 60 ? `${minutes}分钟` : `${minutes / 60}小时`}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Moon size={14} /> 免打扰时段
        </h2>
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-gray-700">启用免打扰</span>
            <div
              onClick={() => {
                void updateQuietHours({ quiet_hours_enabled: !effectiveSettings.quiet_hours_enabled });
              }}
              className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                effectiveSettings.quiet_hours_enabled ? 'bg-[#0dc792]' : 'bg-gray-200'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  effectiveSettings.quiet_hours_enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {effectiveSettings.quiet_hours_enabled && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex-1 bg-gray-50 rounded-xl p-2 flex flex-col items-center">
                <span className="text-xs text-gray-400 mb-1">开始</span>
                <input
                  type="time"
                  value={effectiveSettings.quiet_hours_start}
                  onChange={(event) => {
                    void updateQuietHours({ quiet_hours_start: event.target.value });
                  }}
                  className="bg-transparent font-bold text-gray-800 outline-none text-center w-full"
                />
              </div>
              <span className="text-gray-300">-</span>
              <div className="flex-1 bg-gray-50 rounded-xl p-2 flex flex-col items-center">
                <span className="text-xs text-gray-400 mb-1">结束</span>
                <input
                  type="time"
                  value={effectiveSettings.quiet_hours_end}
                  onChange={(event) => {
                    void updateQuietHours({ quiet_hours_end: event.target.value });
                  }}
                  className="bg-transparent font-bold text-gray-800 outline-none text-center w-full"
                />
              </div>
            </div>
          )}
          <p className="text-[10px] text-gray-400 mt-3 text-center">免打扰时段内不发送饮水提醒。</p>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-4 text-xs text-gray-500">
        <p>通知权限：{notificationPermission}</p>
        <p>提醒服务状态：{wsConnected ? '已连接' : '未连接'}</p>
        {saving && <p>正在保存提醒设置...</p>}
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      </section>
    </div>
  );
};
