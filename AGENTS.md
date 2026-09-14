# AGENTS.md

## Project Context

This is a Base44 app repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup, environment variables, and publish workflow.

## Base44 References

- CLI overview: https://docs.base44.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.base44.com/developers/backend/overview/skills.md

If your agent supports Agent Skills, install or update Base44 skills before Base44-specific work:

```bash
pnpm dlx skills add base44/skills
```

## Key Files

- `src/`: Expo (React Native) application source.
- `src/lib/base44.ts`: the one Base44 SDK client.
- `app.config.ts`: Expo app config, reads env vars including the Google Maps key.
- `.env`: local-only environment values; never commit secrets.

## Working Notes

- Use `pnpm android` for the first native build and after any native change; it builds and installs the app on an emulator or device. Android needs this development build because the map screen requires the app's own Google Maps key, which Expo Go cannot load.
- Use `pnpm ios` for the first iOS build and after any native change.
- Use `pnpm start` for Metro only, once a native build is already installed, for JS-only changes.
- Use `pnpm web` for development-only checks in a browser; it is not a shipped target.
- Prefer the existing Base44 CLI workflow over adding new package.json scripts for Base44-specific tasks.
- Reuse the existing SDK client in `src/lib/base44.ts` before adding new Base44 integration paths.
- Run the relevant checks from `package.json` (`pnpm lint`, `pnpm typecheck`, `pnpm test`) before finishing code changes.
