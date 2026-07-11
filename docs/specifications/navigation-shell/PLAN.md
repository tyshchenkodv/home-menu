# Navigation shell — implementation plan

| Field | Value |
| --- | --- |
| Slug | `navigation-shell` |
| Status | Approved |
| Spec | [SPEC.md](./SPEC.md) (Approved 2026-07-10) |
| Created | 2026-07-10 |

## Goal

Deliver the responsive navigation shell, the complete role-aware route tree
with placeholder screens for every planned feature, a real Settings screen for
the existing language/theme controls, and a login screen free of in-app chrome
— with no domain logic. Implements the approved [SPEC](./SPEC.md).

## Architecture, stack, constraints

- Stack unchanged: React, TypeScript, Vite, Material UI, `HashRouter`,
  i18next, MUI CSS-variable theme (`colorSchemeSelector: 'data'`,
  `defaultColorScheme: 'light'`).
- Dependency direction preserved: `app → features → domain`, with `shared` and
  `infrastructure` as documented in `docs/02-architecture.md`. This change
  touches `app`, `features`, and `shared` only. No `domain` or
  `infrastructure` change.
- Global constraints: named exports only; exact dependency versions; one
  component per file in its own folder; `sx` values in a sibling styles file
  typed `Record<string, SxProps<Theme>>`; every user-facing string in both
  `uk` and `en` (`uk` default, `en` fallback), never inline; no secrets,
  identities, or household data.
- No new runtime dependency is required; all needed MUI components
  (`Drawer`, `BottomNavigation`, `BottomNavigationAction`, `List`,
  `useMediaQuery`) ship with the pinned `@mui/material`.

## Scope

In scope: navigation shell, route tree, placeholder screens, real Settings
screen, header relocation, login without chrome, active-profile gating, i18n,
tests, documentation.

Inherited non-goals (from SPEC): no domain logic, no Firestore schema/converter/
query/index/Rule/transaction, no real feature behavior, no meal-times
persistence, no login switchers, no authorization-model change (guards stay
UX-only).

## Deep impact analysis

| Area | Planning detail |
| --- | --- |
| Architecture | New `shared/components/AppShell/` layout component (header + responsive nav + `Outlet`) with nested nav subcomponents, a nav-destination constant/type/util set, and a shared `FeaturePlaceholder`. `AppHeader` moves from `app/providers/AppProviders.tsx` into `AppShell`. New `app/RootRedirect.tsx` (composition-root routing helper). New guard `features/auth/RequireActiveProfile.tsx`. New feature folders `features/{menu,orders,admin-orders,batches,cooking-requests,admin-dashboard,settings}/` (each `pages/` only). `features/admin-inventory/pages/AdminHomePage.tsx` (+ `.styles.ts`) deleted. Router rewritten to a gated layout route. |
| Data/domain | None. Role read from existing `UserProfile.role`/`active` via `useAuth`; no new shapes, invariants, time, or concurrency. |
| Firebase | None. No converter, query, index, Rule, Auth, or transaction change; no emulator test change. |
| Migration | Additive except: `AdminHomePage` removed (interim UI, no data); active-profile gate newly blocks inactive authenticated users (no such user route exists yet — intended tightening). Rollback = revert the branch; no data migration. |
| Privacy/i18n | No personal/household data; all new copy is generic UI text. New keys added to both `uk` and `en`; `adminHome.*` keys removed from both. `src/locales/__tests__/localeParity.test.ts` must stay green. |
| UX | Routes and role-aware landing redirect; responsive `BottomNavigation` (mobile, admin “4 + More”) ↔ persistent `Drawer` (`md`+); active destination emphasized with `primary` and exposed to assistive tech; loading state during auth resolution; login renders no header/nav/switcher; explicit ready/loading states on every screen. |
| Quality | Component tests (Vitest + Testing Library) for guard, redirect, shell (role destinations, responsive, active, overflow, login-no-chrome), Settings, placeholders, and locale parity; existing `routeGuards.test.tsx` and `App.test.tsx` updated; final `npm run verify` gate. |

## Conflict resolution

- **Header placement vs. login chrome.** `AppProviders` currently renders
  `AppHeader` globally, so it appears on `/login`. Resolution: relocate
  `AppHeader` into `AppShell` (inside the gated layout route); `/login` sits
  outside the layout and renders no header. Theme/language on `/login` resolve
  through the existing i18next storage detector and MUI color-scheme storage
  (persisted value or `uk`/`light` default) with no controls — no forcing
  logic and no writes.
- **Guard duplication.** Today each route wraps `RequireAuth`/`RequireAdmin`
  individually. Resolution: gate once at the layout route with
  `RequireActiveProfile` (authenticated + provisioned + active), and keep
  `RequireAdmin` only around admin routes. This satisfies the SPEC “everything
  except `/login` is gated” decision and removes per-route auth duplication.
- **Responsive testing.** `src/test/setup.ts` does not define
  `window.matchMedia`, which MUI `useMediaQuery` needs. Resolution: add a
  configurable `matchMedia` mock to `setup.ts` (defaulting to “no match” = the
  mobile branch), and let shell tests override it to assert the `md`+ drawer
  branch. This is a test-infrastructure change, not runtime behavior.
- No other conflicts found (no data, schema, or concurrency surface).

## Affected paths and interfaces

New:

- `src/shared/components/AppShell/AppShell.tsx` + `AppShell.styles.ts`
- `src/shared/components/AppShell/types/navigationDestination.ts`
- `src/shared/components/AppShell/constants/navigationDestinations.ts`
- `src/shared/components/AppShell/utils/selectDestinations.ts`
- `src/shared/components/AppShell/components/AppNavDrawer/AppNavDrawer.tsx` (+ `styles.ts`)
- `src/shared/components/AppShell/components/AppNavBottom/AppNavBottom.tsx` (+ `styles.ts`)
- `src/shared/components/AppShell/components/AppNavMore/AppNavMore.tsx` (+ `styles.ts`)
- `src/shared/components/FeaturePlaceholder/FeaturePlaceholder.tsx` (+ `styles.ts` if needed)
- `src/app/RootRedirect.tsx`
- `src/features/auth/RequireActiveProfile.tsx`
- `src/features/{menu,orders,admin-orders,batches,cooking-requests,admin-dashboard}/pages/<Name>Page.tsx`
- `src/features/settings/pages/SettingsPage.tsx` (+ `SettingsPage.styles.ts`)
- Test files colocated per existing convention (see tasks).

Changed:

- `src/app/router.tsx` — layout route, gating, full route tree.
- `src/app/providers/AppProviders.tsx` — remove `AppHeader`.
- `src/locales/uk/translation.json`, `src/locales/en/translation.json`.
- `src/features/auth/__tests__/routeGuards.test.tsx`, `src/app/__tests__/App.test.tsx` — updated expectations.
- `src/test/setup.ts` — `matchMedia` mock.
- Docs: `docs/design/README.md`, `docs/02-architecture.md`, `docs/05-components-and-flows.md`.

Deleted:

- `src/features/admin-inventory/pages/AdminHomePage.tsx` + `AdminHomePage.styles.ts` and any test referencing it.

Key interfaces:

```ts
// navigationDestination.ts
import type { SvgIconComponent } from '@mui/icons-material';
import type { UserRole } from '../../../types/userProfile';

export interface NavigationDestination {
  key: string;          // stable id, e.g. 'dashboard'
  path: string;         // route path
  labelKey: string;     // i18next key
  Icon: SvgIconComponent;
  roles: UserRole[];    // roles that see this destination
  mobilePrimary: boolean; // shown directly in BottomNavigation (vs. under "More")
}

// selectDestinations.ts
export const selectDestinations: (role: UserRole) => NavigationDestination[];
// returns role-visible destinations in declared order

// RootRedirect.tsx — reads useAuth(); Navigate to '/admin' (admin) or '/menu' (user); loading state while resolving
// RequireActiveProfile.tsx — { children }: loading -> AuthLoadingState; unauthenticated -> <Navigate to="/login">; unprovisioned/inactive -> <AccessDeniedState>; else children
```

## Tasks

Each task is independently reviewable. Test-first where behavior changes;
run focused tests for RED/GREEN, then proportionate broader checks.

### T1 — i18n resources

- [ ] Add to `uk` and `en` `translation.json`, matching keys in both:
  - `nav`: `dashboard`, `menu`, `orders`, `myOrders`, `batches`, `requests`,
    `settings`, `more` (keep existing `inventory`, `history`, `login`, `admin`).
  - `screens`: `comingSoon` (shared placeholder message) and `title` per
    placeholder screen: `menu`, `orders`, `adminOrders`, `batches`,
    `cookingRequests`, `dashboard`.
  - `settings`: `title`, `language`, `theme`, `mealTimes`, `mealTimesComingSoon`.
- [ ] Remove the `adminHome.*` block from both locales.
- [ ] RED→GREEN: run `npx vitest run src/locales` — locale-parity test must be
  green (equal key sets in both locales). If it flags the removed/added keys,
  fix until green.
- Deliverable: both locale files updated symmetrically.

### T2 — shared `FeaturePlaceholder`

- [ ] Create `FeaturePlaceholder` rendering a localized `h1` title plus
  `StatePlaceholder variant="sleeping"` with the shared `screens.comingSoon`
  message. Props: `{ titleKey: string }`.
- [ ] Test `FeaturePlaceholder.test.tsx`: given `titleKey`, renders the
  translated heading (role `heading`) and the coming-soon text.
- [ ] RED first (component absent), then implement to GREEN:
  `npx vitest run src/shared/components/FeaturePlaceholder`.

### T3 — placeholder feature pages

- [ ] Create six pages, each a thin wrapper over `FeaturePlaceholder` with its
  title key: `MenuPage` (`screens.title.menu`), `OrdersPage`
  (`screens.title.orders`), `AdminOrdersPage` (`screens.title.adminOrders`),
  `BatchesPage` (`screens.title.batches`), `CookingRequestsPage`
  (`screens.title.cookingRequests`), `AdminDashboardPage`
  (`screens.title.dashboard`), under
  `features/<feature>/pages/<Name>Page.tsx`.
- [ ] One test per page (or a table-driven test) asserting the page renders its
  own translated heading. Location: `features/<feature>/__tests__/`.
- [ ] RED→GREEN per feature: `npx vitest run src/features/<feature>`.

### T4 — `RequireActiveProfile` guard

- [ ] Create `features/auth/RequireActiveProfile.tsx`: `status === 'loading'` →
  `AuthLoadingState`; `unauthenticated` → `<Navigate to="/login" replace/>`;
  profile `null` or `active === false` → `<AccessDeniedState/>`; otherwise
  `children`. Does **not** check role.
- [ ] Test `features/auth/__tests__/requireActiveProfile.test.tsx` mirroring the
  existing `routeGuards` mock pattern: active user → children; inactive →
  access-denied; unprovisioned → access-denied; unauthenticated → login;
  loading → loading state.
- [ ] RED→GREEN: `npx vitest run src/features/auth`.

### T5 — `RootRedirect`

- [ ] Create `app/RootRedirect.tsx`: `useAuth()`; while `status === 'loading'`
  render `StatePlaceholder variant="sleeping"` (message `common.loading`);
  admin → `<Navigate to="/admin" replace/>`; user → `<Navigate to="/menu" replace/>`.
- [ ] Test asserting redirect target per role and the loading state (can be
  covered via the router integration test in T8; a focused unit test is
  optional if it needs less mocking).
- [ ] RED→GREEN with the chosen test location.

### T6 — `AppShell` and responsive navigation

- [ ] Add `window.matchMedia` mock to `src/test/setup.ts` (configurable;
  default no-match = mobile branch).
- [ ] Create `types/navigationDestination.ts`,
  `constants/navigationDestinations.ts` (declare all destinations with role
  membership and `mobilePrimary` flags — admin primaries: Dashboard, Menu,
  Orders, Inventory; admin overflow: Batches, Cooking requests, Settings; user
  set: Menu, My orders, Settings — all `mobilePrimary`), and
  `utils/selectDestinations.ts`.
- [ ] Test `selectDestinations.test.ts` (pure): admin gets the full ordered
  set; user gets exactly Menu/My orders/Settings; no cross-role leakage.
- [ ] Create `AppNavDrawer` (persistent `Drawer` + `List` of all role
  destinations, active item via `useLocation`, `primary` emphasis),
  `AppNavBottom` (`BottomNavigation` of mobile-primary destinations plus a
  “More” action when overflow exists), and `AppNavMore` (temporary drawer/sheet
  listing overflow destinations). Each destination is a router `Link`/`NavLink`
  with an accessible name; the nav container is a `nav` landmark with an
  accessible name; the current destination exposes `aria-current`.
- [ ] Create `AppShell.tsx`: renders `AppHeader`, the responsive nav
  (`useMediaQuery(theme.breakpoints.up('md'))` → drawer vs. bottom), and
  `<Outlet/>`. Reads role from `useAuth` to pick the destination set.
- [ ] Remove `AppHeader` from `AppProviders.tsx`.
- [ ] Tests `AppShell.test.tsx`: (a) admin sees admin destinations, user sees
  user set; (b) mobile admin shows 4 primaries + “More”, opening it reveals
  overflow; (c) user mobile shows all three, no “More”; (d) `md`+ (matchMedia
  override) renders the drawer with every destination; (e) active route is
  marked current.
- [ ] RED→GREEN: `npx vitest run src/shared/components/AppShell`.

### T7 — Settings screen

- [ ] Create `features/settings/pages/SettingsPage.tsx` (+ styles): localized
  `settings.title`; a Language section reusing `LanguageSwitcher`; a Theme
  section reusing `ColorSchemeToggle`; a Meal-times section rendering the
  `settings.mealTimesComingSoon` placeholder (no control).
- [ ] Test `features/settings/__tests__/SettingsPage.test.tsx`: renders title,
  language control (role/name query), theme control, and the meal-times
  placeholder text.
- [ ] RED→GREEN: `npx vitest run src/features/settings`.

### T8 — Router wiring and cleanup

- [ ] Rewrite `src/app/router.tsx`:
  - `/login` → `LoginPage` (ungated).
  - Gated layout route `element={<RequireActiveProfile><AppShell/></RequireActiveProfile>}` containing:
    `/` → `RootRedirect`; `/menu` → `MenuPage`; `/orders` → `OrdersPage`;
    `/settings` → `SettingsPage`; and admin routes each wrapped in
    `RequireAdmin`: `/admin` → `AdminDashboardPage`, `/admin/orders` →
    `AdminOrdersPage`, `/admin/batches` → `BatchesPage`, `/admin/requests` →
    `CookingRequestsPage`, `/admin/inventory` → `InventoryPage`,
    `/admin/inventory/history` → `InventoryHistoryPage`.
- [ ] Delete `AdminHomePage.tsx` + `AdminHomePage.styles.ts` and any test that
  targets it.
- [ ] Update `src/features/auth/__tests__/routeGuards.test.tsx`: admin landing
  is now the Dashboard (`screens.title.dashboard`) at `/admin`; keep the
  inventory-reachability check by navigating to `/admin/inventory`; add a case
  that an active `user` reaches `/menu` (not access-denied) and is redirected
  from `/` to `/menu`; keep unauthenticated → login and inactive →
  access-denied.
- [ ] Update `src/app/__tests__/App.test.tsx` if the default-route assertion
  shifts (unauthenticated still lands on login — likely unchanged).
- [ ] RED→GREEN: `npx vitest run src/features/auth src/app`.

### T9 — Documentation

- [ ] `docs/design/README.md`: move the responsive navigation shell and
  Settings screen from “Not yet adopted” to the adopted status section;
  mark open decision 3 (nav switch point) resolved at `md`.
- [ ] `docs/02-architecture.md`: document the `AppShell` layout route, the
  gated route tree, and header relocation.
- [ ] `docs/05-components-and-flows.md`: record the navigation destinations per
  role, placeholder screens, and Settings composition.
- [ ] Structural check: links resolve and no stale `AdminHomePage`/`adminHome`
  references remain (`grep -rn "AdminHomePage\|adminHome" src docs`).

### T10 — Verification gate

- [ ] `npm run fix` for any style; never hand-format.
- [ ] `npm run verify` (typecheck, lint+Prettier, format:check, test, build) —
  must pass. Report anything not run.
- [ ] On green, mark the index row `Implemented` (separate from PLAN approval).

## Acceptance-criteria mapping

| SPEC acceptance criterion | Task(s) | Verification |
| --- | --- | --- |
| BottomNav below `md`, Drawer at `md`+ | T6 | `AppShell.test.tsx` responsive cases |
| Role-appropriate destinations | T6 | `selectDestinations.test.ts`, `AppShell.test.tsx` |
| Mobile admin “4 + More”; user 3 direct | T6 | `AppShell.test.tsx` overflow cases |
| Active destination emphasized + current state | T6 | `AppShell.test.tsx` active case |
| `/` role redirect + loading state | T5, T8 | `routeGuards.test.tsx`, RootRedirect test |
| Every destination resolves to a screen | T3, T7, T8 | per-feature tests, router test |
| Placeholder shows own title + coming-soon | T2, T3 | `FeaturePlaceholder`/page tests |
| Settings language/theme + meal-times placeholder | T7 | `SettingsPage.test.tsx` |
| Controls mirrored in header and Settings, one state | T6, T7 | header intact + Settings test |
| `/login` no chrome, resolved theme/lang | T6, T8 | `App.test.tsx`, `routeGuards.test.tsx` |
| Every route except `/login` requires active profile | T4, T8 | `requireActiveProfile.test.tsx`, `routeGuards.test.tsx` |
| `AdminHomePage` gone; `/admin` = Dashboard | T8 | `routeGuards.test.tsx`, grep check |
| New strings in both locales; parity green | T1 | `src/locales` test |
| `npm run verify` passes | T10 | gate |

## Documentation, rollout, rollback, risks

- **Documentation:** T9 updates design, architecture, and components-and-flows
  docs; SPEC/PLAN remain immutable historical records.
- **Rollout:** single additive branch; no feature flag, no data migration.
- **Rollback:** revert the branch; nothing persisted changes.
- **Risks:** (1) MUI `useMediaQuery` in jsdom — mitigated by the `matchMedia`
  mock (T6 conflict resolution). (2) Icon import names may differ from the
  intended MUI set — resolved during T6 by importing available
  `@mui/icons-material` symbols; no behavior impact. (3) Existing tests assume
  `/admin` = inventory card list — explicitly updated in T8.

## Non-blocking questions

None. All SPEC open questions were resolved before approval.

## Approval

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Author | Claude (agent) | 2026-07-10 | Draft |
| Approver | User | 2026-07-10 | Approved |
