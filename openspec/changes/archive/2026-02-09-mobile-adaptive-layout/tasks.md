## 1. App Container Layout

- [x] 1.1 Remove `max-w-md` and `mx-auto` from `frontend/App.tsx` main container.
- [x] 1.2 Verify `w-full` is present and effectively filling the screen.
- [x] 1.3 Check `index.html` viewport settings (verify `width=device-width`).

## 2. Home Screen Adaptation

- [x] 2.1 Refactor `frontend/pages/HomeModern.tsx` plant container to use responsive width (e.g., `w-[75vw] max-w-[320px]`) instead of fixed `w-72`.
- [x] 2.2 Ensure the aspect ratio of the plant container is preserved.
- [x] 2.3 Verify other elements (stats cards, drink buttons) in `HomeModern.tsx` adapt gracefully to wider/narrower screens.
