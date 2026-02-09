
import { DoNotDisturbConfig } from '../types';

class NotificationService {
    private dndConfig: DoNotDisturbConfig = {
        enabled: false,
        start: '23:00',
        end: '07:00'
    };
    
    // Simple simulated scheduler
    private scheduledTimeouts: Map<string, number> = new Map();

    constructor() {
        this.requestPermission();
    }

    async requestPermission() {
        if (!('Notification' in window)) {
            console.log('This browser does not support desktop notification');
            return;
        }
        
        if (Notification.permission !== 'denied') {
            await Notification.requestPermission();
        }
    }

    setDoNotDisturb(config: DoNotDisturbConfig) {
        this.dndConfig = config;
    }

    isInDoNotDisturb(date: Date = new Date()): boolean {
        if (!this.dndConfig.enabled) return false;

        const nowMinutes = date.getHours() * 60 + date.getMinutes();
        
        const [startH, startM] = this.dndConfig.start.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        
        const [endH, endM] = this.dndConfig.end.split(':').map(Number);
        const endMinutes = endH * 60 + endM;

        if (startMinutes > endMinutes) {
            // Span midnight (e.g. 23:00 - 07:00)
            return nowMinutes >= startMinutes || nowMinutes <= endMinutes;
        } else {
            // Same day (e.g. 13:00 - 14:00)
            return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
        }
    }

    scheduleNotification(id: string, title: string, body: string, delayMs: number) {
        // Clear existing if any
        if (this.scheduledTimeouts.has(id)) {
            window.clearTimeout(this.scheduledTimeouts.get(id));
        }

        const timeoutId = window.setTimeout(() => {
            if (this.isInDoNotDisturb()) {
                console.log('Notification suppressed due to DND');
                return;
            }

            if (Notification.permission === 'granted') {
                new Notification(title, { body, icon: '/vite.svg' });
            } else {
                console.log(`${title}: ${body}`); // alert is too intrusive for intervals, use log or proper notification
            }
            
            this.scheduledTimeouts.delete(id);
        }, delayMs);

        this.scheduledTimeouts.set(id, timeoutId);
    }

    startRecurringNotification(id: string, title: string, body: string, intervalMs: number) {
        this.cancelNotification(id); // Clear existing

        const intervalId = window.setInterval(() => {
             if (this.isInDoNotDisturb()) {
                console.log('Recurring notification suppressed due to DND');
                return;
            }

            if (Notification.permission === 'granted') {
                new Notification(title, { body, icon: '/vite.svg' });
            } else {
                 console.log(`[Recurring] ${title}: ${body}`);
            }
        }, intervalMs);

        this.scheduledTimeouts.set(id, intervalId);
    }

    cancelNotification(id: string) {
        if (this.scheduledTimeouts.has(id)) {
            // Check if it's interval or timeout (clearInterval works for both in many envs, but let's be safe if strictly typed, though JS treats ids similarly)
            // In browser, clearTimeout and clearInterval are technically interchangeable for IDs but good practice to distinct if possible.
            // Here we store both in same map.
            window.clearTimeout(this.scheduledTimeouts.get(id)); 
            window.clearInterval(this.scheduledTimeouts.get(id));
            this.scheduledTimeouts.delete(id);
        }
    }
}

export const notificationService = new NotificationService();
