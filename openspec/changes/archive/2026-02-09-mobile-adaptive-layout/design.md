## Context

The application currently uses a `max-w-md` fixed-width container centered on the screen, mimicking a mobile view on desktop but artificially constraining the view on actual mobile devices that might be wider or have different aspect ratios. Elements inside, specifically the plant visualization, use fixed pixel dimensions (`w-72`), which can be too large for small screens or too small for tablets/foldables.

## Goals / Non-Goals

**Goals:**
- Enable the application to use the full width of the device screen.
- Ensure the main visual element (plant) scales responsively.
- Maintain the vertical layout integrity across different screen heights.

**Non-Goals:**
- Desktop-specific dashboard layout (the target is strictly mobile devices).
- Web browser responsiveness (focus is on the Android app experience).

## Decisions

### Layout Strategy
- **Decision:** Remove `max-w-md` and `mx-auto` from `App.tsx` and allow `w-full` to govern the width.
- **Rationale:** This is the standard behavior for native mobile apps. The `max-w-md` was likely a development convenience or a web-first constraint.
- **Alternatives:** Keep `max-w-md` but increase it to `max-w-lg`. (Rejected: Artificial limits are bad for diverse Android hardware).

### Element Sizing
- **Decision:** Use Tailwind's responsive sizing for the plant container. Instead of `w-72` (18rem), use `w-[75vw]` with a `max-w-[300px]` cap.
- **Rationale:** Percentage width (`vw` or `%`) ensures it fits small screens. `max-w` prevents it from becoming comically large on tablets.
- **Alternatives:** Use media queries for specific breakpoints. (Rejected: Fluid sizing is smoother and handles the fragmentation of Android screen sizes better).

## Risks / Trade-offs

- **Risk:** Removing `max-w-md` might cause other internal elements to stretch explicitly if they were relying on the parent constraint.
  - **Mitigation:** Will verify `HomeModern` children elements (like buttons, cards) to ensure they look good at full width. Most seem to use flex/grid which should adapt well.
