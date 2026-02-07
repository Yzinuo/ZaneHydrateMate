/**
 * 本地通知服务 - Capacitor Local Notifications
 * 用于接收 WebSocket 提醒后触发系统通知
 */

import { wsClient, ReminderPayload } from './websocket';

// Capacitor Local Notifications 类型定义
interface LocalNotificationSchema {
    title: string;
    body: string;
    id: number;
    schedule?: { at: Date };
    sound?: string;
    attachments?: any[];
    actionTypeId?: string;
    extra?: any;
}

interface LocalNotificationsPlugin {
    schedule(options: { notifications: LocalNotificationSchema[] }): Promise<void>;
    requestPermissions(): Promise<{ display: string }>;
    checkPermissions(): Promise<{ display: string }>;
}

// 动态导入 Capacitor（仅在移动端可用）
let LocalNotifications: LocalNotificationsPlugin | null = null;

async function initCapacitor(): Promise<void> {
    try {
        const capacitor = await import('@capacitor/local-notifications');
        LocalNotifications = capacitor.LocalNotifications as LocalNotificationsPlugin;
    } catch (e) {
        console.log('Capacitor not available (running in browser)');
    }
}

// 通知 ID 计数器
let notificationId = 1;

/**
 * 初始化通知服务
 */
export async function initNotifications(): Promise<boolean> {
    await initCapacitor();

    if (!LocalNotifications) {
        console.log('Local notifications not available');
        return false;
    }

    try {
        const permission = await LocalNotifications.checkPermissions();

        if (permission.display !== 'granted') {
            const result = await LocalNotifications.requestPermissions();
            if (result.display !== 'granted') {
                console.log('Notification permission denied');
                return false;
            }
        }

        console.log('Notification permission granted');
        return true;
    } catch (error) {
        console.error('Failed to init notifications:', error);
        return false;
    }
}

/**
 * 显示本地通知
 */
export async function showNotification(title: string, body: string, extra?: any): Promise<void> {
    if (LocalNotifications) {
        // Capacitor 环境 - 使用系统通知
        await LocalNotifications.schedule({
            notifications: [{
                title,
                body,
                id: notificationId++,
                sound: 'default',
                extra
            }]
        });
    } else {
        // 浏览器环境 - 使用 Web Notification API
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(title, { body, icon: '/img/1阶段.png' });
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    new Notification(title, { body, icon: '/img/1阶段.png' });
                }
            }
        }
    }
}

/**
 * 处理 WebSocket 提醒消息
 */
function handleReminderMessage(payload: ReminderPayload): void {
    showNotification(payload.title, payload.body, {
        current_ml: payload.current_ml,
        goal_ml: payload.goal_ml,
        timestamp: payload.timestamp
    });
}

/**
 * 连接 WebSocket 并监听提醒
 */
export function connectReminderService(token: string, userId: string): void {
    // 连接 WebSocket
    wsClient.connect(token, userId);

    // 监听提醒消息
    wsClient.on('reminder', (message) => {
        handleReminderMessage(message.payload as ReminderPayload);
    });

    // 监听连接成功
    wsClient.on('connected', () => {
        console.log('Reminder service connected');
    });
}

/**
 * 断开提醒服务
 */
export function disconnectReminderService(): void {
    wsClient.disconnect();
}

/**
 * 检查提醒服务是否已连接
 */
export function isReminderServiceConnected(): boolean {
    return wsClient.isConnected;
}
