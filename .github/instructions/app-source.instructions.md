---
applyTo: "src/**/*.{ts,tsx}"
---

# App source review rules

- Hooks that need the signed-in user call `useCurrentUser()` and handle `null`; flag a non-null assertion on it.
- Query keys come from `src/features/restaurants/keys.ts`. A mutation that writes an entity must invalidate the matching key on success.
- Platform differences larger than a line or two go in a platform file (`name.android.tsx`, `name.web.tsx`) with identical exports, not in an inline `Platform.OS` branch.
- Imports from `@expo/ui/swift-ui` or `@expo/ui/jetpack-compose` are allowed only in platform-specific files.
- The temporary gate bypass (`const onboarded = signedIn;` in `src/app/_layout.tsx`) must never be committed.
- `console.log` and `console.error` do not belong in committed code; use an alert or the existing error paths.
- New copy shown to users must be free of emojis and of raw markdown markers.
- Tests live next to the file they cover and test behaviour of pure functions; screens are verified by running the app, so do not ask for snapshot tests.
