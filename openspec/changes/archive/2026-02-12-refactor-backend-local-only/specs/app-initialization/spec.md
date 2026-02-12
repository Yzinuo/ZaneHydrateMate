## MODIFIED Requirements

### Requirement: Transition to Main App
The splash screen SHALL transition to the main application view once initialization is complete and a minimum display time has elapsed. Initialization MUST include local persistence readiness checks (local database open, schema validation, and required local data bootstrap) before transition.

#### Scenario: Initialization Complete
- **WHEN** the application initialization logic (including local data loading and local database readiness checks) completes
- **AND** the minimum display time (e.g., 2 seconds) has passed
- **THEN** the splash screen fades out
- **THEN** the Home screen becomes visible

#### Scenario: Local data source unavailable at startup
- **WHEN** local persistence initialization fails during startup
- **THEN** the system SHALL block transition to an inconsistent main state
- **AND** it SHALL present a recoverable initialization error state
