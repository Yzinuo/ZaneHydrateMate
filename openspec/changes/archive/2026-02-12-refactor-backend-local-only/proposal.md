## Why

The app goal is now a pure local Android app packaged with Capacitor, with no cloud backend and no user data upload. This change is needed now to align architecture with the product decision while preserving the current UI/UX.

## What Changes

- Replace cloud-dependent data flow with fully local persistence and local computation.
- Introduce Capacitor Android runtime as the required deployment target.
- Introduce native local database storage (SQLite) as the primary persistence layer.
- Replace websocket-driven reminder dependency with local notification scheduling.
- Keep all existing frontend visual presentation unchanged (layout, style, animations, assets).
- **BREAKING**: Remove requirement for backend API/WebSocket services and related runtime configuration for cloud connectivity.

## Capabilities

### New Capabilities
- `local-data-persistence`: Persist profile, settings, intake records, and derived reads in a device-local SQLite database with offline-first behavior.
- `capacitor-android-runtime`: Build and run the app as a Capacitor-packaged Android app with required platform setup.
- `local-reminder-delivery`: Deliver hydration reminders through local scheduling/notifications without server push.

### Modified Capabilities
- `app-initialization`: Initialization must include local database readiness checks while preserving startup/splash user experience.
- `hourly-stats`: Stats computation source must be local persisted data rather than backend responses, while keeping displayed behavior consistent.

## Impact

- Affected code: `frontend/api.ts`, app data access flow in `frontend/App.tsx`, reminder services under `frontend/services/`.
- New dependencies/systems: Capacitor core/android tooling, SQLite plugin integration, Android project scaffolding.
- Removed runtime dependency: backend API endpoints, websocket reminder channel, cloud auth/session assumptions.
- Operational impact: development and testing workflow must include Android/Capacitor build and on-device validation.
