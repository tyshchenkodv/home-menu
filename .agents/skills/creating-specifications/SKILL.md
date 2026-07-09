---
name: creating-specifications
description: Use when a Home Menu task introduces a feature, user-visible workflow, behavior or business-rule change, architecture decision, Firebase schema or security change, multi-layer work, or another substantial risk that requires Specification-Driven Development.
---

# Creating Specifications

Define what a substantial change must achieve before planning how to build it.
Write the durable artifact to `docs/specifications/<slug>/SPEC.md`.

## Prerequisites

**REQUIRED:** Use `using-superpowers`, `home-menu-project`, `brainstorming`, and
`grill-me` first. Load every applicable domain skill.

Read:

1. `AGENTS.md`;
2. `docs/specifications/README.md`;
3. relevant current documents under `docs/`;
4. related historical specifications without editing them;
5. relevant code and tests.

Investigate existing data ownership, consumers, similar flows, and constraints.
Answer repository-resolvable questions through inspection. Ask the user only
about decisions that remain ambiguous.

## Scope classification

Create a SPEC for any new feature or workflow, behavior/business-rule change,
architecture decision, Firebase schema/Rules/index/transaction change,
auth/privacy/deployment/i18n behavior change, multi-layer change, or
substantial risk.

Do not create one for typos, formatting, naming cleanup, behavior-preserving
mechanical refactors, current-documentation synchronization, or work already
covered by an active approved PLAN. If uncertain, ask one question and
recommend a classification.

Workflow operations do not recursively require their own SPEC.

## Workflow

1. Choose a stable lowercase kebab-case slug.
2. Complete discovery, brainstorming, and `grill-me`.
3. Resolve every blocking question.
4. Write `docs/specifications/<slug>/SPEC.md` with status `Draft`.
5. Add or update its row in `docs/specifications/README.md`.
6. Self-review for placeholders, contradictions, ambiguity, and missing impact.
7. Stop and ask for explicit user approval.
8. On approval, record the dated approval, set status to `Approved`, then
   freeze the file.

Never stage or commit the SPEC automatically.

## Required SPEC structure

1. Header table: slug, status, ticket/request, created date, and
   superseded/related artifacts when applicable.
2. Problem statement: current behavior and pain.
3. Numbered, testable goals.
4. Explicit non-goals.
5. Workflow, domain, and data model, including source of truth, defaults,
   recomputation, migration/backfill, and compatibility when applicable.
6. UX and accessibility, including roles and loading/empty/error/ready states.
7. Deep impact analysis covering applicable rows:

| Area | Questions |
| --- | --- |
| Architecture | Which `app`, `domain`, `features`, `infrastructure`, and `shared` boundaries change? |
| Firebase | Schema, converters, queries, indexes, Rules, Auth, transactions, migration, emulator tests? |
| Domain | Invariants, units, statuses, time, concurrency, source of truth? |
| Privacy | Public-repository data, identities, credentials, logs, household data? |
| i18n | Matching `uk` and `en` keys, default/fallback behavior, user data? |
| UX | Routes, permissions, accessibility, responsive states, destructive actions? |
| Compatibility | Existing documents, deployed clients, additive rollout, rollback? |
| Quality | Unit, component, Rules, E2E, CI, documentation? |

8. Checkbox acceptance criteria.
9. Milestones.
10. Non-blocking open questions.
11. References to current docs and key code paths.
12. Approval table.

State `Unknown` plus a concrete discovery step when an impact cannot yet be
determined. Do not hide assumptions.

## Boundaries

SPEC defines **what and why**. Do not include file-by-file implementation
steps, command sequences, or invented ticket identifiers; those belong in
PLAN.

Approved SPEC and PLAN files are immutable historical records. A material
post-approval change gets a new linked SPEC with `Supersedes`; current system
behavior belongs in the main project documentation.

## Quality gate

Before requesting approval, confirm:

- no blocking open question remains;
- goals map to acceptance criteria;
- non-goals bound the scope;
- affected consumers and sources of truth were investigated;
- Firebase, privacy, i18n, tests, and documentation are addressed or explicitly
  not applicable;
- the index links to the Draft SPEC;
- no secrets, personal data, local absolute paths, or household data appear.
