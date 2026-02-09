## Context
The application currently features a gamified "Achievements" system that adds complexity to the backend and frontend. The user finds this less valuable than practical data insights. We are shifting focus to providing "Hourly Intake Analysis" to help users understand *when* they drink water, not just how much.

## Goals / Non-Goals
**Goals:**
- Completely remove the Achievements module (frontend pages, navigation, assets).
- Implement a new "Hourly Distribution" chart in the Stats page.
- Update the backend `StatsHandler` (or add a new endpoint) to serve aggregated hourly data.

**Non-Goals:**
- Removing the database tables for achievements (if any exist) is out of scope for this frontend-focused change, unless they strictly block the removal. (Assuming frontend-driven change primarily).
- Advanced AI analysis of habits (simple aggregation only).

## Decisions
### Frontend Data Processing vs Backend Aggregation
- **Decision:** Perform hourly aggregation on the **Backend**.
- **Rationale:** Sending raw records to the frontend to aggregate is inefficient if the dataset grows. The backend can efficiently group by `EXTRACT(HOUR from intake_time)`.
- **Alternative:** Frontend aggregation. (Rejected: Increases payload size and client computation).

### Chart Library
- **Decision:** Reuse `recharts` which is already in use in `Stats.tsx`.
- **Rationale:** Consistency and no new dependencies.

## Risks / Trade-offs
- **Risk:** Users who liked achievements might be disappointed. -> **Mitigation:** Clear messaging about the shift to "Professional Data Analysis" focus.
- **Risk:** Timezone handling for hourly stats. -> **Mitigation:** Ensure the backend aggregates based on the user's local time or returns UTC hours that the frontend adjusts. For MVP, we will assume server time or client-adjusted UTC.

## Migration Plan
1. Delete `Achievements.tsx`.
2. Remove route from `App.tsx`.
3. Implement `GetHourlyStats` in backend.
4. Update `Stats.tsx` to consume new data.
