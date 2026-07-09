---
name: frontend-architecture
description: Use when creating, changing, refactoring, or reviewing Home Menu React or TypeScript UI, routing, hooks, state, forms, components, feature structure, shared modules, or Firebase-facing frontend code.
---

# Frontend Architecture

Apply the architecture in `docs/02-architecture.md`. Keep code easy to locate,
change, test, and delete; do not create abstractions merely to satisfy a
diagram.

## Dependency direction

```text
app → features → domain
  ↘      ↓         ↑
   shared      infrastructure adapters
```

- `app/`: composition root, router, theme, and providers.
- `domain/`: pure rules and language-neutral types; no React, Firebase,
  Material UI, i18next, browser APIs, or infrastructure imports.
- `features/`: user workflows, pages, forms, view models, and feature hooks.
- `infrastructure/`: Firebase initialization, converters, typed queries,
  transactions, Auth adapters, timestamps, and technical errors.
- `shared/`: code with at least two real feature consumers and no domain
  ownership.

Presentation never issues raw Firestore queries. Feature/application hooks call
typed infrastructure services and pure domain functions. Firestore transaction
implementations re-read and validate invariants at the write boundary.

Do not import another feature’s internal files. Expose a small feature public
API only when a real consumer needs it. Avoid catch-all root `utils`, `types`,
or `components` buckets for domain-owned code.

## Feature shape

Use only folders needed by the feature:

```text
features/<feature-name>/
├── components/
├── hooks/
├── pages/
├── schemas/
├── types/
├── constants/
├── utils/
└── index.ts
```

Domain logic belongs under `domain/<domain-name>/`; Firebase details belong
under `infrastructure/firebase/<domain-name>/`.

Use kebab-case file and folder names. Export components and types with
PascalCase, hooks with `use` + camelCase, and other values with descriptive
camelCase names.

## File responsibility

- One React component per `.tsx` file. A page, dialog, form section, row, and
  reusable visual primitive each get their own file.
- Put every interface and reusable type in a focused file under the nearest
  `types/` folder. Do not define interfaces inside component or hook files.
- Put hooks, schemas, constants, and utilities in their corresponding folders
  and focused files.
- Keep one clear responsibility per file. Split orchestration, rendering,
  validation, and persistence instead of growing a “smart” component.
- Colocate feature-specific code. Promote it to `shared/` only after two real,
  independent consumers exist.
- Do not create proxy barrels that re-export another feature. A feature
  `index.ts` exposes only its intentional public API.

Prefer `const name = () => {}` for functions and components. More than three
parameters use one typed options object. Use braces for every control-flow
body, guard clauses to reduce nesting, and comments only for non-obvious
constraints or reasons.

## React and state

- React Context is limited to authentication/authorization and true
  application-wide configuration.
- Feature hooks own narrow `onSnapshot` subscriptions and cleanup.
- Do not copy Firestore data into a second global store.
- Keep local interaction state local; derive values instead of synchronizing
  redundant state.
- Keep pages thin: route parameters, data orchestration, async states, and
  feature composition. Move forms and reusable UI into feature components.
- Use composition instead of multiplying boolean mode props.

Use `react-best-practices` for performance, effects, waterfalls, and rendering
review.

## UI contract

- Use Material UI semantic theme tokens and responsive breakpoints; do not
  hardcode a light-only palette.
- Every screen handles loading, empty, error, and ready states explicitly.
- Use semantic HTML, visible focus, keyboard access, accessible names, and
  appropriate dialog focus behavior.
- Keep every user-facing label, validation message, aria-label, toast, dialog,
  and empty state out of components. Add matching keys to `uk` and `en`.
- Preserve `uk` as default and `en` as fallback.
- Keep persistence enums and user-generated data language-neutral.
- Use stable, business-meaningful test IDs only when role/name queries are not
  sufficient; repeated components need instance-specific IDs.

## SOLID, DRY, KISS, and YAGNI

- **Single responsibility:** split by reason to change, not arbitrary line
  count.
- **Open/closed and dependency inversion:** use composition and typed
  boundaries when multiple implementations or policies actually exist.
- **Interface segregation:** expose the smallest contract a consumer needs.
- **DRY:** remove duplicated knowledge, not merely similar-looking lines.
- **KISS:** choose the smallest structure that preserves boundaries.
- **YAGNI:** do not add generic factories, stores, registries, or wrappers for
  hypothetical reuse.

When principles compete, preserve correctness and clear ownership first, then
prefer the simpler implementation.

## Code style

Follow the instructions in `@.agents/skills/jsinfo-style/SKILL.md` verbatim —
that file is the single source of truth.

Additional repository conventions:

- Never use `export default` in application code; always use named exports
  (`export const LoginPage = ...`). Tool config files that require a default
  export (e.g. `vite.config.ts`) are the only exception.
- Dependency versions in `package.json` are exact (no `^`/`~` ranges) and new
  dependencies start at their latest published versions.

## Review checklist

- Does each file have one clear responsibility and each `.tsx` one component?
- Are types/interfaces, hooks, schemas, constants, and utilities separated?
- Does domain remain pure and Firebase remain behind typed infrastructure?
- Is feature-owned code colocated without deep cross-feature imports?
- Are all visible and accessible strings translated in both locales?
- Are async, responsive, theme, accessibility, and test states covered?
- Is every abstraction justified by current behavior or consumers?
- Is every file follow code style rules?
