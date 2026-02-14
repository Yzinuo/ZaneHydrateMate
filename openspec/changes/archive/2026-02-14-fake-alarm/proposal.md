## Why

Hydration reminders currently rely on standard local notifications, which may not produce reliable strong haptics on paired Bluetooth smartwatches. We need an Android-native alarm-style notification path that can trigger an immediate, short, high-priority vibration on both phone and watch.

## What Changes

- Add a custom Capacitor Android plugin `FlashAlarmNotify` with a no-arg `trigger()` API.
- Implement alarm-category high-priority notification posting with a silent sound and explicit vibration settings.
- Implement flash behavior by auto-canceling the posted notification after 500ms to bound vibration duration.
- Add overlap protection so rapid repeated calls cancel prior delayed cancel tasks before scheduling a new one.
- Document required Android permissions and raw asset requirements.

## Capabilities

### New Capabilities
- `flash-alarm-notify`: Provide a native Android alarm-flash notification mechanism optimized for strong, short vibration on phone and paired smartwatch.

### Modified Capabilities
- `local-reminder-delivery`: Allow reminder delivery flows to invoke the new flash alarm notification path for watch-linked strong vibration behavior.

## Impact

- Affected code: Android Capacitor plugin module, TypeScript plugin definitions, reminder-trigger integration path.
- Platform APIs: Android `NotificationChannel`, `NotificationCompat`, `Handler/Looper`, notification permissions.
- Permissions/dependencies: `VIBRATE`, `POST_NOTIFICATIONS`, raw resource `res/raw/silent.mp3`.
- Behavior change: reminder trigger path can produce alarm-category vibration events visible to connected wearables.
