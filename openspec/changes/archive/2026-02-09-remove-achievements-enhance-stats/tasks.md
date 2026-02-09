## 1. Remove Achievements (Frontend)

- [x] 1.1 Remove `Achievements` import and route from `frontend/App.tsx`.
- [x] 1.2 Remove the "Garden" (Achievements) navigation button from `frontend/App.tsx`.
- [x] 1.3 Delete `frontend/pages/Achievements.tsx`.

## 2. Backend Stats Enhancement

- [x] 2.1 Update `backend/internal/app/model/stats.go` to include `HourlyStats` struct.
- [x] 2.2 Implement hourly aggregation logic in `backend/internal/app/service/stats_service.go` (or similar).
- [x] 2.3 Expose hourly stats via `backend/internal/app/handler/stats_handler.go`.

## 3. Frontend Stats Enhancement

- [x] 3.1 Create a new `HourlyChart` component (or add directly to `Stats.tsx`) using `recharts`.
- [x] 3.2 Fetch hourly data in `frontend/pages/Stats.tsx` and bind it to the chart.
- [x] 3.3 Add visual indicators for "Low Intake" periods (e.g., specific color or annotation).
