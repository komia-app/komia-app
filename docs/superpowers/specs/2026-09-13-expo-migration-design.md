# KOMIA on Expo: migration design

Date: 2026-09-13
Branch: `expo-migration`
Status: approved in discussion, awaiting written review

## Goal

Replace the React and Vite frontend in `src/` with an Expo app that ships to iOS and Android. The Base44 backend in `base44/` stays as it is and the app talks to it over HTTP through the existing SDK. Web is a development convenience only; it must boot, but it is not a product target and gets no polish.

## Decisions already made

| Topic | Decision |
|---|---|
| Migration style | Clean rewrite, screen by screen. No webview or DOM-component shell stage. |
| Where the app lives | Same repo. The Expo app replaces `src/` and the root frontend config. |
| Branch | All work on `expo-migration`, merged to `main` by the owner. |
| Language | TypeScript. |
| Styling | Colocated `StyleSheet.create` at the bottom of each file, tokens from `src/theme.ts`. No Tailwind, NativeWind, Uniwind, or Unistyles. |
| Look and feel | Native redesign that keeps the brand colours, copy, and flows. Expo UI first, React Native primitives for custom layouts. |
| Expo version | SDK 57 (React Native 0.86, React 19.2, react-native-web 0.21). Node 22.13 or newer. |
| Maps | `react-native-maps`: Apple Maps on iOS, Google Maps on Android. Web renders a list stand-in. |
| Package manager | pnpm, with `node-linker=hoisted` in `.npmrc`. |

## Out of scope

- The OAuth consent page (`OAuthConsent.jsx`). It serves the Base44 MCP browser flow and has no meaning inside a native app.
- The 404 page. Unknown routes fall back to the map tab.
- Dark mode. The theme file is structured so it can be added later.
- A store release. `eas.json` is written, but no build is run as part of this work.
- Any backend change. Entities, RLS, and the `miaChat` function are untouched.

## 1. Project layout

```
app.config.ts               Expo config, reads env vars
eas.json                    EAS build profiles: development, preview, production
tsconfig.json               extends expo/tsconfig.base, "@/*" -> "./src/*"
eslint.config.js            eslint-config-expo
.npmrc                      node-linker=hoisted
src/
  app/                      routes only, one file per route
  screens/                  screen bodies, one folder per screen
  components/               shared UI: restaurant-card, rating-stars, brand-mark, chip, empty-state, screen-loader
  features/
    auth/                   session store, auth provider, native Google login
    restaurants/            queries, mutations, save and log-visit actions
    mia/                    chat hook and message types
  lib/base44.ts             the one SDK client
  theme.ts                  colours, spacing, radii, type scale
  types/entities.ts         Restaurant, RestaurantLog, SavedList, ListItem, Follow, Recommendation, User
assets/                     icon, splash, adaptive icon
```

Rules:

- `src/app` holds routes only. Nothing else goes there, because every file becomes a route.
- File names are kebab-case.
- A screen's private components live inside its folder under `src/screens/<name>/`.
- Platform differences use file extensions (`map.web.tsx`) with identical props, never inline `Platform.OS` branches larger than a line or two. Route files never get platform extensions; the split happens in `screens/` or `components/`.
- `features/` groups data code by domain. It replaces `lib/AuthContext.jsx`, `lib/restaurantActions.js`, and the per-page `useEffect` fetches.

## 2. Navigation

```
src/app/
  _layout.tsx               providers and the auth gate
  (auth)/
    _layout.tsx             plain stack, no tabs
    login.tsx
    register.tsx
    forgot-password.tsx
    reset-password.tsx
  onboarding.tsx            full screen, shown until user.onboarding_completed is true
  (tabs)/
    _layout.tsx             NativeTabs: Map, Search, My logs, Profile
    (map,search,lists,profile)/
      _layout.tsx           shared Stack so every tab can push the detail screens
      map.tsx
      search.tsx
      lists.tsx
      profile.tsx
      restaurant/[id].tsx
      log/[id].tsx
  mia.tsx                   MIA chat, presented as a form sheet from any tab
```

- The root layout wraps everything in the TanStack Query provider and the session provider, then renders the auth gate. The gate has the same three states as today's `App.jsx`, in the same order: no session renders `(auth)`, a session with `onboarding_completed` false renders `onboarding`, otherwise `(tabs)`. Auth errors of type `user_not_registered` render a dedicated message screen inside `(auth)`.
- Tabs use `NativeTabs` from `expo-router/unstable-native-tabs`. Icons are SF Symbols on iOS and Material Symbols on Android. The tab bar is the platform bar tinted with the brand colours; the custom navy bar from `MobileLayout.jsx` is not recreated.
- The shared group `(map,search,lists,profile)` defines one stack that serves all four tabs, so `restaurant/[id]` and `log/[id]` push on top of whichever tab is active with the native back gesture.
- MIA is a route presented as a form sheet (`presentation: "formSheet"`, half and full detents), opened from a header button on each tab. The floating button from `MiaFab.jsx` is not recreated.
- Typed routes are on, so `href` values are checked by TypeScript.

## 3. Data and auth

### SDK client

`src/lib/base44.ts` calls `createClient` once with an absolute `serverUrl`, because there is no Vite proxy on a device. Env vars:

| Old | New |
|---|---|
| `VITE_BASE44_APP_ID` | `EXPO_PUBLIC_BASE44_APP_ID` |
| `VITE_BASE44_APP_BASE_URL` | `EXPO_PUBLIC_BASE44_APP_BASE_URL` |
| `VITE_BASE44_FUNCTIONS_VERSION` | `EXPO_PUBLIC_BASE44_FUNCTIONS_VERSION` |

Entity, function, and app calls go through axios inside the SDK and need no change.

### Session store

The SDK's token handling is browser-only: it reads the token from the URL and `localStorage` and redirects with `window.location`. The app owns the token instead.

- `features/auth/session.ts` exposes `getToken`, `setToken`, `clearToken`. Native uses `expo-secure-store`; web uses `localStorage` through a `session.web.ts` variant.
- On boot the root layout reads the token, calls `base44.auth.setToken(token, false)` so the SDK never writes to storage itself, calls `base44.app.getPublicSettings()`, then `base44.auth.me()`. The user object lives in the session provider and is exposed by `useSession()`.
- A 401 or 403 from `me()` clears the session and shows `(auth)`.

### Email login and register

`loginViaEmailPassword` and `register` already return `access_token` and `user`. The screen stores the token, sets it on the client, and updates the session; the gate re-renders. There is no redirect and no `returnTo` handling.

### Google login

`loginWithProvider` builds its redirect from `window.location.origin` and cannot run on native. The app builds the same URL the SDK builds (`<appBaseUrl>/api/apps/auth/login?app_id=<id>&from_url=<return>`), opens it with `expo-web-browser`'s `openAuthSessionAsync`, and expects to return on `komia://auth?access_token=<token>`.

This is a spike at step 3 of the build order. Outcome (spike run on 2026-09-13): Provisional, no Google account available to the agent: A, curl probes of `/api/apps/auth/login` with `from_url=komia://auth` and `from_url=https://base44.app/` both redirect through `app.base44.com` to the same `accounts.google.com/o/oauth2/v2/auth` URL (the custom scheme is carried through unchanged in the OAuth `state`), and on the Android emulator tapping "Continue with Google" opened a Chrome custom tab that reached the real Google "Sign in to continue to base44.com" page; cancelling the tab returned the app to the login screen without a crash. The final hop back through `komia://auth?access_token=...` was not observed end to end because no Google account was available to complete the sign-in.

- If Base44 accepts a non-web `from_url`, the deep link is the whole flow.
- If it does not, the web export keeps a `/auth/native` route that reads `access_token` from the query and redirects to `komia://auth?access_token=<token>`. That web export stays published to Base44, which it must anyway for `getPublicSettings`.
- If neither works, the Google button is left out and email login is the only path. That is a product decision to raise with the owner, not a silent omission.

### Logout

Clears the session store and the client header, then sends a plain request to `<appBaseUrl>/api/apps/auth/logout` instead of a page redirect.

### Data fetching

TanStack Query, already a dependency, is used for real:

- Reads: `useRestaurants()`, `useRestaurant(id)`, `useMyLogs()`, `useLog(id)`, `useMyLists()`.
- Mutations: `useSaveRestaurant()` and `useLogVisit()`, mirroring today's `saveRestaurant` and `logVisit`. They take the user id from the session instead of calling `auth.me()` each time, and invalidate the affected query keys.
- Query keys are defined in one place per feature.
- The catalog query is shared by the map, search, and detail screens, so restaurants are fetched once per app session.

### Types

`src/types/entities.ts` is written by hand from the JSON schemas in `base44/entities/*.jsonc`. Adding a field still means editing the entity file first, then the type.

## 4. Screens

| Screen | Native shape |
|---|---|
| Login, Register, Forgot password, Reset password | Stack screens. React Native `TextInput` inside a labelled field component (Expo UI's `TextInput` uses a worklet-driven observable value, which is more than a plain form needs), Expo UI `Button`. Google button only on the paths the spike confirms. |
| User not registered | Message screen inside `(auth)` with a logout button. |
| Onboarding | Seven-step pager in a stack with a progress bar in the header. `chip-select`, `rank-select` (tap options in order to rank, tap a ranked item to remove), and `scale-select` stay custom components because Expo UI has no chip or rank primitive. Submits `updateMe` with `onboarding_completed: true`, same payload as today. |
| Map | `react-native-maps` full-bleed under a transparent header with `Stack.SearchBar` filtering pins by name, neighbourhood, cuisine, and tag. Device position from `expo-location`, falling back to the Bogota centre. Tapping a pin opens an Expo UI `BottomSheet` with the restaurant card, save, log-visit, and a link to the detail screen. `map.web.tsx` renders the same data as a plain list. |
| Search | `Stack.SearchBar` plus a `FlatList` of `restaurant-card`. Replaces today's stub. |
| My logs | `FlatList` of logs grouped by visit date, pull to refresh, empty state. |
| Profile | Expo UI `List` rows: taste profile summary (from `computeTasteProfile`), edit profile, logout. Edit profile is a form sheet. |
| Restaurant detail | Large-title stack screen, hero image, `List` rows for address, cuisines, and price. Save and log-visit as header buttons. Log visit is a form sheet with an Expo UI `Slider` for rating and a `TextInput` for the review. |
| Log detail | Same shape as restaurant detail, read only. |
| MIA chat | Form sheet. Inverted `FlatList` of bubbles, sticky composer, suggestion chips above the composer. Calls `base44.functions.invoke("miaChat", ...)` with the same payload as today. |

Shared components: `restaurant-card`, `rating-stars`, `brand-mark`, `chip`, `empty-state`, `screen-loader`. Icons use Expo Router's `sf` and `md` props where a tab or header takes them, and `expo-symbols` with a Material fallback elsewhere. `lucide-react` is removed.

Theme: `src/theme.ts` holds the brand navy `#10375C`, yellow `#F3C623`, the MIA orange `#EB8317`, the light surface greys, a spacing scale, a radius scale, and a type scale. Screens read tokens; hex literals do not appear in screen files.

## 5. Platform config and tooling

### Expo config

`app.config.ts`, not static `app.json`, so it can read env vars.

- Name KOMIA, slug `komia`, scheme `komia`, portrait only.
- iOS bundle id and Android package `co.komia.app`. Both are placeholders to confirm before the first store build.
- iOS location usage description and Android location permissions for the map.
- Plugins: `expo-router`, `expo-secure-store`, `expo-web-browser`, `expo-location`, `react-native-maps` (Android Google Maps key from `GOOGLE_MAPS_ANDROID_API_KEY`), `expo-splash-screen`, `expo-font`.
- Web: Metro bundler, `output: "single"`.
- New Architecture on (SDK 57 default).
- Typed routes on.

### EAS

`eas.json` with `development` (dev client, internal), `preview` (internal, APK and ad-hoc iOS), and `production` (store). Expo Go is enough for development because nothing in this design needs a custom native module.

### Scripts

```
start        expo start
ios          expo start --ios
android      expo start --android
web          expo start --web
lint         expo lint
typecheck    tsc --noEmit
test         jest
```

### Base44 site config

`base44/config.jsonc` becomes:

```
installCommand  pnpm install
buildCommand    pnpm exec expo export --platform web
serveCommand    pnpm web
outputDirectory ./dist
```

This keeps a web build published to Base44 for `getPublicSettings` and for the Google login bridge if it is needed.

### Gates

- `pnpm lint` must pass clean, covering all of `src/`.
- `pnpm typecheck` must pass clean. The old advisory status ends with the old code.
- `pnpm test` must pass.

### Removed

`vite.config.js`, `index.html`, `tailwind.config.js`, `postcss.config.js`, `jsconfig.json`, `src/index.css`, `src/components/ui`, `src/main.jsx`, `src/App.jsx`, every page and component under the old `src/`, and the dependencies they pulled in: Vite, the Base44 Vite plugin, Tailwind, Radix, shadcn helpers, react-router, framer-motion, leaflet, react-leaflet, lucide-react, recharts, three, jspdf, html2canvas, react-quill, embla, vaul, sonner, react-hot-toast, moment, lodash, and the rest of the unused list. Kept: `@base44/sdk`, `@tanstack/react-query`, `date-fns`, `zod` if a form needs it.

## 6. Verification

There is no test suite today. The port is verified by running: each screen on the iOS simulator and an Android emulator through Expo Go, compared with the running web original for content and behaviour, not pixels. Web is checked only for booting.

Unit tests with `jest-expo` cover the pure logic: the session store, `computeTasteProfile`, the query keys, and the save and log-visit mutation payloads.

## 7. Build order

Each step is a separate commit and the app runs at the end of each.

1. Scaffold: Expo app in place of the Vite app, theme, types, SDK client, empty routes, tooling. Boots to an empty tab bar on iOS, Android, and web.
2. Session store, auth gate, email login and register, forgot and reset password, user-not-registered screen.
3. Google login spike. Outcome written into section 3 of this document; bridge route added only if needed.
4. Map tab with pins, search bar, and the detail sheet.
5. Restaurant detail, save, and the log-visit sheet.
6. My logs tab and log detail.
7. Profile tab and edit-profile sheet.
8. Onboarding flow.
9. Search tab.
10. MIA chat sheet.
11. Remove the last Vite leftovers, update README, CLAUDE.md, and AGENTS.md, set the Base44 build command.

## Open items

- Google login on native (spike, step 3).
- Confirm bundle id and package name before the first EAS build.
- Confirm whether the owner wants Google Maps on iOS for identical tiles across platforms. Default is Apple Maps on iOS.
