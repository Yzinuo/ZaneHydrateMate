## Context

The current app experience is already frontend-centric and visually complete, but historical architecture assumes cloud API and websocket dependencies. Product direction is now explicit: package with Capacitor for Android and run fully local with no user data upload. The implementation must preserve all existing screens, visual style, animation behavior, and interaction patterns.

## Goals / Non-Goals

**Goals:**
- Make Android (Capacitor) the primary runtime target.
- Replace remote data dependency with device-local persistence as the source of truth.
- Keep existing frontend API contracts stable so UI pages require minimal or no visual/behavioral changes.
- Deliver reminder capability through local scheduling/notifications only.
- Ensure the app remains fully functional offline.

**Non-Goals:**
- Introducing cloud sync, account systems, or backend services.
- Redesigning UI, changing page layouts, changing art assets, or changing interaction style.
- Building multi-device data sharing.
- Implementing iOS-specific packaging in this change.

## Decisions

1. Data boundary remains in `frontend/api.ts`.
- Decision: Keep current method signatures (`intakeApi`, `statsApi`, `profileApi`, `settingsApi`) and swap implementation to local storage services.
- Rationale: This minimizes blast radius and protects UI rendering behavior.
- Alternative considered: Refactor all pages to a new repository interface. Rejected for higher UI regression risk.

2. SQLite is the primary local database, with Capacitor bridge access.
- Decision: Use Capacitor SQLite plugin as canonical persistence in Android runtime.
- Rationale: Structured data, query efficiency for stats, and durable storage fit hydration records and analytics.
- Alternative considered: Continue with localStorage only. Rejected for weak querying and migration limitations.

3. Reminder delivery is local-only.
- Decision: Remove server-push dependency and schedule reminders via local notification APIs.
- Rationale: Works offline and aligns with no-cloud requirement.
- Alternative considered: Keep websocket as optional. Rejected because pure local mode forbids remote dependency.

4. Startup includes local data readiness gate while preserving splash experience.
- Decision: App initialization waits for DB readiness and seed/migration completion before marking initialization complete.
- Rationale: Prevents partial reads and race conditions while retaining current startup UX contract.
- Alternative considered: Lazy-init DB after first render. Rejected due to inconsistent first-screen data state.

5. Migration is one-way from existing local cache to SQLite.
- Decision: On first launch after update, migrate existing local data (if present) into SQLite, then mark migration complete.
- Rationale: Preserve user data without introducing repeated conversion cost.
- Alternative considered: Fresh-start data reset. Rejected due to avoidable data loss.

6. Local database encryption is out of scope for this change.
- Decision: Do not implement local database encryption in the first Android local-only release.
- Rationale: The product does not require encrypted local storage at this stage, and skipping encryption reduces delivery complexity.
- Alternative considered: Encrypted database from day one. Rejected for added integration and testing overhead.

7. Reminder history persistence is out of scope.
- Decision: Do not persist reminder-delivery history (for example, storing each reminder trigger timestamp).
- Rationale: Current product scope only needs reminder delivery, not reminder audit/analytics history.
- Alternative considered: Persist local reminder history for analytics. Rejected as unnecessary for current scope.

8. In-app data export and one-click delete are out of scope.
- Decision: Do not implement in-app data export or one-click data wipe in this change.
- Rationale: These are not required for the current local-only delivery goal and can be considered later if needed.
- Alternative considered: Include data management tooling in this change. Rejected to keep scope focused and reduce risk.

## Risks / Trade-offs

- [Plugin/runtime integration complexity] → Mitigation: add a startup health check and fail-safe fallback path for development builds.
- [Notification behavior differences across Android versions] → Mitigation: centralize permission/state checks and include explicit UX guidance for denied permission.
- [Data migration edge cases from legacy local cache] → Mitigation: idempotent migration marker + validation of migrated row counts.
- [Hidden UI coupling to removed websocket status] → Mitigation: keep UI props intact and map connection state to local scheduler health where needed.

## Migration Plan

1. Add Capacitor and Android project scaffolding, confirm build pipeline (`build -> sync -> run`).
2. Add SQLite layer with schema versioning and initialization routines.
3. Implement one-time migration from legacy local cache into SQLite.
4. Replace localStorage data access in `frontend/api.ts` with SQLite-backed operations (same exported signatures).
5. Remove websocket reminder dependency and wire reminder behavior to local scheduling.
6. Validate no visual regressions by snapshot/manual checks of all key pages.
7. Validate offline behavior on Android device/emulator: add intake, restart app, verify persistence and stats.

## Open Questions

None for this iteration.
