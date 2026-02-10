## Why

HydrateMate's frontend still relies on local mock state for core hydration flows, so user actions do not consistently persist, survive refresh, or reflect backend analytics/reminder behavior. This change is needed now to make the existing product reliable in real usage by moving all existing features to true backend-driven data without changing the current UI style.

## What Changes

- Replace core app-level mock hydration state with authenticated backend initialization and refresh-safe state restoration.
- Connect Home quick-add drink actions to real intake APIs and refresh progress, streak, and goal-related summaries after writes.
- Replace Stats mock cards/charts with backend stats endpoints (weekly, streak, best-time, gaps, health) and empty/error handling.
- Bind Profile, Goal, Drink, and Reminder settings pages to profile/settings APIs for real read/write persistence.
- Integrate authenticated WebSocket reminder flow with reconnect handling and local notification triggering.
- Align frontend types and page-level contracts to backend response fields centered on `frontend/api.ts`.

## Capabilities

### New Capabilities
- `backend-data-integration`: End-to-end authenticated frontend data flow for profile, settings, intakes, and stats with refresh-safe session restoration.
- `realtime-reminder-notifications`: WebSocket reminder lifecycle (connect/reconnect/disconnect) and local notification delivery.

### Modified Capabilities
- `app-initialization`: Startup must initialize authenticated backend state (profile/settings/intakes/stats basics) with unified loading/error handling before entering normal app flow.
- `hourly-stats`: Stats visualization requirements must be sourced from backend analytics endpoints rather than static or purely local mock data.

## Impact

- Affected frontend areas: `frontend/App.tsx`, `frontend/api.ts`, `frontend/pages/HomeModern.tsx`, `frontend/pages/Stats.tsx`, `frontend/pages/Profile.tsx`, `frontend/pages/GoalSetting.tsx`, `frontend/pages/DrinkSettings.tsx`, `frontend/pages/ReminderSettings.tsx`, `frontend/services/websocket.ts`, `frontend/services/notifications.ts`.
- Affected backend contract usage: auth, profile, settings, intakes, stats, and ws routes already exposed in `backend/cmd/api/main.go`.
- Risk/coordination points: token lifecycle, API error handling (especially 401), timestamp/field contract consistency, and reconnect behavior for reminder delivery.


