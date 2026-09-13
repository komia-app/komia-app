# KOMIA

KOMIA is a mobile-first social app for discovering, saving, and logging restaurants in Bogota. It is built on [Base44](https://base44.com): the frontend is an Expo app in `src/`, and the backend (data models, auth, and the MIA assistant function) is defined in `base44/` and run by the Base44 platform.

This repo is the source of truth. Pushes to `main` sync into the Base44 Builder, and the app is published from the Base44 dashboard.

## Requirements

- Node.js 22.13 or newer
- pnpm 11 (`corepack enable` picks the version from `package.json`)
- For iOS: Xcode with a simulator, or Expo Go on a device
- For Android: Android Studio with an emulator, or Expo Go on a device

## Run locally

```bash
pnpm install
cp .env.example .env   # fill in the Base44 values
pnpm ios               # or pnpm android, or pnpm web
```

The app talks to the hosted Base44 backend directly. There is no local backend in this setup; `base44 dev` is not used by the Expo app.

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
