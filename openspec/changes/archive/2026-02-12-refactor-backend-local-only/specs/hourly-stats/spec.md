## MODIFIED Requirements

### Requirement: Hourly Intake Visualization
The system SHALL calculate and display the total volume of water consumed grouped by hour of the day (0-24h) using locally persisted intake records to help users identify their hydration patterns.

#### Scenario: Display Hourly Chart
- **WHEN** the user views the Stats page
- **THEN** an hourly bar chart or distribution graph SHALL be displayed
- **AND** it SHALL show the aggregated volume for each active hour from local persisted data

#### Scenario: Identify Low Intake Periods
- **WHEN** the hourly data is displayed
- **THEN** periods with significantly lower intake (excluding sleep hours, e.g., 23:00-06:00) SHALL be visually distinguishable or highlighted as areas for improvement

#### Scenario: Offline hourly stats availability
- **WHEN** the device is offline and the user opens the Stats page
- **THEN** the hourly visualization SHALL still be computed and rendered from local data
- **AND** no remote API dependency SHALL be required for this calculation
