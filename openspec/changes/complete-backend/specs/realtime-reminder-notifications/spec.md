## ADDED Requirements

### Requirement: Auth-Bound WebSocket Connection
The system SHALL establish reminder WebSocket connections only for authenticated users using token and user identity parameters required by the backend endpoint.

#### Scenario: Connect after login
- **WHEN** login succeeds and token plus user id are available
- **THEN** the app opens a websocket connection to `/api/v1/ws` with required auth query parameters
- **THEN** connection state is tracked for connected/disconnected UI behavior

#### Scenario: Disconnect on logout
- **WHEN** the user logs out or the app tears down authenticated state
- **THEN** the active websocket connection is closed
- **THEN** no further reminder messages are processed for that session

### Requirement: Reminder Notification Delivery
The system SHALL convert backend reminder websocket payloads into local notifications through the notification service.

#### Scenario: Receive reminder payload
- **WHEN** a reminder message containing `title`, `body`, `current_ml`, `goal_ml`, and `timestamp` is received
- **THEN** the notification service displays a local reminder notification using the payload content
- **THEN** the hydration context in the app remains synchronized with any updated reminder values

#### Scenario: Notification permission unavailable
- **WHEN** the browser denies or has not granted notification permissions
- **THEN** the app handles the condition without crashing
- **THEN** reminder events remain visible through non-notification in-app feedback

### Requirement: Reconnect Strategy for Transient Failures
The system SHALL attempt websocket reconnection after transient disconnects with bounded backoff.

#### Scenario: Temporary connection drop
- **WHEN** an authenticated websocket connection closes unexpectedly
- **THEN** the app retries connection with increasing delay up to a configured limit
- **THEN** reconnect attempts stop when user logs out or session is invalidated
