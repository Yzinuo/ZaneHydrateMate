## Why

To simplify the backend complexity and focus on more practical health data insights, we are removing the gamification "Achievements" system. Instead, we will enhance the "Stats" page to provide more detailed analysis of user hydration habits, specifically adding hourly intake distribution analysis.

## What Changes

- **BREAKING**: Remove the "Achievements" page (`Achievements.tsx`) and all its related frontend assets (icons, images).
- **BREAKING**: Remove the "Achievements" (Garden) button from the main navigation bar in `App.tsx`.
- Modify `Stats.tsx` to include a new "Hourly Intake Analysis" chart/section.
- Enhance the backend stats handler (implied) to support querying data by hour/time-of-day.

## Capabilities

### New Capabilities
- `hourly-stats`: Capability to analyze and display water intake distribution across different hours of the day.

### Modified Capabilities
- `navigation`: Update navigation structure to remove the Achievements route.

## Impact

- `frontend/App.tsx`: Navigation bar modification.
- `frontend/pages/Achievements.tsx`: File deletion.
- `frontend/pages/Stats.tsx`: New UI components for hourly analysis.
- `frontend/constants.ts`: Potential cleanup of unused constants related to achievements.
