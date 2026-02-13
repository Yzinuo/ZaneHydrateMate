package com.zane.hydratemate

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ContentResolver
import android.content.Context
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

object FlashAlarmEngine {
    const val CHANNEL_ID = "flash_alarm_channel"
    private const val CHANNEL_NAME = "Flash Alarm Notify"
    private const val NOTIFICATION_ID = 90501
    private const val FLASH_DURATION_MS = 1000L
    private val VIBRATION_PATTERN = longArrayOf(0, 1000)
    private val mainHandler = Handler(Looper.getMainLooper())
    private var cancelRunnable: Runnable? = null

    fun triggerFlash(context: Context) {
        val appContext = context.applicationContext
        if (!hasPostNotificationPermission(appContext)) {
            return
        }

        createOrUpdateChannel(appContext)
        triggerPhoneVibrationFallback(appContext)

        val manager = notificationManager(appContext)
        clearPendingCancel()
        manager.notify(NOTIFICATION_ID, buildNotification(appContext))
        val runnable = Runnable { manager.cancel(NOTIFICATION_ID) }
        cancelRunnable = runnable
        mainHandler.postDelayed(runnable, FLASH_DURATION_MS)
    }

    fun clearPendingCancel() {
        cancelRunnable?.let(mainHandler::removeCallbacks)
        cancelRunnable = null
    }

    fun buildDebugResult(context: Context): JSObject {
        val result = JSObject()
        result.put("channelId", CHANNEL_ID)
        result.put("silentSoundFound", silentSoundUri(context) != null)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = notificationManager(context).getNotificationChannel(CHANNEL_ID)
            result.put("channelExists", channel != null)
            result.put("channelImportance", channel?.importance ?: -1)
            result.put("channelShouldVibrate", channel?.shouldVibrate() ?: false)
        }

        return result
    }

    fun createOrUpdateChannel(context: Context) {
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
            setSound(silentSoundUri(context), audioAttributes)
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        }

        notificationManager(context).createNotificationChannel(channel)
    }

    private fun buildNotification(context: Context): Notification {
        val appIcon = context.applicationInfo.icon.takeIf { it != 0 } ?: android.R.drawable.ic_dialog_info
        val silentUri = silentSoundUri(context)

        return NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(appIcon)
            .setContentTitle("HydrateMate")
            .setContentText("Hydration reminder")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(Notification.CATEGORY_ALARM)
            .setOngoing(false)
            .setAutoCancel(false)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setVibrate(VIBRATION_PATTERN)
            .apply {
                if (silentUri != null) {
                    setSound(silentUri)
                } else {
                    setSound(null)
                }
            }
            .build()
    }

    private fun notificationManager(context: Context): NotificationManager {
        return context.getSystemService(NotificationManager::class.java)
    }

    private fun silentSoundUri(context: Context): Uri? {
        val resId = context.resources.getIdentifier("silent", "raw", context.packageName)
        if (resId == 0) {
            return null
        }
        return Uri.parse("${ContentResolver.SCHEME_ANDROID_RESOURCE}://${context.packageName}/$resId")
    }

    private fun hasPostNotificationPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }

    private fun triggerPhoneVibrationFallback(context: Context) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(VibratorManager::class.java)
                val vibrator = vibratorManager?.defaultVibrator
                if (vibrator?.hasVibrator() == true) {
                    vibrator.vibrate(VibrationEffect.createOneShot(FLASH_DURATION_MS, VibrationEffect.DEFAULT_AMPLITUDE))
                }
                return
            }

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
        } catch (_: Throwable) {
            // Keep notification flow alive even if vibration fallback fails.
        }
    }
}
