---
name: reviewing-komia-changes
description: Use when checking a change to the KOMIA repo before it is committed, pushed, or merged - after finishing a code task, when asked to review a diff, branch, or PR, or when asked whether code follows the project's best practices.
---

# Reviewing KOMIA changes

A review checks two things: that the change works, and that it follows the
rules in `docs/code-standards.md`. Do both. The rules do not
replace looking for bugs.

## Steps

1. **Get the change.** With no target given, review the branch against
   `main` plus uncommitted work: `git diff main...HEAD` and `git diff HEAD`.
   For a PR number, use `gh pr diff <n>`. List the changed files.
2. **Read the rules.** Read all of `docs/code-standards.md`.
3. **Read each changed file in full**, not only the changed lines, plus the
   files it imports from `src/features/`, `src/types/entities.ts`, and the
   matching `base44/entities/*.jsonc`.
4. **Check for bugs.** Wrong or missing field names, a value that can be null,
   dead state, code nothing reaches, a write that can be lost, a route that
   does not exist, a press area inside another press area.
5. **Check the rules.** Go through every section of `docs/code-standards.md` that
   applies to each file, using the table below. Flag only added or changed
   lines. Old code is out of scope.
6. **Run the checks:** `pnpm lint`, `pnpm typecheck`, `pnpm test`. A failure
   is a finding, with the error text.

| Changed path | Sections to check in `docs/code-standards.md` |
|---|---|
| `src/app/**` | Where code goes, UI (UI-8, UI-9) |
| `src/screens/**`, `src/components/**` | Where code goes, React, UI, Accessibility, TypeScript, Security |
| `src/features/**` | Where code goes, Data and backend, React, TypeScript, Security, Tests |
| `base44/entities/**` | DATA-7, SEC-3 |
| `base44/functions/**` | DATA-8, SEC-1, SEC-3, SEC-6 |
| `app.config.ts`, `package.json`, `.env*` | SEC-1, SEC-7, SEC-8 |
| any file | Comments, TEST-4 |

## Report

Write the report in this order:

1. **Verdict** on one line: `Ready to merge` or `Not ready: <n> must-fix`.
2. **Must fix.** Bugs, security rules (SEC-*), DATA-7, DATA-8, and failing
   checks. One line each: `file:line` - rule id or `bug` - what is wrong -
   the fix.
3. **Should fix.** Every other rule broken, in the same one-line form.
4. **Checks.** The result of lint, typecheck, and test.

When there is nothing in a section, write `None`.

## Common mistakes

| Mistake | Instead |
|---|---|
| Suggesting `useMemo` to replace a state-plus-effect copy | Compute the value in render. React Compiler memoizes (RCT-1). |
| Reviewing only the diff lines | Read the whole file and the entity types it uses. Wrong field names hide outside the diff. |
| Stopping at rule checks | Also look for bugs (step 4). |
| Flagging old code the change did not touch | Leave it out. |
| Skipping the checks because the code looks fine | Run all three. |
