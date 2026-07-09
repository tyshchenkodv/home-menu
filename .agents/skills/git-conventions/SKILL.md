---
name: git-conventions
description: Use when staging, committing, amending, reviewing commit scope, writing commit messages, checking Git status, or preparing Home Menu changes for version control.
---

# Git Conventions

Home Menu is a public repository. Git actions require explicit user
authorization after the user has had a chance to review the working tree. Never
stage, commit, amend, reset, rebase, push, or open a pull request merely
because a generic skill suggests it.

## Authorization gate

Before staging or committing:

1. Confirm the user explicitly asked for this Git action in the current phase.
2. Inspect `git status --short`.
3. Inspect the full relevant diff and tracked file names.
4. Run or cite the verification appropriate to the change.
5. Run the privacy gate below.
6. Ask for confirmation if scope, unrelated files, or verification status is
   unclear.

If the user says “commit everything” but has not reviewed the diff, stop and
show the scope first. Do not stage unrelated or unknown files.

## Commit scope

- Keep commits atomic: one coherent feature, fix, documentation update, or
  workflow change.
- Preserve unrelated user changes and untracked files.
- Do not include `.env*`, secrets, Firebase project identifiers, exported data,
  personal emails, local machine paths, household inventory, or generated
  debug artifacts.
- Include generated lockfile or config changes only when they are part of the
  requested change.

## Commit messages

Use English Conventional Commits:

```text
type(scope): concise imperative summary
```

Recommended types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`,
`ci`, `build`.

Use a scope when it clarifies ownership, for example `docs`, `skills`,
`firebase`, `inventory`, `orders`, `i18n`, or `auth`.

Body is optional. Add it when reviewers need context, verification evidence, or
privacy/security notes.

## Privacy gate

Before committing, inspect:

- `git status --short`
- full diff for staged and unstaged files in scope
- file names for credential, export, or local-only artifacts
- searchable text for real emails, tokens, keys, Firebase IDs, local paths,
  production URLs with identifiers, and real household data

Use placeholders and `.test` domains in examples.

## Review checklist

- Did the user explicitly authorize staging or commit?
- Is the commit scope coherent and free of unrelated changes?
- Is the message Conventional Commit style and English?
- Did verification run, or is the unrun check clearly documented?
- Did privacy review cover status, diff, file names, and searchable text?
