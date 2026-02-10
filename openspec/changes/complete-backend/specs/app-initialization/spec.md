## MODIFIED Requirements

### Requirement: Transition to Main App
The splash screen SHALL transition to the main application view once authenticated initialization is complete and a minimum display time has elapsed.

#### Scenario: Initialization Complete
- **WHEN** the application is opened
- **AND** startup initialization fetches required authenticated data (or determines user is unauthenticated)
- **AND** the minimum display time (e.g., 2 seconds) has passed
- **THEN** the splash screen fades out
- **THEN** the next view is rendered with consistent loading/error state for any pending non-critical data

#### Scenario: Initialization Error
- **WHEN** required startup data loading fails
- **THEN** the splash screen does not hang indefinitely
- **THEN** the app transitions to a recoverable error-capable state that allows retry or re-authentication
