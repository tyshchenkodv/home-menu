---
name: creating-plans
description: Use when a substantial Home Menu change has an explicitly approved SPEC and needs a repository implementation PLAN before coding, or when reviewing or revising a Draft PLAN.
---

# Creating Plans

Turn an approved specification into an executable implementation strategy.
Write `docs/specifications/<slug>/PLAN.md` beside its `SPEC.md`.

## Hard prerequisite

Confirm the sibling SPEC exists and the user explicitly approved it. Its header
and approval table must record that approval. If it is absent or Draft, stop
and use `creating-specifications`; do not infer approval from enthusiasm or a
request to start coding.

Read the approved SPEC, `AGENTS.md`, `docs/specifications/README.md`, relevant
current docs, applicable project skills, and the code/tests affected.

**REQUIRED SUB-SKILL:** Use `writing-plans` for task sizing and plan
self-review, subject to these Home Menu overrides:

- output is the sibling `PLAN.md`;
- no automatic commit steps;
- do not offer or start execution before explicit PLAN approval;
- approved SPEC and PLAN files are immutable;
- project privacy and authorization rules always win.

## Investigation

Before planning:

1. Map every acceptance criterion to affected consumers and verification.
2. Search for existing patterns and extend them before introducing
   abstractions.
3. Identify source-of-truth, ordering, concurrency, compatibility, security,
   privacy, i18n, and rollout conflicts.
4. Ask one focused question with a recommendation for any blocking product or
   architecture decision. Do not hide it under Risks.
5. Delegate only bounded independent impact scans or reviews.

## Required PLAN structure

1. Header table: slug, `Draft` status, relative SPEC link, and date.
2. Goal, architecture, stack, and exact global constraints.
3. Scope and inherited non-goals.
4. Deep impact analysis:

| Area | Required planning detail |
| --- | --- |
| Architecture | Affected layers, ownership, dependency direction, public APIs |
| Data/domain | Shapes, source of truth, invariants, time/units, concurrency |
| Firebase | Converters, queries, indexes, Rules, Auth, transactions, emulator |
| Migration | Backfill, compatibility window, additive rollout, rollback |
| Privacy/i18n | Public data review, secrets, logs, matching `uk`/`en` resources |
| UX | Routes, roles, accessibility, responsive and async states |
| Quality | TDD layers, CI, documentation, review, verification |

5. Conflict-resolution outcomes or an explicit “no conflicts found.”
6. Exact affected paths and interfaces.
7. Ordered tasks with checkbox steps, dependencies, commands, expected
   RED/GREEN results, and independently reviewable deliverables.
8. Acceptance-criteria-to-task-and-verification mapping.
9. Documentation, rollout, rollback, risks, and non-blocking questions.
10. Approval table.

Use `Unknown` only with a concrete discovery step. Do not leave placeholders,
invent file paths without inspection, or say “add tests” without naming
behavior, location, command, and expected result.

## Test-first planning

For each behavior change, plan:

1. write one minimal behavior test;
2. run it and confirm the expected failure;
3. implement the smallest passing change;
4. rerun the focused test;
5. refactor while green;
6. run proportionate broader verification.

Configuration or documentation-only tasks use reproducible structural checks
and behavioral evaluation scenarios instead of artificial unit tests.

## Persistence and approval

1. Write the full plan to `docs/specifications/<slug>/PLAN.md`.
2. Link it from `docs/specifications/README.md` with status `Spec Approved`.
3. Self-review SPEC coverage, placeholders, path/interface consistency,
   dependency order, and privacy.
4. Stop and ask for explicit user approval.
5. On approval, atomically set PLAN status and dated approval to `Approved`
   and index status to `Plan Approved`.
6. Freeze the PLAN, then begin implementation through the applicable execution
   skill.

Never stage, commit, push, or open a PR as part of plan creation.

## Implementation handoff

Implementation workers receive only their bounded task, exact interfaces, and
global constraints. They do not make product decisions or perform Git
publication actions. The primary agent integrates, verifies, updates current
project documentation, and marks the index `Implemented`.

If implementation requires a material departure from approved requirements,
stop. Create a new linked SPEC instead of rewriting history.
