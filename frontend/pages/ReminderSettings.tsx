import React, { useEffect, useState } from 'react';
import { ChevronLeft, Bell, Zap, Moon, Sun, Dumbbell, Calendar, Trash2 } from 'lucide-react';
import type { SettingsResponse, SettingsUpdateRequest } from '../api';
import { ReminderConfig, DoNotDisturbConfig } from '../types';
import type { NotificationPermissionState } from '../services/notifications';
import { TimePicker } from '../components/ui/time-picker';
import { FlashAlarmNotify } from '../src';

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

const DEFAULT_INTERVAL_MINUTES = 60;
const DEFAULT_DND_START = '23:00';
const DEFAULT_DND_END = '07:00';

export const ReminderSettings: React.FC<ReminderSettingsProps> = ({
  settings,
  onRequestNotificationPermission,
  onSaveSettings,
  onBack,
}) => {
  const [reminders, setReminders] = useState<ReminderConfig[]>([
    { id: '1', type: 'scene', label: '晨间饮水', time: '07:30', enabled: true },
    { id: '2', type: 'scene', label: '睡前补水', time: '22:00', enabled: false },
  ]);

  const [dndConfig, setDndConfig] = useState<DoNotDisturbConfig>({
    enabled: true,
    start: DEFAULT_DND_START,
    end: DEFAULT_DND_END,
  });

  const [intervalConfig, setIntervalConfig] = useState({
    enabled: false,
    minutes: DEFAULT_INTERVAL_MINUTES,
  });

  const [flashTestRunning, setFlashTestRunning] = useState(false);
  const [flashTestMessage, setFlashTestMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) {
      return;
    }

    setIntervalConfig({
      enabled: settings.reminder_enabled,
      minutes: settings.reminder_interval_minutes,
    });

    setDndConfig({
      enabled: settings.quiet_hours_enabled,
      start: settings.quiet_hours_start || DEFAULT_DND_START,
      end: settings.quiet_hours_end || DEFAULT_DND_END,
    });
  }, [settings]);

  const toggleInterval = async () => {
    const nextEnabled = !intervalConfig.enabled;
    if (nextEnabled) {
      const permission = await onRequestNotificationPermission();
      if (permission !== 'granted') {
        setIntervalConfig((prev) => ({ ...prev, enabled: false }));
        return;
      }
    }

    setIntervalConfig((prev) => ({ ...prev, enabled: nextEnabled }));
    await onSaveSettings({ reminder_enabled: nextEnabled });
  };

  const updateIntervalMinutes = async (minutes: number) => {
    setIntervalConfig((prev) => ({ ...prev, minutes }));
    await onSaveSettings({ reminder_interval_minutes: minutes });
  };

  const toggleReminder = (id: string) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const deleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const addSceneReminder = (label: string, time: string) => {
    const newReminder: ReminderConfig = {
      id: Date.now().toString(),
      type: 'scene',
      label,
      time,
      enabled: true,
    };

    setReminders((prev) => [...prev, newReminder]);
  };

  const updateDnd = async (key: keyof DoNotDisturbConfig, value: string | boolean) => {
    const nextConfig = { ...dndConfig, [key]: value } as DoNotDisturbConfig;
    setDndConfig(nextConfig);

    const patch: SettingsUpdateRequest = {};
    if (key === 'enabled') {
      patch.quiet_hours_enabled = Boolean(value);
    } else if (key === 'start') {
      patch.quiet_hours_start = String(value);
    } else if (key === 'end') {
      patch.quiet_hours_end = String(value);
    }

    await onSaveSettings(patch);
  };

  const triggerFlashAlarmTest = async () => {
    setFlashTestRunning(true);
    setFlashTestMessage(null);

    try {
      const permission = await onRequestNotificationPermission();
      if (permission !== 'granted') {
        // 部分厂商 ROM 会返回非 granted 状态，但系统设置里实际已授权。
        // 继续调用原生插件，由原生层做最终权限判断。
        setFlashTestMessage('通知权限状态异常，继续尝试触发原生震动...');
      }

      const result = await FlashAlarmNotify.trigger();
      if (result.channelShouldVibrate === false) {
        setFlashTestMessage('已触发通知，但系统显示“震动关闭”。请点下方按钮进入应用通知管理页开启震动。');
      } else {
        setFlashTestMessage('已触发 1s 测试震动，请观察手机和手表。');
      }
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : 'unknown error';
      setFlashTestMessage(`触发失败: ${message}`);
    } finally {
      setFlashTestRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#fbffff] text-gray-800 p-6 gap-6 overflow-y-auto scrollbar-hide">
      <header className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">智能提醒</h1>
        <div className="w-10"></div>
      </header>

      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Zap size={14} /> 默认提醒间隔
          </h2>
          <div
            onClick={() => {
              void toggleInterval();
            }}
            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
              intervalConfig.enabled ? 'bg-[#0dc792]' : 'bg-gray-200'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                intervalConfig.enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            ></div>
          </div>
        </div>

        <div
          className={`bg-white border transition-all shadow-sm p-4 rounded-2xl ${
            intervalConfig.enabled ? 'border-[#0dc792]/30 shadow-[#0dc792]/10' : 'border-gray-100'
          }`}
        >
          <p className="text-xs text-gray-400 mb-3">开启后，应用将按照设定的时间间隔持续发送提醒。</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { min: 30, label: '30分钟' },
              { min: 60, label: '1小时' },
              { min: 90, label: '1.5小时' },
              { min: 120, label: '2小时' },
              { min: 180, label: '3小时' },
              { min: 240, label: '4小时' },
            ].map((opt) => (
              <button
                key={opt.min}
                onClick={() => {
                  void updateIntervalMinutes(opt.min);
                }}
                className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all border ${
                  intervalConfig.minutes === opt.min
                    ? 'bg-[#e0f7fa] border-[#0dc792] text-[#00838f]'
                    : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span className="text-sm font-bold">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Calendar size={14} /> 场景提醒
          </h2>
          <button onClick={() => addSceneReminder('新提醒', '09:00')} className="text-xs text-[#0dc792] font-bold">
            + 添加
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
          {reminders
            .filter((r) => r.type === 'scene')
            .map((r, index) => (
              <div key={r.id} className={`p-4 flex items-center justify-between ${index !== 0 ? 'border-t border-gray-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      r.enabled ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-400'
                    }`}
                  >
                    {r.label.includes('晨') ? <Sun size={18} /> : r.label.includes('睡') ? <Moon size={18} /> : <Bell size={18} />}
                  </div>
                  <div>
                    <input
                      value={r.label}
                      onChange={(e) =>
                        setReminders((prev) => prev.map((item) => (item.id === r.id ? { ...item, label: e.target.value } : item)))
                      }
                      className="font-bold text-gray-800 bg-transparent outline-none w-24"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      <TimePicker
                        value={r.time || '09:00'}
                        onChange={(val) =>
                          setReminders((prev) => prev.map((item) => (item.id === r.id ? { ...item, time: val } : item)))
                        }
                        className="h-8 border-none p-0 text-xs text-gray-400 font-normal w-auto shadow-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => deleteReminder(r.id)} className="text-red-300 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                  <div
                    onClick={() => toggleReminder(r.id)}
                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${r.enabled ? 'bg-[#0dc792]' : 'bg-gray-200'}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                        r.enabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
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
                void updateDnd('enabled', !dndConfig.enabled);
              }}
              className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${dndConfig.enabled ? 'bg-[#0dc792]' : 'bg-gray-200'}`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  dndConfig.enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              ></div>
            </div>
          </div>

          {dndConfig.enabled && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex-1 bg-gray-50 rounded-xl p-2 flex flex-col items-center">
                <span className="text-xs text-gray-400 mb-1">开始</span>
                <TimePicker
                  value={dndConfig.start}
                  onChange={(val) => {
                    void updateDnd('start', val);
                  }}
                  className="font-bold text-gray-800 border-none p-0 h-auto w-full shadow-none justify-center"
                />
              </div>
              <span className="text-gray-300">-</span>
              <div className="flex-1 bg-gray-50 rounded-xl p-2 flex flex-col items-center">
                <span className="text-xs text-gray-400 mb-1">结束</span>
                <TimePicker
                  value={dndConfig.end}
                  onChange={(val) => {
                    void updateDnd('end', val);
                  }}
                  className="font-bold text-gray-800 border-none p-0 h-auto w-full shadow-none justify-center"
                />
              </div>
            </div>
          )}
          <p className="text-[10px] text-gray-400 mt-3 text-center">在此时间段内，将不会收到饮水提醒通知</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Dumbbell size={14} /> 临时测试
        </h2>
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 p-5 space-y-3">
          <button
            onClick={() => {
              void triggerFlashAlarmTest();
            }}
            disabled={flashTestRunning}
            className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
              flashTestRunning ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[#0dc792] text-white hover:bg-[#0bb682]'
            }`}
          >
            {flashTestRunning ? '触发中...' : '测试手表联动震动（1s）'}
          </button>
          <button
            onClick={() => {
              void FlashAlarmNotify.openChannelSettings();
            }}
            className="w-full rounded-xl px-4 py-3 text-sm font-bold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            打开应用通知管理
          </button>
          {flashTestMessage && <p className="text-xs text-gray-500">{flashTestMessage}</p>}
        </div>
      </section>

      <div className="h-6"></div>
    </div>
  );
};
