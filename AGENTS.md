# Home Menu agent instructions

Apply these rules to every change in this repository.

## Universal task routing

Before any task work, invoke `using-superpowers`, then read every applicable
process and project skill. User instructions and this file override conflicting
generic skill defaults.

For substantial work, follow this sequence without skipping gates:

1. Read `home-menu-project` and the relevant current documentation.
2. Classify the task and inspect the repository before asking questions.
3. Use `brainstorming`, then `grill-me`, one question at a time.
4. Use `creating-specifications` to write
   `docs/specifications/<slug>/SPEC.md` and update the index.
5. Stop until the user explicitly approves the SPEC.
6. Use `creating-plans` to write the sibling `PLAN.md` and update the index.
7. Stop until the user explicitly approves the PLAN.
8. Implement with the applicable Superpowers execution, TDD, review, and
   verification skills.
9. Run the project verification gate `npm run verify` (typecheck, lint with
   Prettier, format check, test, build) and confirm it passes; fix style with
   the unified `npm run fix`.
10. Update the current project documentation and mark the index entry
    implemented only after the gate passes.

Substantial work includes new features or workflows, behavior or business-rule
changes, architecture decisions, Firebase schema/Rules/index/transaction
changes, auth/privacy/deployment/i18n behavior changes, multi-layer changes,
and other high-risk work. Do not create a new SPEC/PLAN for typo or formatting
fixes, naming cleanup, behavior-preserving mechanical refactors, documentation
synchronization, or work already covered by an active approved plan. If the
classification is unclear, ask one focused question and recommend an answer.

Approved SPEC and PLAN files are immutable historical records. Record later
system behavior in the current documentation. A material change to approved
requirements needs a new linked specification.

Delegate bounded independent discovery, impact analysis, implementation,
testing, and review when useful. The primary agent owns user questions,
decisions, approval gates, integration, and final verification. Prefer a
lower-cost worker model only when the runtime supports model selection.
The primary agent invokes the universal router; dispatched subagents follow
their assigned task plus every applicable project and domain skill.

### Skill map

| Task | Required skill |
| --- | --- |
| Any repository change | `home-menu-project` |
| Substantial change specification | `creating-specifications`, `grill-me` |
| Approved specification planning | `creating-plans` |
| React, TypeScript, UI, routing, or frontend structure | `frontend-architecture`, `react-best-practices` |
| Bug or unexpected behavior | `systematic-debugging` |
| Behavior implementation or fix | `test-driven-development` |
| Completion claim | `verification-before-completion` |
| Staging or committing | `git-conventions` |
| Push or pull request | `pr-conventions` |

Project workflow overrides:

- use `docs/specifications/<slug>/{SPEC.md,PLAN.md}`, not generic Superpowers
  artifact paths;
- never stage or commit merely because a generic skill requests it;
- subagents must not stage, commit, push, or open pull requests;
- never begin implementation before explicit PLAN approval.

## Language

- Write source code, identifiers, comments, tests, documentation, configuration
  comments, and developer-facing messages in English.
- Keep all user-facing strings out of React components.
- Add every user-facing string to both `uk` and `en` translation resources.
- Use `uk` for Ukrainian. Never use `ua` as a language code.
- Make `uk` the default locale and `en` the fallback locale.
- Preserve Ukrainian text only when it is intentional UI copy, translation
  data, or user-generated domain data.

## Public repository and privacy

- Assume every tracked file is public.
- Never add real names, personal email addresses, Firebase UIDs, Google account
  identifiers, Firebase project IDs, access tokens, API private keys, service
  account JSON, private keys, production URLs containing identifiers, exported
  Firestore data, or household inventory.
- Use obvious placeholders and `.test` domains in examples.
- Never commit `.env*` files. Document variable names in README instead.
- Keep secrets in local ignored files or GitHub Secrets.
- Treat Firebase Web App configuration as public configuration, but do not
  hardcode a maintainer's concrete values.
- Use synthetic fixtures only.
- Review `git diff`, `git status`, and tracked file names for leaks before
  proposing a commit.

## Architecture

- Follow the specifications in `docs/`.
- Use React, TypeScript, Vite, Material UI, `HashRouter`, Firebase Auth, and
  Firestore.
- Use `i18next` with `react-i18next`.
- Keep domain rules in pure TypeScript functions.
- Keep Firestore access behind typed infrastructure services and hooks.
- Use Firestore transactions for inventory, prepared-batch, and reservation
  mutations.
- Do not add Cloud Functions, Storage, paid services, or offline writes without
  an explicit architecture decision.

## Change discipline

- Do not commit, stage, push, or open a pull request unless the user explicitly
  asks after reviewing the changes.
- Preserve unrelated user changes.
- Add or update tests for behavioral changes.
- Run checks proportionate to the change and report what was not run.
- Update English documentation whenever an architecture, schema, security, or
  deployment decision changes.
