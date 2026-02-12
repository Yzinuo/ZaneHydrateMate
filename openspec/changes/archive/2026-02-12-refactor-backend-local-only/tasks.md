## 1. Capacitor Android Baseline

- [x] 1.1 Add Capacitor core/cli/android dependencies and project scripts in `frontend/package.json`.
- [x] 1.2 Initialize Capacitor config and create Android platform project.
- [ ] 1.3 Verify `build -> cap sync android -> run` pipeline works on emulator/device.

## 2. SQLite Foundation

- [x] 2.1 Add SQLite plugin dependencies and create database bootstrap module (open DB, schema version, migration entrypoint).
- [x] 2.2 Create schema for profile, settings, intakes, and migration marker tables/records.
- [x] 2.3 Implement startup health validation for DB readiness and explicit recoverable init failure state.

## 3. Local Data Layer Refactor

- [x] 3.1 Refactor `frontend/api.ts` to use SQLite-backed operations while preserving existing exported method signatures.
- [x] 3.2 Implement local CRUD for profile/settings/intakes and local stats queries used by Home/Stats pages.
- [x] 3.3 Remove cloud API and websocket runtime dependency paths from the data layer contract.

## 4. Legacy Cache Migration

- [x] 4.1 Implement one-time migration from legacy local cache keys into SQLite for profile/settings/intakes.
- [x] 4.2 Make migration idempotent using a persisted completion marker.
- [x] 4.3 Add migration validation checks (row counts/basic integrity) and safe fallback behavior on malformed legacy data.

## 5. Local Reminder Delivery

- [x] 5.1 Replace websocket reminder flow with local scheduling-based reminder service.
- [x] 5.2 Enforce do-not-disturb window suppression in local reminder execution.
- [x] 5.3 Wire permission-denied state to reminder settings behavior without altering existing UI design.

## 6. App Initialization Integration

- [x] 6.1 Update app startup flow to await local DB bootstrap and required local data preload before splash transition.
- [x] 6.2 Ensure startup failure blocks inconsistent main-screen rendering and shows recoverable initialization error state.
- [x] 6.3 Keep splash timing and visual behavior unchanged while adding readiness gating.

## 7. Verification and Regression Guardrails

- [ ] 7.1 Validate offline core flows on Android (home/stats/profile/drink/reminder settings) in airplane mode.
- [x] 7.2 Validate persistence across app restart (intakes, profile, settings, computed stats).
- [ ] 7.3 Validate no UI visual regressions on key pages (layout, animation, assets, colors, typography).
