# KOMIA

KOMIA is a mobile-first social app for discovering, saving, and logging restaurants in Bogota. It is built on [Base44](https://base44.com): the frontend is React and Vite in `src/`, and the backend (data models, auth, and the MIA assistant function) is defined in `base44/` and run by the Base44 platform.

This repo is the source of truth. Pushes to `main` sync into the Base44 Builder, and the app is published from the Base44 dashboard.

## Requirements

- Node.js 20.19 or newer (22.12 or newer on the 22 line), which Vite 8 requires
- pnpm 11 (`corepack enable` picks the version from `package.json`)
- The Base44 CLI: `pnpm add -g base44@latest`
- [Deno](https://docs.deno.com/runtime/getting_started/installation/), which runs the local Base44 backend

## Run locally

```bash
pnpm install
base44 login     # once per machine, opens the browser
base44 link      # once per clone, writes base44/.app.jsonc (gitignored)
base44 dev       # local backend plus the frontend
```

Open the URL that `base44 dev` prints, usually `http://localhost:5173`.

`base44 link` asks for the app id. It is in the Builder URL: `app.base44.com/apps/<id>/...`. Run `base44 link --help` for the non-interactive flags.

Things to know:

- **Do not run `pnpm dev` yourself.** `base44 dev` starts the frontend for you through `site.serveCommand` in `base44/config.jsonc`. On its own, `pnpm dev` serves a UI with no backend and every `/api` call fails. Next to `base44 dev`, a second Vite takes the next port and you end up on the wrong one.
- **The app must be published at least once** before the UI loads under `base44 dev`. On boot the frontend fetches app settings from the hosted app. Before the first publish that fails and every page redirects to login. The local API works either way.
- **Local data is in memory.** Entities, functions, and auth run locally, but entity data is wiped every time `base44 dev` restarts. Core integrations and OAuth login are forwarded to the deployed app. See the [local development overview](https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview).
- **`pnpm install` must not build `core-js`.** `pnpm-workspace.yaml` denies its build script. If you remove that, every pnpm script refuses to run until you approve or deny the build.

## Frontend against the hosted backend

To work on the UI with your app's live backend and real data:

```bash
base44 dev --remote
```

In this mode writes go to production data. Plain `base44 dev` keeps everything local.

## Checks

```bash
pnpm lint        # must pass clean
pnpm lint:fix
pnpm typecheck   # about 260 pre-existing errors from checkJs; only look at files you changed
pnpm build       # production build to dist/
```

Lint and typecheck only cover `src/pages` and `src/components` (excluding `src/components/ui`). There are no tests.

## Project layout

```
src/
  api/base44Client.js   the one SDK client every call goes through
  lib/AuthContext.jsx   boot sequence: public settings, then auth, then onboarding gate
  lib/restaurantActions.js  shared save and log-visit flows
  pages/                one file per route, wired in src/App.jsx
  components/           app components; components/ui is shadcn/ui
base44/
  config.jsonc          how base44 dev installs, builds, and serves the frontend
  entities/*.jsonc      data models with row-level security rules
  functions/miaChat/    the MIA assistant, a Deno function
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
