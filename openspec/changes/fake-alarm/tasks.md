## 1. Android Plugin Scaffold

- [x] 1.1 Create `FlashAlarmNotifyPlugin.kt` under the Android Capacitor plugin package and expose a `@PluginMethod` named `trigger` with no required arguments.
- [x] 1.2 Register the plugin with the Capacitor Android runtime so it can be called from web code as `FlashAlarmNotify`.

## 2. Notification Channel and Flash Logic

- [x] 2.1 Implement channel creation for `flash_alarm_channel` with `IMPORTANCE_HIGH`, silent raw sound, alarm audio attributes, and vibration pattern `longArrayOf(0, 1000)`.
- [x] 2.2 Build alarm notification payload with `CATEGORY_ALARM`, `setOngoing(true)`, and `setAutoCancel(false)`.
- [x] 2.3 Implement flash flow in `trigger()`: call `notify`, clear any pending cancel callback, schedule `postDelayed(..., 500)`, and cancel the notification by ID.

## 3. TypeScript Interface and Integration Points

- [x] 3.1 Add/update `src/definitions.ts` to define `FlashAlarmNotify` plugin contract with a no-arg `trigger(): Promise<void>` method.
- [x] 3.2 Add/update plugin entry wiring (if needed) so app code can import and call `FlashAlarmNotify.trigger()`.

## 4. Android Permissions and Assets

- [x] 4.1 Add `android.permission.VIBRATE` and `android.permission.POST_NOTIFICATIONS` to Android manifest configuration.
- [x] 4.2 Add `android/app/src/main/res/raw/silent.mp3` and verify build packaging includes resource presence in project (Gradle resource merge blocked by missing local Android SDK path).

## 5. Validation

- [x] 5.1 Validate rapid repeated trigger calls do not overlap stale delayed-cancel handlers.
- [ ] 5.2 Validate end-to-end behavior on Android phone plus connected smartwatch: strong vibration starts promptly and stops after about 500ms.
- [x] 5.3 Route Android interval reminder scheduling through `FlashAlarmNotify` native scheduling API (`scheduleIntervalReminder` / `cancelIntervalReminder`) instead of generic local notification channel.
- [x] 5.4 Route Android in-app immediate notification trigger path to `FlashAlarmNotify.trigger()` so reminder alerts use the same flash alarm logic.
- [x] 5.5 Add native Android alarm receiver wiring for interval reminders (`FlashAlarmReminderReceiver` + manifest registration) to keep reminders firing when the app is backgrounded.
- [ ] 5.6 Validate interval reminder end-to-end on physical phone + connected smartwatch (including quiet-hours skip behavior and repeated interval cadence).
