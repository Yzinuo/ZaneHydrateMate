## ADDED Requirements

### Requirement: Flash alarm notification trigger
The system SHALL provide a Capacitor plugin method `trigger()` that posts an Android alarm-category notification intended to produce strong immediate vibration behavior on phone and connected smartwatch.

#### Scenario: Trigger emits alarm-category notification
- **WHEN** the app invokes `FlashAlarmNotify.trigger()`
- **THEN** the Android layer SHALL post a notification with category `CATEGORY_ALARM`
- **AND** the notification SHALL use channel `flash_alarm_channel` with high importance

### Requirement: Flash duration bounded to 500ms
The system SHALL bound the active notification lifetime to approximately 500 milliseconds by canceling the posted notification via a delayed main-thread task.

#### Scenario: Notification auto-cancels after flash window
- **WHEN** a flash alarm notification is posted
- **THEN** the plugin SHALL schedule cancellation with `postDelayed(..., 500)`
- **AND** the same notification ID SHALL be canceled when the delay elapses

### Requirement: Overlap-safe trigger behavior
The system SHALL prevent overlap races when trigger is called rapidly by canceling any pending delayed-cancel callback before scheduling a new one.

#### Scenario: Rapid repeated trigger calls
- **WHEN** `trigger()` is called again before a previous delayed cancel executes
- **THEN** the previous pending callback SHALL be removed
- **AND** only the latest delayed cancel task SHALL remain active
