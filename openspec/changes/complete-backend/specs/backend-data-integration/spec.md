## ADDED Requirements

### Requirement: Authenticated Session Restoration
The system SHALL persist authentication state and restore it after application reload so authenticated users remain signed in until token expiry or explicit logout.

#### Scenario: Restore valid session on refresh
- **WHEN** the app starts and a valid token is found in persistent storage
- **THEN** the app authenticates API requests with that token
- **THEN** the user remains signed in without being redirected to login

#### Scenario: Handle invalid or expired session
- **WHEN** the app starts with an invalid or expired token
- **THEN** the app clears stored auth credentials
- **THEN** protected data requests are not executed as authenticated calls
- **THEN** the user is shown the sign-in flow with a visible error state

### Requirement: Backend-Driven Hydration Data Flow
The system SHALL use backend APIs as the source of truth for profile, settings, intakes, and hydration summary state used across existing pages.

#### Scenario: Initialize required hydration data after login
- **WHEN** a user successfully logs in or registers
- **THEN** the app fetches profile, settings, and initial intake/stat summary data
- **THEN** the Home and Settings views render backend data instead of local mock state

#### Scenario: Refresh dependent data after intake mutation
- **WHEN** the user adds or deletes an intake entry
- **THEN** the app calls the backend intake API for the mutation
- **THEN** the app refreshes affected hydration progress and related summary metrics from backend endpoints

### Requirement: Unified Async State Handling
The system SHALL expose consistent loading, empty, and error states for backend-driven hydration features.

#### Scenario: Network failure during data fetch
- **WHEN** any required backend fetch fails due to network or server error
- **THEN** the relevant page displays a visible error message in existing UI style
- **THEN** retrying the action triggers a fresh API request

#### Scenario: Empty stats/intake data
- **WHEN** backend returns no data for a requested period
- **THEN** the page displays a friendly empty-state placeholder
- **THEN** no mock fallback values are shown as real metrics
