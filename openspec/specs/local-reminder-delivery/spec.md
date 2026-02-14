# Local Reminder Delivery Specification

## Purpose
Define requirements for delivering hydration reminders entirely through local scheduling and notification capabilities.

## Requirements

### Requirement: Local Reminder Scheduling
The system SHALL deliver hydration reminders using local scheduling/notification APIs without requiring server push, and SHALL support invoking an alarm-category flash notification path when strong watch-linked vibration is requested.

#### Scenario: Interval reminder delivery
- **WHEN** the user enables interval reminders and selects a reminder interval
- **THEN** the app SHALL schedule recurring local notifications at the configured interval
- **AND** reminders SHALL continue to trigger while offline

#### Scenario: Strong watch vibration reminder delivery
- **WHEN** reminder delivery is configured to use strong watch-linked vibration
- **THEN** the app SHALL invoke the native flash alarm notification trigger for the reminder event
- **AND** the trigger path SHALL run without requiring network connectivity

### Requirement: Do-Not-Disturb Enforcement
The system SHALL suppress locally scheduled reminders during configured quiet hours.

#### Scenario: Quiet-hour suppression
- **WHEN** the current time falls within configured quiet hours
- **THEN** scheduled reminder delivery SHALL be suppressed
- **AND** reminder delivery SHALL resume automatically after quiet hours end

### Requirement: Notification Permission Handling
The system SHALL request and respect local notification permission state before scheduling reminder notifications.

#### Scenario: Permission denied
- **WHEN** notification permission is denied by the user
- **THEN** the app SHALL not schedule local reminder notifications
- **AND** it SHALL expose the denied state to reminder settings UI
