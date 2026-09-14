# KOMIA review instructions

## Purpose

KOMIA is an Expo SDK 57 app (TypeScript, Expo Router, TanStack Query) for iOS and Android, backed by Base44. The frontend lives in `src/`; the backend definition lives in `base44/` and is edited rarely. Use these rules when reviewing pull requests. Focus on correctness and the project's conventions; skip style comments that a formatter or linter would catch.

## What to check first

- Secrets: no API keys, tokens, passwords, or account credentials in any committed file. They belong only in the git-ignored `.env`.
- Gates: a change that touches `src/` must keep `pnpm lint`, `pnpm typecheck`, and `pnpm test` clean. Flag new tests that assert nothing or that only exercise mocks.
- Session handling: the auth token is read from secure storage and set on the SDK with `setToken(token, false)`. Flag any code that writes the token to `localStorage`, logs it, or puts it in a URL the app builds.
- Error paths: every `await` on a network call inside a screen must be inside a try/catch or handled by a mutation, and the user must see an alert or inline message on failure. Flag unhandled promise rejections.
- Base44 reads: entity `list` and `filter` calls default to 50 rows. Flag reads that omit the explicit row limit from `PAGE_LIMIT`.

## Project conventions

- `src/app` holds route files only. A route file imports a screen from `src/screens` and renders it; flag logic or styles inside `src/app`.
- Screen bodies live in `src/screens/<name>/`, shared UI in `src/components/`, data and pure logic in `src/features/<domain>/` with colocated tests.
- File names are kebab-case.
- Styles use `StyleSheet.create` at the bottom of the file. Colours, spacing, radii, and type sizes come from `src/theme.ts`; flag hex colour literals anywhere except `src/theme.ts` and `app.config.ts`.
- Entity types in `src/types/entities.ts` mirror `base44/entities/*.jsonc`. A new field needs both.
- Expo UI `Button` takes its text through the `label` prop; a string child crashes on Android.
- Dates from the backend are plain calendar dates (`YYYY-MM-DD`) and are parsed as local time, never through `Date.parse` or `toISOString`.
- No emojis in code, copy, commit messages, or docs.
- Plain language in docs and comments.

## Commits

- One logical change per commit, imperative subject line, no trailers.
- Flag a commit that mixes a refactor with a behaviour change.

## Do not comment on

- Import ordering or formatting that `expo lint` already enforces.
- Generated folders: `ios/`, `android/`, `.expo/`, `graft/`.
- Files under `docs/superpowers/`, which are planning records.
