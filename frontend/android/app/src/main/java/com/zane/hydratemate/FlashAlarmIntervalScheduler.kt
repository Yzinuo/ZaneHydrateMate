package com.zane.hydratemate

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import java.util.Calendar

object FlashAlarmIntervalScheduler {
    const val ACTION_INTERVAL_REMINDER = "com.zane.hydratemate.ACTION_INTERVAL_REMINDER"
    const val ACTION_DEBUG_INTERVAL_REMINDER = "com.zane.hydratemate.ACTION_DEBUG_INTERVAL_REMINDER"

    private const val PREFS_NAME = "flash_alarm_interval_scheduler"
    private const val DEBUG_PREFS_NAME = "flash_alarm_interval_scheduler_debug"
    private const val KEY_ENABLED = "enabled"
    private const val KEY_DEBUG_ENABLED = "enabled"
    private const val KEY_INTERVAL_MINUTES = "interval_minutes"
    private const val KEY_QUIET_ENABLED = "quiet_hours_enabled"
    private const val KEY_QUIET_START = "quiet_hours_start"
    private const val KEY_QUIET_END = "quiet_hours_end"
    private const val DEFAULT_QUIET_START = "23:00"
    private const val DEFAULT_QUIET_END = "07:00"
    private const val REQUEST_CODE = 49051
    private const val DEBUG_REQUEST_CODE = 49052
    private const val MAX_SKIP_ATTEMPTS = 3000

    fun schedule(
        context: Context,
        intervalMinutes: Int,
        quietHoursEnabled: Boolean,
        quietHoursStart: String,
        quietHoursEnd: String
    ): Long {
        val appContext = context.applicationContext
        val normalizedInterval = intervalMinutes.coerceIn(15, 24 * 60)

        appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(KEY_ENABLED, true)
            .putInt(KEY_INTERVAL_MINUTES, normalizedInterval)
            .putBoolean(KEY_QUIET_ENABLED, quietHoursEnabled)
            .putString(KEY_QUIET_START, quietHoursStart)
            .putString(KEY_QUIET_END, quietHoursEnd)
            .apply()

        return scheduleNext(appContext, System.currentTimeMillis())
    }

    fun cancel(context: Context) {
        val appContext = context.applicationContext
        alarmManager(appContext)?.cancel(buildPendingIntent(appContext, ACTION_INTERVAL_REMINDER, REQUEST_CODE))
        appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(KEY_ENABLED, false)
            .apply()
    }

    fun onAlarmReceived(context: Context) {
        val appContext = context.applicationContext
        val config = readConfig(appContext)
        if (!config.enabled) {
            Log.d("FlashAlarmInterval", "Skip interval reminder: scheduler disabled")
            return
        }

        val now = System.currentTimeMillis()
        if (!isInQuietHours(now, config)) {
            FlashAlarmEngine.triggerFlash(appContext)
        } else {
            Log.d("FlashAlarmInterval", "Skip interval reminder: in quiet hours")
        }

        scheduleNext(appContext, now)
    }

    fun scheduleDebugEveryMinute(context: Context): Long {
        val appContext = context.applicationContext
        appContext.getSharedPreferences(DEBUG_PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(KEY_DEBUG_ENABLED, true)
            .apply()

        return scheduleNextDebug(appContext, System.currentTimeMillis())
    }

    fun cancelDebug(context: Context) {
        val appContext = context.applicationContext
        alarmManager(appContext)?.cancel(buildPendingIntent(appContext, ACTION_DEBUG_INTERVAL_REMINDER, DEBUG_REQUEST_CODE))
        appContext.getSharedPreferences(DEBUG_PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(KEY_DEBUG_ENABLED, false)
            .apply()
    }

    fun onDebugAlarmReceived(context: Context) {
        val appContext = context.applicationContext
        val enabled = appContext
            .getSharedPreferences(DEBUG_PREFS_NAME, Context.MODE_PRIVATE)
            .getBoolean(KEY_DEBUG_ENABLED, false)

        if (!enabled) {
            Log.d("FlashAlarmInterval", "Skip debug interval reminder: scheduler disabled")
            return
        }

        FlashAlarmEngine.triggerFlashForDebug(appContext)
        scheduleNextDebug(appContext, System.currentTimeMillis())
    }

    private fun scheduleNext(context: Context, fromMs: Long): Long {
        val config = readConfig(context)
        if (!config.enabled) {
            return -1L
        }

        val intervalMs = config.intervalMinutes * 60_000L
        var triggerAt = fromMs + intervalMs
        var attempts = 0

        while (isInQuietHours(triggerAt, config) && attempts < MAX_SKIP_ATTEMPTS) {
            triggerAt += intervalMs
            attempts += 1
        }

        scheduleAlarm(context, triggerAt, ACTION_INTERVAL_REMINDER, REQUEST_CODE)
        return triggerAt
    }

    private fun scheduleNextDebug(context: Context, fromMs: Long): Long {
        val enabled = context
            .getSharedPreferences(DEBUG_PREFS_NAME, Context.MODE_PRIVATE)
            .getBoolean(KEY_DEBUG_ENABLED, false)
        if (!enabled) {
            return -1L
        }

        val triggerAt = fromMs + 60_000L
        scheduleAlarm(context, triggerAt, ACTION_DEBUG_INTERVAL_REMINDER, DEBUG_REQUEST_CODE)
        return triggerAt
    }

    private fun scheduleAlarm(context: Context, triggerAt: Long, action: String, requestCode: Int) {
        val manager = alarmManager(context) ?: return
        val pendingIntent = buildPendingIntent(context, action, requestCode)

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
            } else {
                manager.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
            }
        } catch (_: SecurityException) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
            } else {
                manager.set(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
            }
        }
    }

    private fun readConfig(context: Context): SchedulerConfig {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return SchedulerConfig(
            enabled = prefs.getBoolean(KEY_ENABLED, false),
            intervalMinutes = prefs.getInt(KEY_INTERVAL_MINUTES, 60).coerceIn(15, 24 * 60),
            quietHoursEnabled = prefs.getBoolean(KEY_QUIET_ENABLED, false),
            quietHoursStart = prefs.getString(KEY_QUIET_START, DEFAULT_QUIET_START) ?: DEFAULT_QUIET_START,
            quietHoursEnd = prefs.getString(KEY_QUIET_END, DEFAULT_QUIET_END) ?: DEFAULT_QUIET_END
        )
    }

    private fun isInQuietHours(targetTimeMs: Long, config: SchedulerConfig): Boolean {
        if (!config.quietHoursEnabled) {
            return false
        }

        val start = toMinutesOfDay(config.quietHoursStart)
        val end = toMinutesOfDay(config.quietHoursEnd)
        val current = toMinutesOfDay(targetTimeMs)

        if (start == end) {
            return true
        }
        if (start < end) {
            return current in start until end
        }
        return current >= start || current < end
    }

    private fun toMinutesOfDay(text: String): Int {
        val parts = text.split(":")
        if (parts.size != 2) {
            return 0
        }

        val hour = parts[0].toIntOrNull()?.coerceIn(0, 23) ?: 0
        val minute = parts[1].toIntOrNull()?.coerceIn(0, 59) ?: 0
        return hour * 60 + minute
    }

    private fun toMinutesOfDay(timestampMs: Long): Int {
        val calendar = Calendar.getInstance()
        calendar.timeInMillis = timestampMs
        val hour = calendar.get(Calendar.HOUR_OF_DAY)
        val minute = calendar.get(Calendar.MINUTE)
        return hour * 60 + minute
    }

    private fun buildPendingIntent(context: Context, action: String, requestCode: Int): PendingIntent {
        val intent = Intent(context, FlashAlarmReminderReceiver::class.java).apply {
            this.action = action
            setPackage(context.packageName)
        }
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        return PendingIntent.getBroadcast(context, requestCode, intent, flags)
    }

    private fun alarmManager(context: Context): AlarmManager? {
        return context.getSystemService(AlarmManager::class.java)
    }

    private data class SchedulerConfig(
        val enabled: Boolean,
        val intervalMinutes: Int,
        val quietHoursEnabled: Boolean,
        val quietHoursStart: String,
        val quietHoursEnd: String
    )
}
