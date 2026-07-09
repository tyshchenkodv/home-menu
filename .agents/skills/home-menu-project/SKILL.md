---
name: home-menu-project
description: Apply Home Menu repository conventions for privacy, English-only development artifacts, Ukrainian and English i18n, Firebase safety, and review-before-commit discipline. Use whenever creating or changing code, tests, documentation, configuration, fixtures, CI/CD, Firebase resources, or agent instructions in this repository.
---

# Home Menu Project

Preserve the repository as a reusable public template without maintainer or
household data.

## Before changing files

1. Read `AGENTS.md` and the relevant document in `docs/`.
2. Inspect the repository instead of guessing existing conventions.
3. Check whether the change introduces user-facing text, Firebase
   configuration, fixtures, or deployment credentials.

## Language rules

- Write code, comments, identifiers, tests, documentation, and configuration in
  English.
- Put UI text in i18next resources, never inline in React components.
- Add matching `uk` and `en` keys in the same change.
- Use `uk` as the default locale and `en` as the fallback.
- Treat missing or mismatched translation keys as a test failure.

## Privacy rules

- Assume Git history is permanently public.
- Reject real personal data, account identifiers, credentials, household
  inventory, production exports, and concrete maintainer Firebase values.
- Use `<placeholder>` values and `example.test` identities.
- Do not create or commit `.env*` files.
- Keep deploy credentials in GitHub Secrets and local configuration outside Git.
- Before handing off a change, inspect status, diff, file names, and searchable
  text for leaks.

## Implementation rules

- Preserve the architecture and domain invariants documented in `docs/`.
- Keep domain logic pure and Firebase access isolated.
- Use transactions for multi-document inventory and reservation operations.
- Add tests for business rules, security rules, and both locale resources.
- Update documentation when a decision changes.

## Handoff rules

- Do not stage, commit, push, or publish unless the user explicitly requests it
  after reviewing the working tree.
- Report modified files and verification performed.
- Call out any check that could not be run.
