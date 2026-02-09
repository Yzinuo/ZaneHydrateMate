## ADDED Requirements

### Requirement: Hourly Intake Visualization
The system SHALL calculate and display the total volume of water consumed grouped by hour of the day (0-24h) to help users identify their hydration patterns.

#### Scenario: Display Hourly Chart
- **WHEN** the user views the Stats page
- **THEN** an hourly bar chart or distribution graph SHALL be displayed
- **AND** it SHALL show the aggregated volume for each active hour

#### Scenario: Identify Low Intake Periods
- **WHEN** the hourly data is displayed
- **THEN** periods with significantly lower intake (excluding sleep hours, e.g., 23:00-06:00) SHALL be visually distinguishable or highlighted as areas for improvement
