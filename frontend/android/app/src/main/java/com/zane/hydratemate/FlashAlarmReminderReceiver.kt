package com.zane.hydratemate

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class FlashAlarmReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        when (intent?.action) {
            FlashAlarmIntervalScheduler.ACTION_INTERVAL_REMINDER -> {
                if (intent.getBooleanExtra("force", false)) {
                    FlashAlarmEngine.triggerFlashForDebug(context.applicationContext)
                    return
                }
                FlashAlarmIntervalScheduler.onAlarmReceived(context)
            }
            FlashAlarmIntervalScheduler.ACTION_DEBUG_INTERVAL_REMINDER -> {
                FlashAlarmIntervalScheduler.onDebugAlarmReceived(context)
            }
        }
    }
}
