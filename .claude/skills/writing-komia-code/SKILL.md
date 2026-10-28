---
name: writing-komia-code
description: Use when writing, changing, or refactoring any code in the KOMIA repo - screens, routes, components, hooks, queries, mutations, entity schemas, backend functions, tests, or app config - before the first edit.
---

# Writing KOMIA code

The rules for this repo are in `docs/code-standards.md`. Each one has
an id (`DATA-2`, `UI-4`). Read the whole file before the first edit, and
follow every rule for the files you touch.

## Before the first edit

1. Read `docs/code-standards.md`.
2. Find the closest existing example and copy its shape. For a screen, read
   `src/screens/my-logs/index.tsx`. For data code, read
   `src/features/restaurants/keys.ts`, `queries.ts`, and `mutations.ts`. For a
   field, read `src/types/entities.ts` and the entity file in
   `base44/entities/`.
3. Check whether a hook, component, or helper already does what you need
   before writing a new one.

## Rules agents miss most

Agents that follow CLAUDE.md still break these. Check each one before you
finish.

- React Compiler is on. Do not add `useMemo`, `useCallback`, or `React.memo`,
  even though older screens use `useMemo` (RCT-1). Compute derived lists in
  render.
- A screen that reads data shows an error state with a retry, not only a
  loader and an empty message (RCT-4).
- Every `Pressable` sets `accessibilityRole`, including one wrapped in
  `<Link asChild>`. Icon-only ones also set `accessibilityLabel` (A11Y-1).
- Every image sets `accessibilityLabel` or `accessible={false}` (A11Y-2).
- `Image` comes from `expo-image` (UI-4).
- Field names come from `src/types/entities.ts`. Never guess them.

## Before saying it is done

Run `pnpm lint`, `pnpm typecheck`, and `pnpm test`. All three pass with no
errors (TEST-4). Then use the `reviewing-komia-changes` skill on your change
and fix what it finds.
