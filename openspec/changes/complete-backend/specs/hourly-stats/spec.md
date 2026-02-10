## MODIFIED Requirements

### Requirement: Hourly Intake Visualization
The system SHALL calculate and display hydration analytics using backend-provided stats data, including hourly or time-bucketed intake context derived from server endpoints.

#### Scenario: Display Hourly Chart
- **WHEN** the user views the Stats page
- **THEN** the chart components are populated from backend stats responses rather than static mock values
- **AND** rendered totals/time buckets match the backend-provided period data

### Requirement: Identify Low Intake Periods
The system SHALL identify lower-intake periods using backend analytics outputs and present those insights in the Stats interface.

#### Scenario: Identify Low Intake Periods
- **WHEN** stats data is loaded from backend endpoints
- **THEN** low-intake periods are derived from backend analytics fields (including gap-related endpoints where available)
- **THEN** the UI highlights or labels those periods without relying on hard-coded mock thresholds

## ADDED Requirements

### Requirement: Multi-Metric Stats Dashboard
The system SHALL display weekly trend, streak, best time, intake gaps, and health score using dedicated backend endpoints.

#### Scenario: Load complete stats dashboard
- **WHEN** the user opens the Stats page
- **THEN** the app requests weekly, streak, best-time, gaps, and health endpoints
- **THEN** each card/chart renders the corresponding backend metric set

#### Scenario: Empty stats fallback
- **WHEN** one or more stats endpoints return empty datasets
- **THEN** the affected card or chart shows an explicit empty-state placeholder
- **THEN** available metrics from other endpoints still render
