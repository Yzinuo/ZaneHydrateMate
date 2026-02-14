package com.zane.hydratemate

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "FlashAlarmNotify")
class FlashAlarmNotifyPlugin : Plugin() {
    override fun load() {
        super.load()
        FlashAlarmEngine.createOrUpdateChannel(context)
    }

    @PluginMethod
    fun trigger(call: PluginCall) {
        if (!hasPostNotificationPermission()) {
            call.reject("POST_NOTIFICATIONS permission is required")
            return
        }

        FlashAlarmEngine.triggerFlash(context)
        call.resolve(FlashAlarmEngine.buildDebugResult(context))
    }

    @PluginMethod
    fun openChannelSettings(call: PluginCall) {
        try {
            val intent = Intent().apply {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    action = Settings.ACTION_APP_NOTIFICATION_SETTINGS
                    putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                } else {
                    action = "android.settings.APP_NOTIFICATION_SETTINGS"
                    putExtra("app_package", context.packageName)
                    putExtra("app_uid", context.applicationInfo.uid)
                }
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            call.resolve()
        } catch (error: Throwable) {
            try {
                val fallbackIntent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.parse("package:${context.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(fallbackIntent)
                call.resolve()
            } catch (fallbackError: Throwable) {
                call.reject(fallbackError.message ?: "failed to open notification settings")
            }
        }
    }

    @PluginMethod
    fun scheduleIntervalReminder(call: PluginCall) {
        if (!hasPostNotificationPermission()) {
            call.reject("POST_NOTIFICATIONS permission is required")
            return
        }

        val intervalMinutes = call.getInt("intervalMinutes")
        if (intervalMinutes == null) {
            call.reject("intervalMinutes is required")
            return
        }

        val quietHoursEnabled = call.getBoolean("quietHoursEnabled") ?: false
        val quietHoursStart = call.getString("quietHoursStart") ?: "23:00"
        val quietHoursEnd = call.getString("quietHoursEnd") ?: "07:00"

        val nextTriggerAt = FlashAlarmIntervalScheduler.schedule(
            context = context,
            intervalMinutes = intervalMinutes.coerceIn(15, 24 * 60),
            quietHoursEnabled = quietHoursEnabled,
            quietHoursStart = quietHoursStart,
            quietHoursEnd = quietHoursEnd
        )

        val result = JSObject()
        result.put("scheduled", true)
        result.put("nextTriggerAt", nextTriggerAt)
        call.resolve(result)
    }

    @PluginMethod
    fun cancelIntervalReminder(call: PluginCall) {
        FlashAlarmIntervalScheduler.cancel(context)
        call.resolve()
    }

    @PluginMethod
    fun scheduleSceneReminders(call: PluginCall) {
        if (!hasPostNotificationPermission()) {
            call.reject("POST_NOTIFICATIONS permission is required")
            return
        }

        val remindersArray = call.data.optJSONArray("reminders")
        val reminders = FlashAlarmSceneScheduler.parseReminders(remindersArray)
        val nextTriggerAt = FlashAlarmSceneScheduler.schedule(context, reminders)

        val result = JSObject()
        result.put("scheduled", true)
        result.put("nextTriggerAt", nextTriggerAt)
        call.resolve(result)
    }

    @PluginMethod
    fun cancelSceneReminders(call: PluginCall) {
        FlashAlarmSceneScheduler.cancel(context)
        call.resolve()
    }

    @PluginMethod
    fun scheduleOneMinuteTestInterval(call: PluginCall) {
        val nextTriggerAt = FlashAlarmIntervalScheduler.scheduleDebugEveryMinute(context)
        val result = JSObject()
        result.put("scheduled", true)
        result.put("nextTriggerAt", nextTriggerAt)
        call.resolve(result)
    }

    @PluginMethod
    fun cancelOneMinuteTestInterval(call: PluginCall) {
        FlashAlarmIntervalScheduler.cancelDebug(context)
        call.resolve()
    }

    override fun handleOnDestroy() {
        FlashAlarmEngine.clearPendingCancel()
        super.handleOnDestroy()
    }

    private fun hasPostNotificationPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }
}
