# Specification: Universal Agent Skill Routing and SDD Workflow

| Field | Value |
| --- | --- |
| **Slug** | `agent-skill-routing` |
| **Status** | Approved |
| **Created** | 2026-07-09 |
| **Ticket** | Repository agent workflow |
| **Supersedes** | Initial informal agent-routing design |

## 1. Problem statement

The repository has strong project rules and the Superpowers skill set, but it
does not yet have one project-level workflow that routes tasks through the
right skills. Agents can inconsistently skip discovery, design pressure
testing, persistent specifications, approval gates, implementation plans, or
repository-specific Git and pull-request checks.

The repository also lacks focused guidance for its frontend architecture,
browser-side React practices, Git commits, and pull requests.

## 2. Goals

1. Route every task through `using-superpowers` before task work.
2. Automatically select all applicable process and project skills.
3. Require discovery, brainstorming, and `grill-me` before specifying a
   substantial change.
4. Store substantial-change artifacts under
   `docs/specifications/<slug>/{SPEC.md,PLAN.md}`.
5. Require explicit user approval of SPEC before PLAN and PLAN before
   implementation.
6. Preserve approved SPEC and PLAN files as immutable historical records.
7. Keep current project documentation synchronized with each completed
   feature.
8. Delegate bounded independent work to subagents when useful and supported.
9. Add Home Menu-specific frontend, React, Git, and PR guidance.
10. Preserve repository privacy, internationalization, Firebase, and
    review-before-commit rules throughout the workflow.

## 3. Non-goals

- Replacing or editing the vendored Superpowers skills.
- Creating a SPEC and PLAN for typo fixes, formatting, naming cleanup,
  behavior-preserving mechanical refactors, documentation synchronization, or
  work already covered by an active approved plan.
- Selecting a cheaper subagent model when the runtime exposes no model
  selection capability.
- Automatically staging, committing, pushing, or opening a pull request.
- Adding Next.js, React Server Components, server actions, or Vercel-specific
  deployment conventions.

## 4. Workflow and approval model

The universal workflow is:

```text
task intake
→ using-superpowers
→ task classification and applicable skill selection
→ codebase and documentation discovery
→ brainstorming
→ adaptive grill-me
→ SPEC.md Draft
→ explicit user approval
→ PLAN.md Draft
→ explicit user approval
→ implementation with TDD
→ review and verification
→ current documentation update
→ specification index marked Implemented
→ optional Git or PR actions after separate explicit authorization
```

Natural, unambiguous approval such as “approved,” “confirmed,” or “go ahead”
is sufficient. A requirement change before approval updates the draft. A
material requirement change after approval creates a new specification that
links to the superseded artifact.

### 4.1 Work requiring SPEC and PLAN

Create both artifacts when the task includes at least one of:

- a new feature or user-visible workflow;
- a behavior or business-rule change;
- an architecture decision;
- a Firestore schema, Rules, index, or transaction change;
- an authentication, privacy, deployment, or i18n behavior change;
- a multi-layer change or another substantial risk.

If classification is ambiguous, ask one focused question and include a
recommended answer.

### 4.2 Recursion boundary

Workflow operations do not create nested specifications. Updating an active
draft, creating its plan, executing a plan step, running checks, reviewing
work, updating current documentation, and maintaining the index remain part
of the original task.

Read-only explanations, status reports, and investigations do not require
SPEC or PLAN unless they become a proposed repository or external-state
change.

## 5. Skill architecture

The root `AGENTS.md` contains only the universal routing sequence, the approval
gates, and a quick skill map. Detailed guidance lives in:

```text
.agents/skills/
├── creating-specifications/
├── creating-plans/
├── grill-me/
├── frontend-architecture/
├── react-best-practices/
├── git-conventions/
└── pr-conventions/
```

Project skills override incompatible generic workflow defaults:

- SPEC and PLAN use `docs/specifications/<slug>/`, not
  `docs/superpowers/{specs,plans}/`;
- no workflow step commits automatically;
- PLAN creation stops for explicit user approval before implementation;
- subagents do not stage or commit;
- approved SPEC and PLAN files are immutable.

## 6. Specification requirements

The specification workflow investigates the repository before describing
impact. A SPEC defines what and why, not file-by-file implementation steps.
It includes:

- metadata and status;
- problem statement;
- testable goals and explicit non-goals;
- domain and data-model impact;
- UX and accessibility impact;
- Firebase, authentication, security, and privacy impact;
- i18n impact for `uk` and `en`;
- deep impact analysis;
- acceptance criteria;
- milestones, open questions, references, and approval state.

`grill-me` asks one question at a time, recommends an answer, explores the
repository instead of asking repository-answerable questions, and continues
until no blocking decision remains. A trivial task needs no new SPEC; when
used for a substantial change, `grill-me` covers scope, UX, data, security,
compatibility, tests, and rollout as applicable.

## 7. Plan requirements

PLAN creation requires an explicitly approved sibling SPEC. A PLAN defines how
the approved requirements will be implemented. It includes:

- scope and non-goals inherited from SPEC;
- deep impact analysis and resolved conflicts;
- exact affected paths and interfaces;
- ordered, independently reviewable implementation tasks;
- test-first steps and expected verification commands;
- security, privacy, i18n, migration, rollout, and rollback work;
- mapping from acceptance criteria to implementation and verification;
- documentation updates;
- risks and non-blocking open questions.

The PLAN remains Draft until explicit user approval. It must not contain
unconditional stage, commit, push, or PR steps.

## 8. Subagent policy

The workflow may automatically delegate bounded work without asking again:

- independent repository discovery;
- impact analysis;
- SPEC and PLAN review;
- independent implementation tasks with non-overlapping ownership;
- test investigation and code review.

The primary agent owns user questions, product and architecture decisions,
artifact synthesis, approval gates, integration, and final verification.
Parallel agents are used only for independent tasks. A lower-cost worker model
is preferred only when the runtime supports explicit model selection.

## 9. Frontend architecture and React guidance

The frontend architecture skill applies the documented `app`, `domain`,
`features`, `infrastructure`, and `shared` boundaries. It requires:

- one React component per file;
- focused separate files for hooks, types, interfaces, schemas, constants, and
  utilities;
- feature ownership and public APIs without cross-feature internal imports;
- pure domain logic without React, Firebase, Material UI, or i18next;
- typed Firebase boundaries in infrastructure services and application hooks;
- user-facing strings in matching `uk` and `en` resources;
- SOLID, DRY, KISS, and YAGNI as judgment heuristics rather than reasons for
  speculative abstraction.

The React best-practices skill adapts browser-relevant guidance from Vercel
Labs' `react-best-practices`: avoid request waterfalls, parallelize independent
work, lazy-load heavy routes and UI, preserve tree shaking, derive state
instead of synchronizing copies, keep effect dependencies and cleanup correct,
use stable keys, optimize renders based on evidence, prefer composition, and
render accessible loading, empty, error, and ready states.

## 10. Git and pull-request guidance

Git and PR skills require separate explicit authorization for staging,
committing, pushing, and PR creation. They require English Conventional Commit
titles, atomic scope, verification evidence, privacy review, full status and
diff inspection, and preservation of unrelated user changes.

Pull-request descriptions include a concise summary, tests run, checks not run,
risks, i18n and privacy impact, and screenshots for visible UI changes.

## 11. Current documentation

After each implemented feature, update the current project documentation so it
describes the system as built. Historical SPEC and PLAN files are not living
documentation and must not be rewritten.

The current documentation may evolve beyond eight large Markdown files.
Agents may introduce domain directories, focused documents, and index pages
when a file becomes difficult to navigate or combines unrelated sources of
truth. Such restructuring must preserve discoverability, update internal
links, avoid duplicated authority, and remain proportional to the feature.

## 12. Deep impact analysis

| Area | Impact |
| --- | --- |
| Agent routing | Root `AGENTS.md` gains a concise mandatory state machine. |
| Skills | Seven focused project skills are added without modifying Superpowers. |
| Documentation | A specifications index and paired SPEC/PLAN convention are introduced. |
| Historical records | Approved SPEC and PLAN files become immutable. |
| Current docs | Feature completion requires documentation synchronization and permits domain-oriented splitting. |
| Privacy | Existing public-repository and secret-review gates remain mandatory. |
| i18n | Frontend guidance retains `uk` default, `en` fallback, and key parity. |
| Firebase | Planning explicitly covers schema, Rules, indexes, transactions, Auth, and migrations. |
| Git/PR | No publication action becomes automatic. |
| Compatibility | Generic Superpowers remain vendored; project overlays resolve conflicts. |
| Runtime limits | Subagent model tier selection remains capability-dependent. |

## 13. Acceptance criteria

- [ ] Root `AGENTS.md` routes tasks through the complete SDD state machine.
- [ ] The router distinguishes substantial work from minimal changes.
- [ ] `creating-specifications` writes and indexes Home Menu SPEC artifacts.
- [ ] `grill-me` is mandatory before a substantial-change SPEC.
- [ ] `creating-plans` requires approved SPEC and writes the sibling PLAN.
- [ ] Both artifact types have explicit user approval gates.
- [ ] Approved SPEC and PLAN files are treated as immutable.
- [ ] Completed features update current project documentation.
- [ ] Current documentation may be split by domain without duplicating truth.
- [ ] Subagent delegation respects bounded scope and primary-agent ownership.
- [ ] Frontend architecture covers file responsibility and dependency boundaries.
- [ ] React guidance contains only relevant Vite SPA practices.
- [ ] Git and PR workflows preserve explicit authorization and privacy review.
- [ ] New skills pass structural validation.
- [ ] No files are staged, committed, pushed, or published.

## 14. Milestones

1. M1 — approve this specification.
2. M2 — create and approve `PLAN.md`.
3. M3 — implement the router, skills, and specifications index.
4. M4 — validate skills and review repository privacy.
5. M5 — update the specifications index to `Implemented` and synchronize current
   documentation.

## 15. Open questions

No blocking questions remain.

## 16. References

- [`AGENTS.md`](../../../AGENTS.md)
- [`docs/02-architecture.md`](../../02-architecture.md)
- [`docs/07-testing-and-cicd.md`](../../07-testing-and-cicd.md)
- [Vercel Labs agent skills](https://github.com/vercel-labs/agent-skills)

## 17. Approval

| Role | Status |
| --- | --- |
| User | Approved on 2026-07-09 |
| Engineering agent | Ready for review |
