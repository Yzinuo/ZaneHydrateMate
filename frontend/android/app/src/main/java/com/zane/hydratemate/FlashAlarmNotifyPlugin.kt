package com.zane.hydratemate

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.provider.Settings
import android.content.ContentResolver
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
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
        triggerPhoneVibrationFallback()
        mainHandler.removeCallbacks(cancelRunnable)
        notificationManager().notify(NOTIFICATION_ID, buildNotification())
        mainHandler.postDelayed(cancelRunnable, FLASH_DURATION_MS)
        call.resolve(buildDebugResult())
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
            // Wear OS bridging docs indicate ongoing notifications may not be bridged.
            // Keep this non-ongoing so paired watches can mirror the alert.
            .setOngoing(false)
            .setAutoCancel(false)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setVibrate(VIBRATION_PATTERN)
            .apply {
                if (silentUri != null) {
                    setSound(silentUri)
                } else {
                    // Avoid setSilent(true): it suppresses vibration on this notification.
                    setSound(null)
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

    private fun triggerPhoneVibrationFallback() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(VibratorManager::class.java)
                val vibrator = vibratorManager?.defaultVibrator
                if (vibrator?.hasVibrator() == true) {
                    vibrator.vibrate(VibrationEffect.createOneShot(FLASH_DURATION_MS, VibrationEffect.DEFAULT_AMPLITUDE))
                }
            } else {
                @Suppress("DEPRECATION")
                val vibrator = context.getSystemService(Vibrator::class.java)
                if (vibrator?.hasVibrator() == true) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        vibrator.vibrate(VibrationEffect.createOneShot(FLASH_DURATION_MS, VibrationEffect.DEFAULT_AMPLITUDE))
                    } else {
                        @Suppress("DEPRECATION")
                        vibrator.vibrate(FLASH_DURATION_MS)
                    }
                }
            }
        } catch (_: Throwable) {
            // Keep notification flow alive even if device vibration fallback fails.
        }
    }

    private fun buildDebugResult(): JSObject {
        val result = JSObject()
        result.put("channelId", CHANNEL_ID)
        result.put("silentSoundFound", silentSoundUri() != null)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = notificationManager().getNotificationChannel(CHANNEL_ID)
            result.put("channelExists", channel != null)
            result.put("channelImportance", channel?.importance ?: -1)
            result.put("channelShouldVibrate", channel?.shouldVibrate() ?: false)
        }

        return result
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
        private const val FLASH_DURATION_MS = 1000L
        private val VIBRATION_PATTERN = longArrayOf(0, 1000)
    }
}
