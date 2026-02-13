## MODIFIED Requirements

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
