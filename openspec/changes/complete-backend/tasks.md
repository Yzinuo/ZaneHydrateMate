## 1. API Contract and Session Foundation

- [x] 1.1 Audit `frontend/api.ts` endpoint typings against backend routes and normalize response/request interfaces for auth, profile, settings, intakes, stats, and websocket params.
- [ ] 1.2 Add/align auth token persistence helpers and API client token injection so reload restores authenticated requests.
- [ ] 1.3 Implement centralized 401 handling path that clears invalid session state and routes user to re-auth with visible feedback.

## 2. App Bootstrap and Shared State

- [ ] 2.1 Refactor `frontend/App.tsx` initialization flow to load profile/settings/intake baseline/stats prerequisites after auth restore or login.
- [x] 2.2 Replace local hydration mock state sources in app-level logic with backend-backed state containers/selectors.
- [x] 2.3 Implement shared loading, error, and empty-state handling conventions used by Home, Stats, and settings pages.

## 3. Home and Intake Mutation Flow

- [x] 3.1 Wire `frontend/pages/HomeModern.tsx` quick drink actions to `intakeApi.add` with validated payloads.
- [ ] 3.2 After intake mutation, refresh daily intakes plus dependent progress/streak/goal summaries from backend.
- [x] 3.3 Ensure Home goal/progress calculations consume `settings.daily_goal_ml` and backend-derived totals only.

## 4. Stats Real Data Integration

- [x] 4.1 Replace mock stats sources in `frontend/pages/Stats.tsx` with `statsApi.getWeekly`, `getStreak`, `getBestTime`, `getGaps`, and `getHealth`.
- [x] 4.2 Map backend metric structures into existing chart/card components without altering visual style.
- [x] 4.3 Add robust per-section empty/error placeholders for missing stats datasets and failed requests.

## 5. Profile and Settings Persistence

- [x] 5.1 Load `frontend/pages/Profile.tsx` initial form state from `profileApi.get` and save via `profileApi.update`.
- [x] 5.2 Keep `recommended_ml` and `current_goal_ml` display aligned to backend field names and value updates.
- [x] 5.3 Persist goal/drink/reminder-related settings through `settingsApi.get/update`, including quiet hours and reminder intensity.
- [x] 5.4 Remove Reminder page local-only state branches and merge local UX behavior with backend settings as source of truth.

## 6. WebSocket Reminder Lifecycle

- [x] 6.1 Establish websocket connection after successful auth using token + user id (`/api/v1/ws`) in `frontend/services/websocket.ts`.
- [x] 6.2 Implement reminder message handling to trigger `frontend/services/notifications.ts` with backend payload fields.
- [x] 6.3 Add reconnect with bounded backoff and explicit disconnect on logout/unmount.
- [x] 6.4 Handle notification permission states gracefully while preserving in-app reminder visibility.

## 7. Validation and Regression Checks

- [ ] 7.1 Verify register/login/logout and refresh-based session restoration end-to-end against backend.
- [x] 7.2 Verify intake add/list/delete persistence and Home progress correctness after reload.
- [x] 7.3 Verify all Stats cards/charts render backend data and show correct empty/error behavior.
- [x] 7.4 Verify Profile and settings updates persist across reload and remain contract-consistent.
- [ ] 7.5 Verify websocket reminder reception, local notification display, and reconnect/disconnect behavior under network interruptions.


