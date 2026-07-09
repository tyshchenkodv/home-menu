---
name: pr-conventions
description: Use when pushing a Home Menu branch, opening or updating a pull request, drafting a PR title or description, summarizing changes for review, or preparing PR handoff notes.
---

# PR Conventions

Pushing and pull-request creation are publishing actions. They require explicit
user authorization after the user has reviewed the local change scope. Default
to a draft PR when readiness is unclear.

## Authorization gate

Before push or PR creation:

1. Confirm the user explicitly requested push or PR work.
2. Confirm the branch and remote target.
3. Inspect `git status --short` and the relevant diff.
4. Confirm no unrelated, secret, or private files are included.
5. Confirm checks that should gate the PR have run, or list them as not run.
6. Do not push if tests are unknown and the user asked for a ready PR.

Subagents must not push or open pull requests.

## Title

Use an English Conventional Commit-style title:

```text
type(scope): concise PR summary
```

Keep it reviewer-facing and specific.

## Description template

```markdown
## Summary
-

## Tests
-

## Risk and rollout
-

## Privacy and security
-

## UI and i18n
-

## Screenshots
- N/A
```

Use `N/A` only when the section truly does not apply. For visible UI changes,
include screenshots or clearly state why they are not available.

## Required content

- Summary of changed behavior and affected areas.
- Verification commands and exact pass/fail/not-run status.
- Risks, migration notes, rollback notes, or deployment sequencing when
  relevant.
- Privacy/security review outcome for public-repository constraints.
- i18n note for user-facing strings: both `uk` and `en` updated, or N/A.
- Link to the active SPEC/PLAN for substantial work.

## Pressure rules

- If asked to “push/open PR now” while tests, privacy, or diff review are
  unchecked, stop and report the missing gate.
- If the user wants a ready PR but verification is incomplete, offer either to
  run checks first or create a draft only after explicit approval.
- Never hide unrun checks behind vague wording such as “not fully tested.”
  Name the exact commands not run.
