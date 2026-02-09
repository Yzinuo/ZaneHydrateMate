# Adaptive UI Specification

## Purpose
Defines requirements for the application's responsive behavior across different screen sizes and devices.

## Requirements

### Requirement: Responsive Layout
The application layout SHALL automatically adjust to fit the full width and height of the user's device screen, regardless of the device's dimensions or aspect ratio.

#### Scenario: Full Width on Mobile
- **WHEN** the application is viewed on a mobile device (e.g., width > 320px)
- **THEN** the main container SHALL expand to fill 100% of the available screen width
- **AND** there SHALL NOT be fixed margins restricting the width (like `max-w-md`)

### Requirement: Adaptive Element Sizing
Key visual elements, such as the plant growth visualization, SHALL resize proportionally to the screen width to avoid overflow on small screens and utilize space on larger screens.

#### Scenario: Plant Container Sizing
- **WHEN** the screen width changes (e.g., different device models)
- **THEN** the plant visualization container SHALL occupy a proportional width (e.g., 75% of screen width) or a responsive constraint (max-width)
- **AND** it SHALL maintain its aspect ratio to prevent distortion
