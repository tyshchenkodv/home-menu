---
name: react-best-practices
description: Use when implementing, refactoring, or reviewing Home Menu React SPA components, hooks, rendering behavior, effects, data fetching, performance, routing, accessibility, or Vite browser code.
---

# React Best Practices

Apply this with `frontend-architecture`. Keep the guidance browser-SPA focused:
Home Menu uses React, Vite, Material UI, HashRouter, Firebase Auth, Firestore,
and i18next. Do not introduce Next.js, React Server Components, Server Actions,
server caching, Vercel hosting assumptions, Cloud Functions, or paid services
unless a separate architecture decision approves them.

This skill adapts the client-side practices from Vercel Labs' React best
practice guidance to Home Menu's Vite SPA constraints.

## Data flow and waterfalls

- Start independent async work in parallel. Do not await request A before
  request B unless B depends on A's result.
- Prefer one feature hook that composes related subscriptions or reads and
  exposes a stable view model.
- Avoid render-triggered fetch chains where a parent waits, renders a child,
  and only then the child starts an independent request.
- Keep Firestore access behind typed infrastructure services and feature hooks;
  components consume hook results, not raw queries.
- Handle loading, empty, error, and ready states explicitly.

## State and effects

- Derive values during render when possible. Do not mirror props, query
  results, or translations into state with `useEffect`.
- Use state for user interaction or truly mutable local UI state.
- Keep effect dependency arrays honest; if a dependency is awkward, reshape the
  code rather than suppressing the dependency.
- Clean up subscriptions, timers, and event listeners.
- Prevent async races with cancellation or stale-result guards.
- Do not use effects for logic that belongs in event handlers or pure domain
  functions.

## Rendering and performance

- Use stable semantic keys, never array indexes for mutable lists.
- Split expensive or infrequently used UI with `lazy` only when it reduces
  initial work and preserves user experience.
- Prefer tree-shakeable imports and avoid pulling large libraries for small
  helpers.
- Use `useMemo`, `useCallback`, and `memo` only with evidence: expensive work,
  stable identities needed by memoized children, or profiler findings.
- Keep expensive filtering, grouping, and sorting in focused helpers or hooks
  so the dependency story is visible and testable.

## Component design

- One React component per `.tsx` file.
- Compose small components instead of adding boolean mode props that create
  many hidden variants.
- Keep pages thin: route params, hook calls, async-state wiring, and feature
  composition. Move forms, rows, dialogs, and cards into component files.
- Pass typed domain or view-model data. Avoid broad `any`, Firestore snapshots,
  or infrastructure objects in presentation props.
- Put component interfaces and reusable types in the nearest `types/` folder,
  not inline in component or hook files.

## Accessibility and i18n

- Prefer semantic elements and role/name queries. Add accessible names to
  icon-only buttons and interactive controls.
- Preserve keyboard access, focus visibility, dialog focus behavior, and touch
  targets.
- Keep every user-facing string out of components. Add matching `uk` and `en`
  translation keys.
- Do not concatenate translated fragments when grammar may differ between
  Ukrainian and English.

## Review checklist

- Are independent requests or subscriptions started in parallel?
- Is any effect mirroring props/query data that could be derived?
- Are effect dependencies complete and cleanup paths present?
- Are keys stable for mutable lists?
- Are memoization and lazy loading justified by current cost?
- Does the component follow one-component-per-file and separated types?
- Are all visible and accessible strings translated in both locales?
