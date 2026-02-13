package com.zane.hydratemate

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class FlashAlarmReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != FlashAlarmIntervalScheduler.ACTION_INTERVAL_REMINDER) {
            return
        }
        FlashAlarmIntervalScheduler.onAlarmReceived(context)
    }
}
