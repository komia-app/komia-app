# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Also follow `AGENTS.md`. Where `AGENTS.md` and `README.md` disagree on how to run the app locally, `README.md` is right: never run `pnpm dev` by hand, use `base44 dev` (local backend) or `base44 dev --remote` (hosted backend, writes to production data).

## What this is

KOMIA is a mobile-first social restaurant discovery app for Bogota, built on Base44. The code was exported from the Base44 Builder and lives here; pushes to `main` sync back to Base44, and publishing happens from the Base44 dashboard, not from `base44 deploy`.

## Commands

Package manager is pnpm 11 (`packageManager` in `package.json`). Do not use npm.

```bash
pnpm install          # core-js build script is denied in pnpm-workspace.yaml; keep it that way or scripts refuse to run
pnpm build            # vite build to dist/
pnpm lint             # eslint, must pass clean; this is the gate
pnpm lint:fix
pnpm typecheck        # tsc with checkJs; ~260 pre-existing errors, not a gate, only look at errors in files you touched
base44 dev            # local backend + frontend (needs Base44 CLI, Deno, base44 login, base44 link)
```

There are no tests in this repo.

Lint and typecheck only cover `src/components/**` (excluding `ui/`) and `src/pages/**`. `src/lib`, `src/api`, and `src/components/ui` are excluded from both, so errors there will not be caught by the checks.

## Architecture

### Two halves: frontend in `src/`, backend definition in `base44/`

- `base44/entities/*.jsonc` are the data models (`Restaurant`, `RestaurantLog`, `SavedList`, `ListItem`, `Follow`, `Recommendation`, `User`). Each is a JSON schema plus an `rls` block. RLS is the only access control: most entities allow a row's owner (`data.user_id == user.id`) or an admin; `Restaurant` is read-anyone, write-admin-only. Adding a field means editing the entity file, not just the frontend.
- `base44/functions/<name>/entry.ts` are Deno backend functions. There is one, `miaChat`, the MIA assistant. It authenticates with `createClientFromRequest(req)`, loads the user's logs, saved items, and the restaurant catalog, and builds an LLM prompt from them. The frontend calls it via `base44.functions.invoke("miaChat", ...)` from `MiaChat.jsx`.
- `base44/config.jsonc` tells `base44 dev` how to install, build, and serve the frontend. `base44/.app.jsonc` (app id) is gitignored and created by `base44 link`.

### Frontend data access

All backend access goes through the single SDK client in `src/api/base44Client.js`, configured from Vite env vars via `src/lib/app-params.js`. Pages and helpers call `base44.entities.<Entity>.list/filter/get/create` and `base44.auth.me/updateMe` directly inside `useEffect` with `useState`. TanStack Query is wired in `App.jsx` but nothing uses it yet; follow the existing direct-call pattern unless you are deliberately migrating.

Shared write flows live in `src/lib/restaurantActions.js` (`saveRestaurant` creates the default "Want to try" list on first save; `logVisit` creates a `RestaurantLog`). Reuse these rather than re-creating entities inline in pages.

### Auth and routing

`src/lib/AuthContext.jsx` runs on boot: it fetches app public settings from the hosted app, then `base44.auth.me()`. `App.jsx` gates everything on that: loading spinner, then `UserNotRegisteredError` or redirect to login on auth errors, then forced `Onboarding` if `user.onboarding_completed` is false, then the routes. Because public settings come from the hosted app, the UI will not load under `base44 dev` until the app has been published at least once.

Routes are in `App.jsx`. Authenticated pages render inside `MobileLayout` (header, bottom tab bar for Map/Search/My logs/Profile, and the MIA floating button). Auth pages (`Login`, `Register`, `ForgotPassword`, `ResetPassword`) sit outside it.

### UI

shadcn/ui (new-york style, JSX not TSX) in `src/components/ui/`, Tailwind with CSS-variable theme tokens in `src/index.css`, icons from `lucide-react`. Brand colours are hard-coded in pages as hex (`#10375C` navy, `#F3C623` yellow) rather than through the theme tokens. The map is react-leaflet with a custom `divIcon` pin in `MapPage.jsx`; `leaflet` is a direct dependency because pnpm does not hoist it.

`@/` resolves to `src/` (see `jsconfig.json`).
