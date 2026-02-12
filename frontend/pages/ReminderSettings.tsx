
import React, { useState } from 'react';
import { ChevronLeft, Bell, Clock, Zap, Moon, Sun, Dumbbell, Calendar, Trash2 } from 'lucide-react';
import { ReminderConfig, DoNotDisturbConfig } from '../types';
import { notificationService } from '../services/notificationService';

interface ReminderSettingsProps {
    onBack: () => void;
}

export const ReminderSettings: React.FC<ReminderSettingsProps> = ({ onBack }) => {
    const [reminders, setReminders] = useState<ReminderConfig[]>([
        { id: '1', type: 'scene', label: '晨间饮水', time: '07:30', enabled: true },
        { id: '2', type: 'scene', label: '睡前补水', time: '22:00', enabled: false },
    ]);

    const [dndConfig, setDndConfig] = useState<DoNotDisturbConfig>({
        enabled: true,
        start: '23:00',
        end: '07:00'
    });

    // --- Interval Reminder State ---
    const [intervalConfig, setIntervalConfig] = useState({
        enabled: false,
        minutes: 60
    });

    const toggleInterval = async () => {
        const newState = !intervalConfig.enabled;
        if (newState) {
            const granted = await notificationService.requestPermission();
            if (!granted) {
                setIntervalConfig(prev => ({ ...prev, enabled: false }));
                notificationService.cancelNotification('default-interval');
                return;
            }
        }

        setIntervalConfig(prev => ({ ...prev, enabled: newState }));

        if (newState) {
            notificationService.startRecurringNotification(
                'default-interval', 
                '定时饮水提醒', 
                `已经${intervalConfig.minutes < 60 ? intervalConfig.minutes + '分钟' : (intervalConfig.minutes/60).toFixed(1) + '小时'}没喝水了，补充点水分吧！💧`, 
                intervalConfig.minutes * 60 * 1000
            );
        } else {
            notificationService.cancelNotification('default-interval');
        }
    };

    const updateIntervalMinutes = (minutes: number) => {
        setIntervalConfig(prev => ({ ...prev, minutes }));
        // If already enabled, restart with new time
        if (intervalConfig.enabled) {
             notificationService.startRecurringNotification(
                'default-interval', 
                '定时饮水提醒', 
                `已经${minutes < 60 ? minutes + '分钟' : (minutes/60).toFixed(1) + '小时'}没喝水了，补充点水分吧！💧`, 
                minutes * 60 * 1000
            );
        }
    };

    // --- Scene / Recurring Management ---
    const toggleReminder = (id: string) => {
        setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    };

    const deleteReminder = (id: string) => {
        setReminders(prev => prev.filter(r => r.id !== id));
    };

    const addSceneReminder = (label: string, time: string) => {
        const newReminder: ReminderConfig = {
            id: Date.now().toString(),
            type: 'scene',
            label,
            time,
            enabled: true
        };
        setReminders([...reminders, newReminder]);
    };

    // --- DND Management ---
    const updateDnd = (key: keyof DoNotDisturbConfig, value: any) => {
        const newConfig = { ...dndConfig, [key]: value };
        setDndConfig(newConfig);
        notificationService.setDoNotDisturb(newConfig);
    };

    return (
        <div className="flex flex-col h-full bg-[#fbffff] text-gray-800 p-6 gap-6 overflow-y-auto scrollbar-hide">
             {/* Header */}
             <header className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-gray-800">智能提醒</h1>
                <div className="w-10"></div>
            </header>

            {/* Default Interval Reminder Section */}
            <section className="space-y-3">
                <div className="flex justify-between items-center">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Zap size={14} /> 默认提醒间隔
                    </h2>
                    <div 
                        onClick={toggleInterval}
                        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${intervalConfig.enabled ? 'bg-[#0dc792]' : 'bg-gray-200'}`}
                    >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${intervalConfig.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                </div>
                
                <div className={`bg-white border transition-all shadow-sm p-4 rounded-2xl ${intervalConfig.enabled ? 'border-[#0dc792]/30 shadow-[#0dc792]/10' : 'border-gray-100'}`}>
                    <p className="text-xs text-gray-400 mb-3">开启后，应用将按照设定的时间间隔持续发送提醒。</p>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { min: 30, label: '30分钟' },
                            { min: 60, label: '1小时' },
                            { min: 90, label: '1.5小时' },
                            { min: 120, label: '2小时' },
                            { min: 180, label: '3小时' },
                            { min: 240, label: '4小时' },
                        ].map(opt => (
                            <button
                                key={opt.min}
                                onClick={() => updateIntervalMinutes(opt.min)}
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

             {/* Scene Reminders */}
             <section className="space-y-3">
                <div className="flex justify-between items-center">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={14} /> 场景提醒
                    </h2>
                    <button 
                        onClick={() => addSceneReminder('新提醒', '09:00')}
                        className="text-xs text-[#0dc792] font-bold"
                    >
                        + 添加
                    </button>
                </div>
                
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                    {reminders.filter(r => r.type === 'scene').map((r, index) => (
                        <div key={r.id} className={`p-4 flex items-center justify-between ${index !== 0 ? 'border-t border-gray-50' : ''}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${r.enabled ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-400'}`}>
                                    {r.label.includes('晨') ? <Sun size={18} /> : 
                                     r.label.includes('睡') ? <Moon size={18} /> : 
                                     <Bell size={18} />}
                                </div>
                                <div>
                                    <input 
                                        value={r.label}
                                        onChange={(e) => setReminders(prev => prev.map(item => item.id === r.id ? {...item, label: e.target.value} : item))}
                                        className="font-bold text-gray-800 bg-transparent outline-none w-24"
                                    />
                                    <div className="text-xs text-gray-400">
                                        <input 
                                            type="time" 
                                            value={r.time} 
                                            onChange={(e) => setReminders(prev => prev.map(item => item.id === r.id ? {...item, time: e.target.value} : item))}
                                            className="bg-transparent outline-none"
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
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${r.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Do Not Disturb */}
            <section className="space-y-3">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Moon size={14} /> 免打扰时段
                </h2>
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 p-5">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-gray-700">启用免打扰</span>
                        <div 
                            onClick={() => updateDnd('enabled', !dndConfig.enabled)}
                            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${dndConfig.enabled ? 'bg-[#0dc792]' : 'bg-gray-200'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${dndConfig.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                    </div>
                    
                    {dndConfig.enabled && (
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex-1 bg-gray-50 rounded-xl p-2 flex flex-col items-center">
                                <span className="text-xs text-gray-400 mb-1">开始</span>
                                <input 
                                    type="time" 
                                    value={dndConfig.start}
                                    onChange={(e) => updateDnd('start', e.target.value)}
                                    className="bg-transparent font-bold text-gray-800 outline-none text-center w-full" 
                                />
                            </div>
                            <span className="text-gray-300">-</span>
                            <div className="flex-1 bg-gray-50 rounded-xl p-2 flex flex-col items-center">
                                <span className="text-xs text-gray-400 mb-1">结束</span>
                                <input 
                                    type="time" 
                                    value={dndConfig.end}
                                    onChange={(e) => updateDnd('end', e.target.value)}
                                    className="bg-transparent font-bold text-gray-800 outline-none text-center w-full" 
                                />
                            </div>
                        </div>
                    )}
                    <p className="text-[10px] text-gray-400 mt-3 text-center">
                        在此时间段内，将不会收到饮水提醒通知
                    </p>
                </div>
            </section>

             <div className="h-6"></div>
        </div>
    );
};
