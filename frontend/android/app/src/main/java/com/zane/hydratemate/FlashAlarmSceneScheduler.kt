package com.zane.hydratemate

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

object FlashAlarmSceneScheduler {
    const val ACTION_SCENE_REMINDER = "com.zane.hydratemate.ACTION_SCENE_REMINDER"
    private const val PREFS_NAME = "flash_alarm_scene_scheduler"
    private const val KEY_REMINDERS_JSON = "reminders_json"
    private const val EXTRA_REMINDER_ID = "reminderId"
    private const val REQUEST_CODE_BASE = 56000
    private const val REQUEST_CODE_MOD = 900000
    private const val DEFAULT_LABEL = "Scene Reminder"

    data class SceneReminder(
        val id: String,
        val label: String,
        val time: String,
        val enabled: Boolean
    )

    fun parseReminders(rawArray: JSONArray?): List<SceneReminder> {
        if (rawArray == null) {
            return emptyList()
        }

        val parsed = mutableListOf<SceneReminder>()
        for (index in 0 until rawArray.length()) {
            val item = rawArray.optJSONObject(index) ?: continue
            val id = item.optString("id").trim()
            if (id.isEmpty()) {
                continue
            }
            val label = item.optString("label", DEFAULT_LABEL).ifBlank { DEFAULT_LABEL }
            val time = item.optString("time", "09:00")
            val enabled = item.optBoolean("enabled", true)
            parsed += SceneReminder(id = id, label = label, time = time, enabled = enabled)
        }

        return normalize(parsed)
    }

    fun schedule(context: Context, reminders: List<SceneReminder>): Long {
        val appContext = context.applicationContext
        val normalized = normalize(reminders)
        cancelPendingForReminders(appContext, readReminders(appContext))
        writeReminders(appContext, normalized)
        return scheduleAll(appContext, normalized)
    }

    fun cancel(context: Context) {
        val appContext = context.applicationContext
        cancelPendingForReminders(appContext, readReminders(appContext))
        appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_REMINDERS_JSON, "[]")
            .apply()
    }

    fun onAlarmReceived(context: Context, intent: Intent?) {
        val appContext = context.applicationContext
        val reminderId = intent?.getStringExtra(EXTRA_REMINDER_ID)
        if (reminderId.isNullOrBlank()) {
            Log.d("FlashAlarmScene", "Skip scene reminder: missing reminderId")
            return
        }

        val reminders = readReminders(appContext)
        val reminder = reminders.firstOrNull { it.id == reminderId }
        if (reminder == null || !reminder.enabled) {
            Log.d("FlashAlarmScene", "Skip scene reminder: reminder disabled or missing")
            return
        }

        // Scene reminders always force flash alarm behavior, regardless of quiet hours.
        FlashAlarmEngine.triggerFlash(appContext)
        scheduleReminderNext(appContext, reminder, System.currentTimeMillis() + 1000L)
    }

    private fun scheduleAll(context: Context, reminders: List<SceneReminder>): Long {
        var nextTriggerAt = -1L
        reminders.forEach { reminder ->
            if (!reminder.enabled) {
                return@forEach
            }
            val triggerAt = scheduleReminderNext(context, reminder, System.currentTimeMillis())
            if (triggerAt > 0 && (nextTriggerAt <= 0 || triggerAt < nextTriggerAt)) {
                nextTriggerAt = triggerAt
            }
        }
        return nextTriggerAt
    }

    private fun scheduleReminderNext(context: Context, reminder: SceneReminder, fromMs: Long): Long {
        val (hour, minute) = parseTime(reminder.time) ?: return -1L

        val target = Calendar.getInstance().apply {
            timeInMillis = fromMs
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            if (timeInMillis <= fromMs) {
                add(Calendar.DAY_OF_YEAR, 1)
            }
        }

        val triggerAt = target.timeInMillis
        scheduleAlarm(context, reminder.id, triggerAt)
        return triggerAt
    }

    private fun scheduleAlarm(context: Context, reminderId: String, triggerAt: Long) {
        val manager = alarmManager(context) ?: return
        val pendingIntent = buildPendingIntent(context, reminderId)

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

    private fun cancelPendingForReminders(context: Context, reminders: List<SceneReminder>) {
        val manager = alarmManager(context) ?: return
        reminders.forEach { reminder ->
            manager.cancel(buildPendingIntent(context, reminder.id))
        }
    }

    private fun readReminders(context: Context): List<SceneReminder> {
        val raw = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString(KEY_REMINDERS_JSON, "[]")
            ?: "[]"

        return try {
            parseReminders(JSONArray(raw))
        } catch (_: Throwable) {
            emptyList()
        }
    }

    private fun writeReminders(context: Context, reminders: List<SceneReminder>) {
        val array = JSONArray()
        reminders.forEach { reminder ->
            val item = JSONObject()
            item.put("id", reminder.id)
            item.put("label", reminder.label)
            item.put("time", reminder.time)
            item.put("enabled", reminder.enabled)
            array.put(item)
        }

        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_REMINDERS_JSON, array.toString())
            .apply()
    }

    private fun parseTime(text: String): Pair<Int, Int>? {
        val parts = text.split(":")
        if (parts.size != 2) {
            return null
        }

        val hour = parts[0].toIntOrNull()
        val minute = parts[1].toIntOrNull()
        if (hour == null || minute == null || hour !in 0..23 || minute !in 0..59) {
            return null
        }
        return hour to minute
    }

    private fun normalize(reminders: List<SceneReminder>): List<SceneReminder> {
        val deduped = LinkedHashMap<String, SceneReminder>()
        reminders.forEach { item ->
            if (item.id.isBlank()) {
                return@forEach
            }
            val normalizedLabel = item.label.ifBlank { DEFAULT_LABEL }
            val normalizedTime = if (parseTime(item.time) != null) item.time else "09:00"
            deduped[item.id] = SceneReminder(
                id = item.id,
                label = normalizedLabel,
                time = normalizedTime,
                enabled = item.enabled
            )
        }
        return deduped.values.toList()
    }

    private fun buildPendingIntent(context: Context, reminderId: String): PendingIntent {
        val intent = Intent(context, FlashAlarmReminderReceiver::class.java).apply {
            action = ACTION_SCENE_REMINDER
            putExtra(EXTRA_REMINDER_ID, reminderId)
            setPackage(context.packageName)
        }
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        return PendingIntent.getBroadcast(context, requestCodeFor(reminderId), intent, flags)
    }

    private fun requestCodeFor(reminderId: String): Int {
        val stableHash = reminderId.hashCode().toLong().and(0x7fffffff)
        return REQUEST_CODE_BASE + (stableHash % REQUEST_CODE_MOD).toInt()
    }

    private fun alarmManager(context: Context): AlarmManager? {
        return context.getSystemService(AlarmManager::class.java)
    }
}
