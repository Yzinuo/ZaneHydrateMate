## Context

The application currently initializes directly into the main view. This can result in a jarring user experience if data fetching causes layout shifts or if the initial UI render is heavy. A splash screen provides a necessary buffer and an opportunity to establish the application's brand identity immediately.

## Goals / Non-Goals

**Goals:**
*   Implement a visually appealing splash screen with "Tubelight" animations.
*   Ensure smooth transition from splash screen to the main application.
*   Introduce standard utility patterns (`cn`) for styling.
*   Manage initial loading state effectively.

**Non-Goals:**
*   Complex global state management for loading (local state in App is sufficient).
*   Offline-first asset caching (beyond standard browser caching).

## Decisions

### Animation Library: Framer Motion
*   **Decision:** Use `framer-motion` for the splash screen animations.
*   **Rationale:** It provides robust physics-based animation primitives (springs) and layout transitions that are difficult to implement with CSS alone, essential for the "Tubelight" feel.
*   **Alternatives:** CSS Animations (too rigid for the desired feel), React Spring (good, but Framer Motion has better layout projection).

### Style Utilities: clsx + tailwind-merge
*   **Decision:** Implement a `cn` utility function.
*   **Rationale:** Allows for conditional class application and safe merging of Tailwind classes, preventing conflicts and improving code readability.

### State Management: Local State
*   **Decision:** Use a simple `isLoading` state in `App.tsx` combined with a `useEffect` for the timeout.
*   **Rationale:** The loading logic is simple (time-based + potential future data fetch). No need for Redux or Context API for this specific feature yet.

## Risks / Trade-offs

*   **Risk:** Increased bundle size due to `framer-motion`.
    *   **Mitigation:** `framer-motion` is tree-shakeable. We will import only what we need. The visual quality improvement justifies the size cost for a consumer-facing app.
*   **Risk:** Splash screen appearing for too short a time if data loads instantly.
    *   **Mitigation:** Enforce a minimum display time (e.g., 2000ms) to ensure the animation plays fully and the experience feels intentional.
