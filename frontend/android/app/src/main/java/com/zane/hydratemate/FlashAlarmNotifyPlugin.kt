package com.zane.hydratemate

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ContentResolver
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "FlashAlarmNotify")
class FlashAlarmNotifyPlugin : Plugin() {
    private val mainHandler = Handler(Looper.getMainLooper())
    private val cancelRunnable = Runnable { notificationManager().cancel(NOTIFICATION_ID) }

    override fun load() {
        super.load()
        createOrUpdateChannel()
    }

    @PluginMethod
    fun trigger(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            call.reject("POST_NOTIFICATIONS permission is required")
            return
        }

        createOrUpdateChannel()
        mainHandler.removeCallbacks(cancelRunnable)
        notificationManager().notify(NOTIFICATION_ID, buildNotification())
        mainHandler.postDelayed(cancelRunnable, FLASH_DURATION_MS)
        call.resolve()
    }

    override fun handleOnDestroy() {
        mainHandler.removeCallbacks(cancelRunnable)
        notificationManager().cancel(NOTIFICATION_ID)
        super.handleOnDestroy()
    }

    private fun buildNotification(): Notification {
        val appIcon = context.applicationInfo.icon.takeIf { it != 0 } ?: android.R.drawable.ic_dialog_info
        val silentUri = silentSoundUri()
        return NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(appIcon)
            .setContentTitle("HydrateMate")
            .setContentText("Flash alarm")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(Notification.CATEGORY_ALARM)
            .setOngoing(true)
            .setAutoCancel(false)
            .setOnlyAlertOnce(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setVibrate(VIBRATION_PATTERN)
            .apply {
                if (silentUri != null) {
                    setSound(silentUri)
                } else {
                    setSilent(true)
                }
            }
            .build()
    }

    private fun createOrUpdateChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }

        val audioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()

        val channel = NotificationChannel(
            CHANNEL_ID,
            CHANNEL_NAME,
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "High-priority flash alarm vibration channel"
            enableVibration(true)
            vibrationPattern = VIBRATION_PATTERN
            setSound(silentSoundUri(), audioAttributes)
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        }

        notificationManager().createNotificationChannel(channel)
    }

    private fun notificationManager(): NotificationManager {
        return context.getSystemService(NotificationManager::class.java)
    }

    private fun silentSoundUri(): Uri? {
        val resId = context.resources.getIdentifier("silent", "raw", context.packageName)
        if (resId == 0) {
            return null
        }
        return Uri.parse("${ContentResolver.SCHEME_ANDROID_RESOURCE}://${context.packageName}/$resId")
    }

    companion object {
        private const val CHANNEL_ID = "flash_alarm_channel"
        private const val CHANNEL_NAME = "Flash Alarm Notify"
        private const val NOTIFICATION_ID = 90501
        private const val FLASH_DURATION_MS = 500L
        private val VIBRATION_PATTERN = longArrayOf(0, 1000)
    }
}
