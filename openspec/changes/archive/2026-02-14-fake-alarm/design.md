## Context

The app runs as a Capacitor Android application and currently delivers hydration reminders through local notification scheduling. In practice, standard notification delivery does not consistently produce strong haptics on paired Bluetooth smartwatches. The change introduces a focused native plugin path that emits an alarm-category notification with explicit vibration settings and then cancels it after 500ms to create a short, strong "flash" vibration event.

## Goals / Non-Goals

**Goals:**
- Provide a no-argument Capacitor API to trigger a short strong vibration event.
- Maximize smartwatch haptic engagement by using `Notification.CATEGORY_ALARM` and high-importance channel config.
- Bound vibration duration to ~500ms by canceling the notification shortly after posting.
- Avoid overlapping delayed cancel tasks when trigger calls happen in quick succession.
- Keep reminder flows local-only and compatible with existing Android runtime constraints.

**Non-Goals:**
- Building a full alarm/timer UI or long-running foreground service.
- Guaranteeing identical haptic intensity across all OEM devices and watches.
- Replacing all existing reminder scheduling logic in this change.
- Implementing iOS-native equivalent behavior.

## Decisions

1. Use a dedicated notification channel `flash_alarm_channel` with `IMPORTANCE_HIGH`.
Rationale: watch devices and Android notification routing are more likely to classify the event as urgent.
Alternative considered: reuse existing reminder channel; rejected because lower channel semantics can weaken watch-side behavior.

2. Use `CATEGORY_ALARM`, `setOngoing(true)`, and `setAutoCancel(false)` in the notification.
Rationale: alarm-category metadata is the strongest portable signal for wearable mirroring; ongoing/non-autocancel avoids early system dismissal before manual cancellation.
Alternative considered: regular category reminder notifications; rejected because smartwatch response can be weaker.

3. Use silent bundled audio (`res/raw/silent.mp3`) with alarm audio attributes.
Rationale: preserve alarm semantics without producing unwanted audible beeps.
Alternative considered: no sound URI; rejected because some devices downgrade haptic treatment without explicit channel sound configuration.

4. Implement flash window using `notify()` followed by `Handler(Looper.getMainLooper()).postDelayed(..., 500)` then `cancel()`.
Rationale: bounded notification lifetime provides deterministic upper bound for vibration duration.
Alternative considered: short vibration pattern only; rejected because system/device layers can ignore or elongate patterns inconsistently.

5. Add overlap control by removing previous delayed callbacks before scheduling a new cancel task.
Rationale: prevents stale callbacks from racing and canceling newer notifications incorrectly.
Alternative considered: unique IDs per trigger; rejected because it increases cleanup complexity and can stack unwanted alerts.

## Risks / Trade-offs

- [Wearable/OEM variance] Some watches may still interpret vibration timing differently. ¡ú Mitigation: keep alarm category/high importance and validate on target watch models.
- [Android 13+ permission gate] Missing `POST_NOTIFICATIONS` can block trigger effect. ¡ú Mitigation: document and enforce permission flow before invocation.
- [Silent asset packaging] Missing `silent.mp3` breaks sound URI lookup. ¡ú Mitigation: add explicit asset reminder and runtime fallback to no-sound if needed.
- [Rapid trigger storms] Frequent calls may still create brief notification churn. ¡ú Mitigation: single notification ID plus handler callback cancellation.

## Migration Plan

1. Add plugin class and TypeScript definition.
2. Register plugin in the Android Capacitor project.
3. Add required permissions and raw silent audio asset.
4. Integrate reminder trigger path to call `FlashAlarmNotify.trigger()` where strong watch vibration is required.
5. Validate on physical Android phone + paired smartwatch.
6. Rollback: disable invocation path and revert plugin registration/manifest entries.

## Open Questions

- Should reminder settings expose a user toggle for "watch strong vibration mode" before default enablement?
- Do we need telemetry for trigger success/failure to tune device compatibility?
