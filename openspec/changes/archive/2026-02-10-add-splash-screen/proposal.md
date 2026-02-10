## Why

The application currently loads directly into the main view, which can feel abrupt and unpolished, especially while initial data is being fetched. Adding a splash screen will enhance the perceived performance, provide a smoother entry experience, and align with the "Forest/Nature" aesthetic of the application.

## What Changes

*   Introduce a new `SplashScreen` component with a "Tubelight" glow animation effect.
*   Implement a conditional rendering logic in the main `App` component to show the splash screen during initialization.
*   Add `framer-motion` for complex animations.
*   Add `clsx` and `tailwind-merge` for robust class name handling.
*   Integrate the application icon into the splash screen.

## Capabilities

### New Capabilities
- `app-initialization`: Handles the application startup sequence, splash screen display, and transition to the main application state.

### Modified Capabilities
<!-- Existing capabilities whose REQUIREMENTS are changing (not just implementation).
     Only list here if spec-level behavior changes. Each needs a delta spec file.
     Use existing spec names from openspec/specs/. Leave empty if no requirement changes. -->

## Impact

*   **Frontend**:
    *   New component: `frontend/components/SplashScreen.tsx`
    *   Modified: `frontend/App.tsx` (state management for loading)
    *   New dependencies: `framer-motion`, `clsx`, `tailwind-merge`
    *   New utility: `frontend/lib/utils.ts`
