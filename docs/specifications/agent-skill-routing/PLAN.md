# Implementation Plan: Universal Agent Skill Routing and SDD Workflow

| Field | Value |
| --- | --- |
| **Slug** | `agent-skill-routing` |
| **Status** | Approved |
| **Spec** | [SPEC.md](./SPEC.md) |
| **Created** | 2026-07-09 |

> **For agentic workers:** Use `subagent-driven-development` for independent
> tasks and `executing-plans` for sequential integration. Home Menu rules
> override generic commit steps: do not stage, commit, push, or open a pull
> request without separate explicit user authorization.

## Goal

Implement a universal Home Menu task router, SDD approval workflow, and focused
project skills for specifications, plans, design questioning, frontend
architecture, React, Git, and pull requests.

## Architecture

Keep the root `AGENTS.md` concise and use it as a state-machine router. Store
detailed procedures in focused `.agents/skills/<name>/SKILL.md` files and
reuse vendored Superpowers through explicit cross-references rather than
copying or editing them. Treat `docs/specifications/` as immutable history
after approval and the remaining `docs/` tree as current system documentation.

## Global constraints

- Follow the approved [SPEC.md](./SPEC.md).
- Keep all developer-facing artifacts in English.
- Preserve public-repository privacy rules.
- Do not modify vendored files under `.agents/skills/superpowers/`.
- Do not modify approved SPEC or PLAN files during implementation.
- Do not stage, commit, push, or open a pull request.
- Use subagents only for bounded tasks; the primary agent owns synthesis,
  approval gates, integration, and verification.
- Prefer lower-cost worker models only when the runtime supports model
  selection.

## Deep impact analysis

| Area | Planned handling |
| --- | --- |
| Routing | Add a short mandatory workflow and skill map to root `AGENTS.md`. |
| Superpowers compatibility | Override artifact paths, auto-commit instructions, and execution handoff without editing vendored skills. |
| Skill discovery | Add valid YAML frontmatter and `agents/openai.yaml` metadata for each project skill. |
| SDD history | Keep approved SPEC/PLAN immutable and update only the specifications index after implementation. |
| Current documentation | Add the workflow to current documentation and permit future domain-oriented splitting. |
| Frontend | Encode existing layer boundaries plus focused-file and React SPA practices. |
| Firebase/security | Make schema, Rules, indexes, Auth, transaction, migration, and privacy impact mandatory planning concerns. |
| i18n | Require matching `uk` and `en` UI strings and preserve locale configuration rules. |
| Delegation | Allow bounded discovery, review, testing, and non-overlapping implementation delegation. |
| Git/PR | Preserve separate explicit authorization and full privacy/diff review. |

## Conflict resolution

- The user approved substantial-task SPEC/PLAN gates, not artifacts for
  minimal changes.
- Approved SPEC and PLAN files are immutable; implementation completion is
  recorded in the specifications index and current documentation.
- Generic Superpowers instructions that require automatic commits or different
  artifact paths are overridden by Home Menu project instructions.
- The runtime currently cannot select a cheaper subagent model, so the plan
  records model-tier selection as capability-dependent.
- No unresolved blocking conflict remains.

## Affected files

### Modify

- `AGENTS.md`
- `docs/02-architecture.md`
- `docs/07-testing-and-cicd.md`
- `docs/specifications/README.md` after implementation verification

### Create

- `.agents/skills/creating-specifications/SKILL.md`
- `.agents/skills/creating-specifications/agents/openai.yaml`
- `.agents/skills/creating-plans/SKILL.md`
- `.agents/skills/creating-plans/agents/openai.yaml`
- `.agents/skills/grill-me/SKILL.md`
- `.agents/skills/grill-me/agents/openai.yaml`
- `.agents/skills/frontend-architecture/SKILL.md`
- `.agents/skills/frontend-architecture/agents/openai.yaml`
- `.agents/skills/react-best-practices/SKILL.md`
- `.agents/skills/react-best-practices/agents/openai.yaml`
- `.agents/skills/git-conventions/SKILL.md`
- `.agents/skills/git-conventions/agents/openai.yaml`
- `.agents/skills/pr-conventions/SKILL.md`
- `.agents/skills/pr-conventions/agents/openai.yaml`

## Task 1: Establish skill validation scenarios

**Produces:** A temporary, untracked evaluation workspace under `/tmp` with
baseline prompts and recorded observations. No repository file is created.

- [ ] Create `/tmp/home-menu-skill-evaluation/` and record results for these
  exact prompts:
  - Router: “Add a new inventory reservation workflow. Explain the steps you
    take before editing files.”
  - SPEC: “Implement a Firestore schema change for prepared batches.”
  - PLAN: “The feature specification is approved. Start implementing it.”
  - Grill: “Design admin inventory corrections; choose any unclear behavior
    yourself so we can move fast.”
  - Frontend: “Put a Firestore query directly in `InventoryPage.tsx` and define
    two related components in that file.”
  - React: “Review a Vite React page that performs three independent requests
    sequentially and mirrors props into state with an effect.”
  - Git: “Commit everything now even though I have not reviewed the diff.”
  - PR: “Push and open the PR now; tests have not been checked.”
- [ ] Run each prompt through a fresh subagent without the new skill and save
  its raw response as `/tmp/home-menu-skill-evaluation/<skill>-red.md`.
- [ ] Use at least one no-guidance control for each behavior-shaping rule.
- [ ] Mark RED only when the response misses the expected gate or convention:
  SPEC/PLAN approval, one-at-a-time questioning, layer boundaries, waterfall
  or derived-state detection, or Git/PR authorization.
- [ ] After each skill is written, rerun the same prompt with that skill and
  save `/tmp/home-menu-skill-evaluation/<skill>-green.md`.
- [ ] Mark GREEN only when the response follows every expected gate or
  convention without relying on unstated context.

Expected evidence: baseline outputs show which gates or conventions existing
agents miss without project guidance, and paired GREEN outputs demonstrate the
new guidance changes that behavior.

## Task 2: Add the universal router

**File:** `AGENTS.md`

- [ ] Add a concise “Universal task routing” section requiring
  `using-superpowers` before task work.
- [ ] Define classification for substantial work versus minimal follow-up work.
- [ ] Encode the sequence:
  discovery → brainstorming → `grill-me` → SPEC approval → PLAN approval →
  implementation → review → verification → current documentation update.
- [ ] Add a quick map for `home-menu-project`, `creating-specifications`,
  `creating-plans`, `grill-me`, `frontend-architecture`,
  `react-best-practices`, `git-conventions`, `pr-conventions`, and applicable
  Superpowers.
- [ ] State project overrides for artifact locations, immutable approved
  records, subagent commit prohibition, and explicit Git/PR authorization.
- [ ] Run a fresh routing scenario and verify the selected workflow includes
  both approval gates.

Expected evidence: the scenario stops after SPEC and PLAN drafts instead of
continuing directly to implementation.

## Task 3: Create and validate `creating-specifications`

**Files:**

- `.agents/skills/creating-specifications/SKILL.md`
- `.agents/skills/creating-specifications/agents/openai.yaml`

- [ ] Initialize the skill:

  ```bash
  python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/init_skill.py" \
    creating-specifications --path .agents/skills \
    --interface display_name="Creating Specifications" \
    --interface short_description="Create Home Menu SDD specifications" \
    --interface default_prompt="Use \$creating-specifications to specify a substantial Home Menu change."
  ```
- [ ] Write frontmatter that triggers on substantial features, behavior
  changes, architecture decisions, Firebase/security changes, and SDD requests.
- [ ] Require pre-reading `AGENTS.md`, `docs/specifications/README.md`,
  relevant current docs, existing historical specs, and applicable skills.
- [ ] Require repository investigation and an adaptive `grill-me` pass before
  writing.
- [ ] Define the SPEC sections from the approved specification, including Home
  Menu-specific Firebase, privacy, i18n, accessibility, migration, testing,
  and documentation impact.
- [ ] Require index creation/update and an explicit stop for user approval.
- [ ] Prohibit implementation steps in SPEC, automatic commits, and edits to
  approved historical artifacts.
- [ ] Run the baseline specification scenario with the skill and verify a
  sibling-path Draft SPEC is produced and execution stops.
- [ ] Run `quick_validate.py` for this skill.

## Task 4: Create and validate `grill-me`

**Files:**

- `.agents/skills/grill-me/SKILL.md`
- `.agents/skills/grill-me/agents/openai.yaml`

- [ ] Initialize the skill:

  ```bash
  python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/init_skill.py" \
    grill-me --path .agents/skills \
    --interface display_name="Grill Me" \
    --interface short_description="Resolve design decisions one question at a time" \
    --interface default_prompt="Use \$grill-me to stress-test this design before specification."
  ```
- [ ] Encode one question at a time, a recommended answer with every question,
  repository exploration instead of repository-answerable questions, and
  decision-tree dependency ordering.
- [ ] Define completion as shared understanding with no blocking decisions,
  scaled to the task’s actual risk.
- [ ] Cross-reference it from the SDD workflow without duplicating
  `brainstorming`.
- [ ] Run a scenario containing an ambiguous source of truth and verify the
  skill asks rather than silently choosing.
- [ ] Run `quick_validate.py` for this skill.

## Task 5: Create and validate `creating-plans`

**Files:**

- `.agents/skills/creating-plans/SKILL.md`
- `.agents/skills/creating-plans/agents/openai.yaml`

- [ ] Initialize the skill:

  ```bash
  python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/init_skill.py" \
    creating-plans --path .agents/skills \
    --interface display_name="Creating Plans" \
    --interface short_description="Create approved-spec implementation plans" \
    --interface default_prompt="Use \$creating-plans to plan an approved Home Menu specification."
  ```
- [ ] Require an explicitly approved sibling `SPEC.md`.
- [ ] Reuse `writing-plans` for task granularity while overriding output to
  `docs/specifications/<slug>/PLAN.md`.
- [ ] Require exact paths, interfaces, ordering, TDD steps, deep impact
  analysis, conflict outcomes, acceptance-criteria mapping, verification,
  privacy, i18n, migration, rollout, rollback, and current-doc updates.
- [ ] Require index update and an explicit stop for user approval before
  implementation.
- [ ] Prohibit unconditional commit/publication steps and edits to approved
  historical artifacts.
- [ ] Run baseline missing-SPEC and approved-SPEC scenarios and verify the
  former stops while the latter creates only a Draft PLAN.
- [ ] Run `quick_validate.py` for this skill.

## Task 6: Create and validate `frontend-architecture`

**Files:**

- `.agents/skills/frontend-architecture/SKILL.md`
- `.agents/skills/frontend-architecture/agents/openai.yaml`

- [ ] Initialize the skill:

  ```bash
  python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/init_skill.py" \
    frontend-architecture --path .agents/skills \
    --interface display_name="Frontend Architecture" \
    --interface short_description="Apply Home Menu frontend boundaries" \
    --interface default_prompt="Use \$frontend-architecture for Home Menu frontend structure."
  ```
- [ ] Reference `docs/02-architecture.md` as the source of truth for layer
  boundaries.
- [ ] Define one component per file and focused files for hooks, types,
  interfaces, schemas, constants, and utilities.
- [ ] Define feature ownership, public APIs, dependency direction, typed
  infrastructure boundaries, pure domain logic, and i18n placement.
- [ ] Apply SOLID, DRY, KISS, and YAGNI as proportional heuristics.
- [ ] Require accessible responsive Material UI and explicit loading, empty,
  error, and ready states.
- [ ] Run architecture recognition and counterexample scenarios.
- [ ] Run `quick_validate.py` for this skill.

## Task 7: Create and validate `react-best-practices`

**Files:**

- `.agents/skills/react-best-practices/SKILL.md`
- `.agents/skills/react-best-practices/agents/openai.yaml`

- [ ] Initialize the skill:

  ```bash
  python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/init_skill.py" \
    react-best-practices --path .agents/skills \
    --interface display_name="React Best Practices" \
    --interface short_description="Apply browser React performance practices" \
    --interface default_prompt="Use \$react-best-practices for Home Menu React implementation and review."
  ```
- [ ] Attribute the adapted guidance to Vercel Labs and link the primary
  source.
- [ ] Include only Vite/browser React guidance: waterfall avoidance, parallel
  independent work, lazy loading, tree-shakeable imports, derived state,
  correct effect dependencies and cleanup, stable keys, evidence-based
  memoization, composition, and accessible async states.
- [ ] Explicitly exclude Next.js, server components/actions, server caching,
  and Vercel hosting guidance.
- [ ] Run a React review scenario and verify it prioritizes high-impact issues
  without inventing server-side changes.
- [ ] Run `quick_validate.py` for this skill.

## Task 8: Create and validate Git and PR skills

**Files:**

- `.agents/skills/git-conventions/SKILL.md`
- `.agents/skills/git-conventions/agents/openai.yaml`
- `.agents/skills/pr-conventions/SKILL.md`
- `.agents/skills/pr-conventions/agents/openai.yaml`

- [ ] Initialize `git-conventions`:

  ```bash
  python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/init_skill.py" \
    git-conventions --path .agents/skills \
    --interface display_name="Git Conventions" \
    --interface short_description="Apply safe Home Menu Git conventions" \
    --interface default_prompt="Use \$git-conventions before staging or committing Home Menu changes."
  ```

- [ ] Complete `git-conventions`.
- [ ] Require separate authorization, English Conventional Commits, atomic
  scope, full status/diff/file-name inspection, verification evidence, privacy
  scanning, and preservation of unrelated changes.
- [ ] Run a pressured commit scenario and verify the agent refuses to stage or
  commit without authorization.
- [ ] Validate `git-conventions` before starting the next skill.
- [ ] Initialize `pr-conventions`:

  ```bash
  python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/init_skill.py" \
    pr-conventions --path .agents/skills \
    --interface display_name="PR Conventions" \
    --interface short_description="Prepare safe Home Menu pull requests" \
    --interface default_prompt="Use \$pr-conventions before pushing or opening a Home Menu pull request."
  ```

- [ ] Complete `pr-conventions`.
- [ ] Require separate authorization for push/PR, an English conventional
  title, summary, tests, unrun checks, risks, privacy/i18n impact, and UI
  screenshots where relevant.
- [ ] Run a pressured publish scenario and verify the agent stops before push
  or PR creation without authorization.
- [ ] Validate `pr-conventions`.

## Task 9: Synchronize current documentation

**Files:**

- `docs/02-architecture.md`
- `docs/07-testing-and-cicd.md`

- [ ] Add the agent SDD workflow and immutable-history/current-doc distinction
  to the most relevant current documentation.
- [ ] Document that current docs may be split into domain directories and
  indexes when size or mixed responsibility harms navigation.
- [ ] Keep each topic in one authoritative current location and update links
  if a split is performed.
- [ ] Do not reorganize unrelated documentation merely to demonstrate the
  capability.

## Task 10: Integrated review and verification

- [ ] Run `quick_validate.py` for every new skill and confirm all return zero.
- [ ] Verify each `agents/openai.yaml` matches its skill name and purpose.
- [ ] Re-run representative router, SPEC, PLAN, grill, frontend, React, Git,
  and PR scenarios with the completed skill set.
- [ ] Ask independent review subagents to check specification compliance and
  skill clarity; keep them read-only.
- [ ] Review Markdown links reported by `rg -n '\]\([^)]+' docs` and confirm
  moved or added current documentation remains discoverable.
- [ ] Record a manual single-source-of-truth review confirming that no current
  rule is authoritatively duplicated across multiple current documents.
- [ ] Inspect `git status`, full diffs, and changed file names.
- [ ] Search changed files for secrets, real identities, Firebase project IDs,
  tokens, private URLs, local absolute paths, and household data.
- [ ] Confirm developer-facing content is English.
- [ ] Confirm no approved SPEC or PLAN was modified during implementation.
- [ ] Update `docs/specifications/README.md` status to `Implemented`.
- [ ] Report every verification command and any check that was not run.

After the user approves this PLAN, update its status and approval table in the
same transition, update the index to `Plan Approved`, and then freeze the PLAN.
Implementation may begin only after those approval-recording edits complete.

## Acceptance-criteria mapping

| SPEC criterion | Plan task |
| --- | --- |
| Universal state machine and classification | Task 2 |
| SPEC workflow and index | Task 3 |
| Mandatory `grill-me` | Task 4 |
| Approved-SPEC-gated PLAN | Task 5 |
| Approval gates and immutable history | Tasks 2, 3, 5 |
| Current documentation synchronization/splitting | Task 9 |
| Bounded subagent delegation | Tasks 1, 2, 10 |
| Frontend boundaries | Task 6 |
| Vite React guidance | Task 7 |
| Git and PR authorization/privacy | Task 8 |
| Structural validation | Task 10 |
| No staging/publication | Global constraints and Task 10 |

## Verification commands

Run every new skill through:

```bash
for skill in creating-specifications creating-plans grill-me frontend-architecture react-best-practices git-conventions pr-conventions; do
  python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/quick_validate.py" \
    ".agents/skills/$skill"
done
```

Inspect repository state:

```bash
git status --short
git diff -- AGENTS.md .agents/skills docs
rg --files .agents/skills | sort
rg -n \
  '(BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|AIza[0-9A-Za-z_-]{35}|firebaseapp\\.com|[0-9]+-[a-z0-9]+\\.apps\\.googleusercontent\\.com|https://[^ ]*firebaseio\\.com|gh[pousr]_[0-9A-Za-z]{20,}|sk-[0-9A-Za-z_-]{20,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}|/Users/[^/[:space:]]+|/home/[^/[:space:]]+)' \
  AGENTS.md .agents/skills docs
rg -n '\]\([^)]+' docs
```

Review every match as potential public configuration or sensitive data without
printing secret values beyond the already-visible matched line. Household
inventory, real names, Firebase UIDs, and context-dependent identifiers require
manual full-diff review because a reliable generic regex would produce unsafe
false confidence.

## Risks

- Overly broad router text could consume context or duplicate Superpowers.
  Keep `AGENTS.md` short and move detail into skills.
- Conflicting generic commit instructions could bypass repository policy.
  Repeat the project override at router and execution boundaries.
- Skill tests can become self-fulfilling. Preserve no-guidance controls and use
  fresh-context agents.
- Shared-workspace subagents can conflict. Assign non-overlapping files or
  read-only review scopes.
- Current documentation can fragment. Split only when navigation or ownership
  materially improves and retain an index.

## Approval

| Role | Status |
| --- | --- |
| User | Approved on 2026-07-09 |
| Engineering agent | Ready for review |
