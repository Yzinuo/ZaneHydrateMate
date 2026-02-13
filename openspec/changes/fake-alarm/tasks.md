## 1. Android Plugin Scaffold

- [ ] 1.1 Create `FlashAlarmNotifyPlugin.kt` under the Android Capacitor plugin package and expose a `@PluginMethod` named `trigger` with no required arguments.
- [ ] 1.2 Register the plugin with the Capacitor Android runtime so it can be called from web code as `FlashAlarmNotify`.

## 2. Notification Channel and Flash Logic

- [ ] 2.1 Implement channel creation for `flash_alarm_channel` with `IMPORTANCE_HIGH`, silent raw sound, alarm audio attributes, and vibration pattern `longArrayOf(0, 1000)`.
- [ ] 2.2 Build alarm notification payload with `CATEGORY_ALARM`, `setOngoing(true)`, and `setAutoCancel(false)`.
- [ ] 2.3 Implement flash flow in `trigger()`: call `notify`, clear any pending cancel callback, schedule `postDelayed(..., 500)`, and cancel the notification by ID.

## 3. TypeScript Interface and Integration Points

- [ ] 3.1 Add/update `src/definitions.ts` to define `FlashAlarmNotify` plugin contract with a no-arg `trigger(): Promise<void>` method.
- [ ] 3.2 Add/update plugin entry wiring (if needed) so app code can import and call `FlashAlarmNotify.trigger()`.

## 4. Android Permissions and Assets

- [ ] 4.1 Add `android.permission.VIBRATE` and `android.permission.POST_NOTIFICATIONS` to Android manifest configuration.
- [ ] 4.2 Add `android/app/src/main/res/raw/silent.mp3` and verify build packaging includes the resource.

## 5. Validation

- [ ] 5.1 Validate rapid repeated trigger calls do not overlap stale delayed-cancel handlers.
- [ ] 5.2 Validate end-to-end behavior on Android phone plus connected smartwatch: strong vibration starts promptly and stops after about 500ms.
