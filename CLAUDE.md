@AGENTS.md

# Claude Code

Everything shared with other agents is in `AGENTS.md`, imported above. This file holds only what is specific to Claude Code.

- Before writing or changing any code, load the `writing-komia-code` skill. Before committing, or when asked to review a change, load the `reviewing-komia-changes` skill. Both use `docs/code-standards.md`.
- `.claude/settings.json` enables the Expo plugin (`expo@claude-plugins-official`) for this repo. Claude Code offers to install it the first time the repo is opened.
