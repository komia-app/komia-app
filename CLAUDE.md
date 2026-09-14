# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Also follow `AGENTS.md`. `README.md` is right on how to run the app locally: use `pnpm android`, `pnpm ios`, `pnpm start`, or `pnpm web`, never a local Base44 backend for the frontend.

## What this is

KOMIA is a mobile-first social restaurant discovery app for Bogota. The frontend is an Expo (React Native) app in `src/`, built with Expo Router. The backend (data models, auth, and the MIA assistant function) is defined in `base44/` and run by the Base44 platform; pushes to `main` sync back to Base44, and publishing happens from the Base44 dashboard, not from `base44 deploy`.

## Commands

Package manager is pnpm 11 (`packageManager` in `package.json`). Do not use npm.

```bash
pnpm install    # installs dependencies
pnpm android    # native build plus install on an emulator or device; needed for the first run and after any native change
pnpm ios        # native build plus install on the iOS simulator
pnpm start      # Metro only, for an already installed build
pnpm web        # development-only, not a shipped target
pnpm lint       # eslint, must pass clean; this is a gate
pnpm typecheck  # tsc --noEmit, must pass clean; this is a gate
pnpm test       # jest; must pass; this is a gate
```

Android needs a development build, not Expo Go, because the map screen uses the app's own Google Maps API key and Expo Go cannot load it.

Never use emojis in code, comments, commit messages, or anywhere else in this repo.

## Architecture

### Two halves: frontend in `src/`, backend definition in `base44/`

- `base44/entities/*.jsonc` are the data models (`Restaurant`, `RestaurantLog`, `SavedList`, `ListItem`, `Follow`, `Recommendation`, `User`). Each is a JSON schema plus an `rls` block. RLS is the only access control: most entities allow a row's owner (`data.user_id == user.id`) or an admin; `Restaurant` is read-anyone, write-admin-only. Adding a field means editing the entity file, not just the frontend.
- `base44/functions/<name>/entry.ts` are Deno backend functions. There is one, `miaChat`, the MIA assistant. It authenticates with `createClientFromRequest(req)`, loads the user's logs, saved items, and the restaurant catalog, and builds an LLM prompt from them. The frontend calls it via `base44.functions.invoke("miaChat", ...)` from `src/features/mia`.
- `base44/config.jsonc` tells the Base44 platform how to build and serve the app. `base44/.app.jsonc` (app id) is gitignored and created by `base44 link`.

### Routes, screens, and features

- `src/app/` holds routes only, one file per route, using Expo Router's file-based conventions (route groups in parentheses, dynamic segments in brackets). Nothing else goes there.
- `src/app/_layout.tsx` wraps the app in the TanStack Query provider and the session provider, then renders the auth gate: no session shows `(auth)`, a session with `onboarding_completed` false shows `onboarding`, otherwise `(tabs)`.
- `(tabs)` is a `NativeTabs` layout (Map, My logs, Profile, Search) built on a shared stack group so the restaurant and log detail screens push over whichever tab is active.
- `mia`, `log-visit`, and `edit-profile` are routes presented as form sheets from within the authenticated stack.
- A route file stays thin: it renders the matching screen from `src/screens/<name>/`, where the screen's actual body and any screen-private components live.
- `src/features/` groups data code by domain: `auth` (session store, session provider, native Google login), `restaurants` (queries, mutations, save and log-visit actions), `profile`, `onboarding`, `mia`.

### Session and data

- `src/features/auth/session-provider.tsx` owns the session state machine (`loading`, `signed-out`, `signed-in`) and exposes it through `useSession()` and `useCurrentUser()`. On boot it reads the stored token, sets it on the SDK client with `base44.auth.setToken(token, false)`, fetches public settings, then calls `base44.auth.me()`. A rejected token clears the session; an outage or offline boot keeps it so the next launch can retry.
- The token itself lives in `src/features/auth/session-store.ts` (native, via `expo-secure-store`) or `session-store.web.ts` (web, via `localStorage`). The SDK never writes to storage itself.
- All backend access goes through the single SDK client in `src/lib/base44.ts`, configured from `EXPO_PUBLIC_*` env vars.
- Data fetching goes through TanStack Query: reads and mutations live in `src/features/<domain>/queries.ts` and `mutations.ts`, with query keys defined once per feature. Do not call `base44.entities.*` directly from a screen.

### UI

Expo UI (`@expo/ui`) provides native controls: `BottomSheet`, `List`, sliders, and form sheets, backed by SwiftUI on iOS and Jetpack Compose on Android. Reach for it before any React Native community picker or bottom-sheet library. `src/theme.ts` holds the brand colours (`#10375C` navy, `#F3C623` yellow, `#EB8317` MIA orange), spacing, radii, and type scale; screens read tokens, hex literals do not appear in screen files. Icons come from `expo-symbols` (SF Symbols on iOS, Material Symbols on Android) and `@expo/vector-icons`.

`@/` resolves to `src/` (see `tsconfig.json`).

## Test account

A KOMIA test account for running the app end to end lives in the git-ignored `.env` as `KOMIA_TEST_EMAIL` and `KOMIA_TEST_PASSWORD` (`.env.example` lists the keys). Read them from `.env` when you need to log in on a simulator or on web. Never paste the values into a file that is committed, a commit message, a report that leaves the machine, or chat. The account is real data on the hosted backend: do not log it out on a device the owner is using, and do not delete its logs or lists.

### How to talk to the user

Please remove all mannered prose.