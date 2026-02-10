## ADDED Requirements

### Requirement: Splash Screen Display
The system SHALL display a splash screen immediately upon application startup, before showing the main application interface.

#### Scenario: App Launch
- **WHEN** the application is opened
- **THEN** the splash screen is the first visible element

### Requirement: Splash Screen Visuals
The splash screen SHALL feature the application icon centered on a deep forest green background, enhanced with a "tubelight" glow animation effect and a breathing/pulsing icon animation.

#### Scenario: Animation Playback
- **WHEN** the splash screen is displayed
- **THEN** the background is #051405
- **THEN** the icon pulses rhythmically
- **THEN** a glow effect animates around or behind the icon

### Requirement: Transition to Main App
The splash screen SHALL transition to the main application view once initialization is complete and a minimum display time has elapsed.

#### Scenario: Initialization Complete
- **WHEN** the application initialization logic (including data loading) completes
- **AND** the minimum display time (e.g., 2 seconds) has passed
- **THEN** the splash screen fades out
- **THEN** the Home screen becomes visible
