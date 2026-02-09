## Why

The current application interface is hardcoded with fixed widths (`max-w-md`) and fixed element sizes (e.g., plant container `w-72`), causing it to display poorly on various mobile devices. It does not adapt to fill the screen on larger phones and may have layout issues on very small screens, failing to meet the requirement of being an adaptive Android application.

## What Changes

- Remove the global `max-w-md` width restriction from the main application container.
- Update the layout to use full width (`w-full`) and responsive sizing.
- Refactor fixed-size elements (like the plant growth visualization) to use relative or responsive units (e.g., percentages, `max-w`, `aspect-ratio`) instead of fixed pixels.
- Ensure vertical layout flexibility to handle different screen aspect ratios.

## Capabilities

### New Capabilities
<!-- Capabilities being introduced. Replace <name> with kebab-case identifier (e.g., user-auth, data-export, api-rate-limiting). Each creates specs/<name>/spec.md -->
- `adaptive-ui`: Capability for the user interface to adapt responsively to different screen sizes and aspect ratios.

### Modified Capabilities
<!-- Existing capabilities whose REQUIREMENTS are changing (not just implementation).
     Only list here if spec-level behavior changes. Each needs a delta spec file.
     Use existing spec names from openspec/specs/. Leave empty if no requirement changes. -->

## Impact

- `frontend/App.tsx`: Main container layout logic.
- `frontend/pages/HomeModern.tsx`: Plant visualization and layout structure.
- `frontend/index.html`: Confirmation of viewport settings (already correct, but part of the impact area).
- Potentially other pages if they inherit fixed constraints, though `HomeModern` is the primary target identified.
