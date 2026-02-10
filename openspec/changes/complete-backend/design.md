## Context

HydrateMate currently presents production-like UI flows, but critical hydration behavior is still driven by local in-memory state and mock chart data. Backend endpoints for auth, profile, settings, intakes, stats, and websocket reminders already exist, and `frontend/api.ts` provides a central API client foundation. The change must keep existing page structure and visual style while replacing local simulation paths with backend-backed state and persistence.

## Goals / Non-Goals

**Goals:**
- Convert core user-facing hydration workflows from local simulation to authenticated backend data flow.
- Establish a single app-level initialization sequence that restores login state and loads profile/settings/intakes/stats prerequisites.
- Ensure Home, Stats, Profile, Goal, Drink, and Reminder settings pages perform real read/write operations with consistent loading/error/empty states.
- Integrate websocket reminder delivery with notification service, lifecycle cleanup, and reconnect handling.
- Align frontend TypeScript contracts with backend response payloads and remove fragile `any`/hard-coded field mapping.

**Non-Goals:**
- Visual redesign, layout restructuring, or style-system changes.
- Backend API contract changes or schema redesign in this change.
- New product features outside parity of currently exposed frontend functionality.

## Decisions

1. Centralize authenticated app bootstrap in `App.tsx`.
- Decision: Build an initialization pipeline that, after token restore/login, fetches profile/settings and baseline hydration data before rendering normal app interactions.
- Rationale: Removes duplicated fetch logic across pages and prevents inconsistent screen state after refresh.
- Alternative considered: Per-page lazy loading only. Rejected because shared hydration summary data would drift and error handling would fragment.

2. Use `frontend/api.ts` as the contract source of truth.
- Decision: Consolidate endpoint payload typing and response mapping in API client layer; page components consume typed domain data only.
- Rationale: Prevents repeated field-name and date-format mismatches across UI modules.
- Alternative considered: Keep page-local mapping. Rejected due to repetition and contract drift risk.

3. Introduce explicit async-state conventions for page data.
- Decision: Standardize each feature path around `idle/loading/success/error/empty` rendering branches using existing UI style patterns.
- Rationale: Makes 401/network/empty data behavior predictable and testable.
- Alternative considered: Silent fallback to stale local state. Rejected because it hides integration failures.

4. Make settings and hydration writes mutation-driven with targeted refresh.
- Decision: After writes (e.g., intake add, settings update), re-fetch only affected resources (daily intakes, stats summaries, settings) rather than full app reload.
- Rationale: Keeps UX responsive while preserving backend truth.
- Alternative considered: Optimistic-only updates without refetch. Rejected because server-side derivations (streak, best-time, health score) may differ.

5. WebSocket lifecycle bound to authenticated session.
- Decision: Connect websocket after successful auth and known user id, reconnect with backoff on transient failures, disconnect on logout/unmount.
- Rationale: Prevents orphaned sockets and ensures reminders only for active authenticated users.
- Alternative considered: Always-on singleton connection. Rejected because token/user context changes require deterministic reconnect.

## Risks / Trade-offs

- [Risk] Backend payload shapes differ from frontend assumptions. -> Mitigation: enforce strict API typing in `frontend/api.ts` and normalize date/number parsing in one place.
- [Risk] Increased initial loading time during bootstrap. -> Mitigation: parallelize independent fetches and retain splash/loading UI until minimum required data is ready.
- [Risk] Frequent refetch after mutations can add network overhead. -> Mitigation: scope refresh calls to impacted endpoints and debounce repeated quick-add actions.
- [Risk] Browser notification permission denial reduces reminder visibility. -> Mitigation: keep in-app reminder indicators and surface permission state with non-blocking UI messaging.
- [Risk] Reconnect loops during backend downtime. -> Mitigation: capped exponential backoff and clear disconnected state to user.

## Migration Plan

1. Introduce/align API client types and auth token persistence utilities.
2. Refactor app bootstrap to authenticated backend initialization flow.
3. Replace Home write path and summary refresh with intake/settings-backed data.
4. Replace Stats mock data wiring with real stats endpoints and empty/error placeholders.
5. Connect Profile/Goal/Drink/Reminder forms to profile/settings APIs.
6. Implement websocket reminder lifecycle + notification triggering.
7. Validate end-to-end flows: register/login, refresh persistence, CRUD-like intake actions, stats rendering, settings persistence, websocket reminder reception.
8. Rollback strategy: feature-flag or branch-level rollback to previous local-state path if critical backend dependency failures occur during rollout.

## Open Questions

- Should reminder settings include server-side timezone normalization, or should frontend send local timezone offset with each update?
- What is the intended retry ceiling/backoff interval for websocket reconnection in production?
- For `intakes` refresh after add/delete, should frontend fetch only "today" or a wider date window used by multiple stats cards?
