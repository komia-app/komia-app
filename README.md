# KOMIA

KOMIA is a mobile-first social app for discovering, saving, and logging restaurants in Bogota. It is built on [Base44](https://base44.com): the frontend is an Expo (React Native) app in `src/`, and the backend (data models, auth, and the MIA assistant function) is defined in `base44/` and run by the Base44 platform.

This repo is the source of truth. Pushes to `main` sync into the Base44 Builder, and the app is published from the Base44 dashboard.

## Requirements

- Node.js 22.13 or newer
- pnpm 11 (`corepack enable` picks the version from `package.json`)
- Android Studio with an emulator, and a Google Maps Android API key (see below)
- Xcode with a simulator, for iOS

## Run locally

```bash
pnpm install
cp .env.example .env   # fill in the Base44 values and the Google Maps key
```

Android needs a Google Maps API key in `.env` as `GOOGLE_MAPS_ANDROID_API_KEY`, because the map screen uses the app's own key. Expo Go cannot load that key, so Android always needs a development build:

```bash
pnpm android   # first native build, and again after any native change (new package, config change)
pnpm start     # Metro only, for JS-only changes, once the build above is installed
```

iOS:

```bash
pnpm ios
```

Web is development-only, for quick checks, not a shipped target:

```bash
pnpm web
```

## Checks

```bash
pnpm lint       # eslint, must pass clean
pnpm typecheck  # tsc --noEmit, must pass clean
pnpm test       # jest
```

## Project layout

```
app.config.ts               Expo config, reads env vars
eas.json                    EAS build profiles: development, preview, production
tsconfig.json               extends expo/tsconfig.base, "@/*" -> "./src/*"
eslint.config.js            eslint-config-expo
src/
  app/                      routes only, one file per route
  screens/                  screen bodies, one folder per screen
  components/               shared UI: restaurant-card, rating-stars, brand-mark, screen-loader, text-field
  features/
    auth/                   session store, session provider, native Google login
    restaurants/            queries, mutations, save and log-visit actions
    profile/                taste profile, profile mutations
    onboarding/             onboarding steps
    mia/                    chat hook and message types
  lib/base44.ts             the one SDK client
  theme.ts                  colours, spacing, radii, type scale
  types/entities.ts         Restaurant, RestaurantLog, SavedList, ListItem, Follow, Recommendation, User
assets/                     icon, splash, adaptive icon
base44/                     backend definition: entities, the miaChat function, app config
```

## Publish

Push to git, then publish from the dashboard:

```bash
base44 dashboard open
```

Do not use `base44 deploy`. It ships your local tree directly, skips the git sync, and leaves the deployed app out of step with the repo.

## Docs

- [Base44 CLI reference](https://docs.base44.com/developers/references/cli/commands/introduction)
- [GitHub integration](https://docs.base44.com/developers/app-code/local-development/github)
- [Local development](https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview)
- [Support](https://app.base44.com/support)
