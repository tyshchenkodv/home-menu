# Navigation shell and application scaffold

| Field | Value |
| --- | --- |
| Slug | `navigation-shell` |
| Status | Approved |
| Request | Close out the remaining design-only work (responsive navigation shell, Settings screen, full route scaffold) before returning to logic features |
| Created | 2026-07-10 |
| Related | [Design system foundation](../design-system-foundation/SPEC.md), [Admin inventory design retrofit](../admin-inventory-design-retrofit/SPEC.md) |

## Problem statement

The application has no navigation. `src/app/router.tsx` declares three
hard-coded admin routes (`/admin`, `/admin/inventory`,
`/admin/inventory/history`), each individually wrapped in `RequireAuth` /
`RequireAdmin`, and `/` unconditionally redirects to `/admin/inventory`. The
persistent `AppHeader` (brand, language switcher, theme toggle) renders
globally in `AppProviders`, including on `/login`.

The design (`docs/design/README.md`) canonises a responsive navigation shell
(`BottomNavigation` on mobile promoting to a persistent `Drawer` on wider
viewports), a Settings screen, and a screen catalog for the not-yet-built
features. `docs/design/README.md:47-48` lists these as tracked, unadopted
follow-ups, and item 3 in its open decisions defers the
`BottomNavigation` ↔ `Drawer` switch point.

Consequences today:

- there is no way to move between screens except by typing URLs;
- the `user` role has no destination at all — `/` sends every visitor into the
  admin inventory screen;
- future feature screens (Menu, Orders, Batches, Cooking requests, Dashboard,
  Settings) have no home in the route tree, so each future feature must also
  re-solve navigation.

This specification closes the design-only scaffold: the navigation shell, a
role-aware route map with placeholder screens for every planned feature, a
real Settings screen for the already-built language and theme controls, and a
login screen with no in-app chrome. It deliberately builds **no** domain logic;
placeholder screens display a "coming soon" state.

## Goals

1. Provide a responsive navigation shell that renders a `BottomNavigation`
   below the `md` breakpoint and a persistent `Drawer` at `md` and above.
2. Show role-appropriate navigation destinations: the full admin set for an
   active `admin`, the reduced set for a `user`.
3. Introduce a role-aware landing redirect from `/`: `admin` → `/admin`,
   `user` → `/menu`, with an explicit loading state while auth resolves.
4. Establish the complete route tree with a placeholder screen for every
   planned feature, so future feature work fills an existing screen rather than
   inventing navigation.
5. Deliver a working Settings screen hosting the existing language and theme
   controls, with the "default meal times" section shown as a placeholder.
6. Move `AppHeader` out of the global composition root into the authenticated
   shell so `/login` renders without header, navigation, or in-app controls.
7. Keep `/login` on the application's resolved theme and language (persisted
   value, or the `light` + `uk` defaults when storage is empty) with no
   switcher controls present.
8. Add every new user-facing string to both `uk` and `en` resources, with `uk`
   default and `en` fallback.

## Non-goals

- Any domain logic, data model, Firestore schema, converter, query, index,
  Security Rule, or transaction. No feature screen renders real data.
- Implementing Menu, Orders, Batches, Cooking requests, or Admin dashboard
  behavior. These get placeholder screens only.
- Persisting or editing default meal times (Settings shows that section as a
  placeholder; the real control is a later feature with its own SPEC).
- Changing the authorization model. `RequireAuth` / `RequireAdmin` remain
  UX-only guards; Firestore Security Rules stay the authorization boundary.
- Adding a language or theme switcher to `/login`.
- Changing the existing Inventory or Inventory History screens' behavior; they
  are only re-parented under the shell and reached through navigation.

## Workflow, screens, and route map

### Roles and destinations

Role comes from `profile.role` (`'admin' | 'user'`) on the existing
`UserProfile` (`src/shared/types/userProfile.ts`), read via `useAuth`.

**Administrator** navigation set (an admin can do everything a user can plus
admin work):

| Destination | Route | This SPEC |
| --- | --- | --- |
| Dashboard | `/admin` | Placeholder screen (`admin-dashboard`) |
| Menu | `/menu` | Placeholder screen (`menu`) |
| Orders | `/admin/orders` | Placeholder screen (`admin-orders`) |
| Batches | `/admin/batches` | Placeholder screen (`batches`) |
| Cooking requests | `/admin/requests` | Placeholder screen (`cooking-requests`) |
| Inventory | `/admin/inventory` | Existing screen, re-parented |
| Settings | `/settings` | Real screen (language + theme) |

Inventory History (`/admin/inventory/history`) remains reachable as a
**sub-page of Inventory**, not a top-level navigation destination, preserving
its current entry points.

**User** navigation set:

| Destination | Route | This SPEC |
| --- | --- | --- |
| Menu | `/menu` | Placeholder screen (`menu`) |
| My orders | `/orders` | Placeholder screen (`orders`) |
| Settings | `/settings` | Real screen (language + theme) |

`/` redirects by role after auth resolves: `admin` → `/admin`,
`user` → `/menu`. While `status === 'loading'`, render a loading placeholder
rather than redirecting.

Admin order processing and the user "my orders" view are **separate features**
with separate screens: `admin-orders` (`/admin/orders`) is the administrator's
processing/overview surface for every order; `orders` (`/orders`) is the
signed-in user's read view of their own orders. `menu` and `settings` are each
a single screen shared by both roles.

### Guards

Every route except `/login` requires an **authenticated and active** profile.
`RequireAuth` is extended (or paired with an active-profile guard) to also
reject `profile.active === false`, matching the check `RequireAdmin` already
performs, so an inactive user cannot reach any in-app screen. Firestore
Security Rules remain the authorization boundary; these guards stay UX-only.

### Placeholder screens

Every placeholder screen renders its own localized title plus the shared
`StatePlaceholder` (`variant="sleeping"`, a localized "in development"
message). Placeholders exist so navigation targets are real; each future
feature SPEC replaces its placeholder with the real screen inside the same
feature folder.

### Settings screen

Settings renders real, working sections that reuse existing shared controls:

- **Language** — reuses `LanguageSwitcher` (`src/shared/components/LanguageSwitcher/`).
- **Theme** — reuses `ColorSchemeToggle` (`src/shared/components/ColorSchemeToggle/`).
- **Default meal times** — placeholder section labeled "coming soon"; no
  control, no persistence.

The same controls remain in `AppHeader` for quick access; both the header
control and the Settings section read and write the same underlying state
(i18next language, MUI color scheme), so no divergence is possible.

### Login screen

`AppHeader` moves into the authenticated shell, so `/login` renders none of it.
`/login` uses the application's normally resolved theme and language — the
persisted value if present, otherwise the `light` + `uk` defaults — and exposes
no switcher. No forced override and no write to persisted preferences occurs on
`/login`.

## UX and accessibility

- The shell is the primary mobile-first surface. Below `md`: a fixed
  `BottomNavigation`; at `md` and above: a persistent left `Drawer` with the
  content area beside it (design `06b Responsive`).
- **Overflow:** the admin set (7 destinations) exceeds a comfortable
  `BottomNavigation` width. On mobile, show four primary destinations
  (Dashboard, Menu, Orders, Inventory) plus a fifth "More" action opening a
  temporary drawer/sheet with the remainder (Batches, Cooking requests,
  Settings). The user set (3 destinations) fits directly with no "More". At
  `md`+, the `Drawer` lists every destination.
- The active destination is emphasized with `primary` (brand rose), per the
  design's semantic color mapping.
- Every screen handles its states explicitly: placeholder screens are a
  ready state that shows the "in development" placeholder; the landing redirect
  shows a loading state while auth resolves; guards keep their existing
  loading / access-denied / unauthenticated states.
- Accessibility: the shell uses a `nav` landmark with an accessible name, each
  destination is a real link with an accessible name and a visible focus ring,
  the current destination exposes an active/current state to assistive tech,
  and the "More" control is a labeled button whose expanded/collapsed state is
  conveyed. Drawer/sheet focus behavior follows MUI defaults.
- All labels, titles, messages, and accessible names come from i18next; none
  are inlined in components.

## Deep impact analysis

| Area | Assessment |
| --- | --- |
| Architecture | `app/router.tsx` gains a layout route rendering the new `AppShell`. `AppShell` lives in `shared/components/AppShell/` (a genuinely app-wide surface consumed by every authenticated route) with its navigation subcomponents nested per the one-component-one-folder rule. `AppHeader` moves out of `app/providers/AppProviders.tsx` into the shell. New feature folders `features/{menu,admin-orders,orders,batches,cooking-requests,admin-dashboard,settings}/` are created, each with a `pages/<Name>Page.tsx` placeholder (only `pages/` for now; other folders added when real logic arrives). `admin-orders` and `orders` are separate features (admin processing vs. user read view). The interim `AdminHomePage` in `features/admin-inventory/pages/` is deleted, superseded by the `admin-dashboard` placeholder. No `domain/` or `infrastructure/` change. |
| Firebase | None. No schema, converter, query, index, Rule, Auth, or transaction change. |
| Domain | None. No invariant, unit, status, time, or concurrency logic is added; placeholder screens are inert. |
| Privacy | No personal data, identifiers, credentials, or household data. All new strings are generic UI copy in both locales. |
| i18n | New keys for navigation destination labels, placeholder screen titles, the shared "in development" message, and Settings section labels/placeholder, added to both `uk` and `en`. `uk` stays default, `en` fallback. Locale-parity test (`src/locales/__tests__/localeParity.test.ts`) must stay green. |
| UX | New routes and a role-aware landing redirect; navigation destinations gated by role; responsive `BottomNavigation` ↔ `Drawer`; login stripped of chrome. No destructive actions introduced. |
| Compatibility | Mostly additive. Existing `/admin/inventory` and `/admin/inventory/history` routes and behavior are preserved, only re-parented under the shell and reachable via navigation. The interim `AdminHomePage` card list at `/admin` is removed and replaced by the Dashboard placeholder. The active-profile guard change may newly block an inactive authenticated user who previously reached user routes (there are none yet), which is the intended tightening. Rollback is removal of the shell and routes. |
| Quality | Component tests for the shell (role-based destinations, responsive rendering, active state, "More" overflow, redirect-by-role, login without chrome), a Settings screen test, placeholder screen presence, and locale-parity coverage for new keys. `npm run verify` must pass. |

## Acceptance criteria

- [ ] Below `md`, an authenticated screen renders a `BottomNavigation`; at
      `md`+, a persistent `Drawer`.
- [ ] An active `admin` sees the admin destination set; a `user` sees the user
      set; neither sees the other's admin-only destinations in the nav.
- [ ] On mobile, the admin nav shows four primary destinations plus a "More"
      control that reveals the remaining destinations; the user nav shows all
      three directly.
- [ ] The active destination is visually emphasized and exposes a current
      state to assistive technology.
- [ ] `/` redirects an `admin` to `/admin` and a `user` to `/menu` once auth
      resolves, showing a loading state while `status === 'loading'`.
- [ ] Every planned destination resolves to a screen: Dashboard, Menu, Orders,
      Batches, Cooking requests, Inventory (+ History sub-page), Settings.
- [ ] Each placeholder screen shows its own localized title and the shared
      "in development" placeholder.
- [ ] Settings renders working language and theme controls and a placeholder
      "default meal times" section.
- [ ] Language and theme controls remain in the header and are mirrored in
      Settings, both reflecting one shared state.
- [ ] `/login` renders no header, navigation, or switcher, and shows the app's
      resolved theme/language (persisted value, or `light` + `uk` when storage
      is empty).
- [ ] Every route except `/login` requires an authenticated, active profile; an
      inactive profile cannot reach any in-app screen.
- [ ] The interim `AdminHomePage` no longer exists; `/admin` resolves to the
      Dashboard placeholder.
- [ ] All new strings exist in both `uk` and `en`; locale-parity test passes.
- [ ] `npm run verify` passes.

## Milestones

1. **Shell** — `AppShell` layout route, responsive `BottomNavigation` ↔
   `Drawer`, `AppHeader` relocation, login stripped of chrome.
2. **Route map** — role-aware landing redirect, full route tree, feature
   placeholder screens.
3. **Settings** — real language/theme sections, meal-times placeholder.
4. **i18n, tests, docs, verification** — both locales, component tests,
   documentation update, `npm run verify`.

## Open questions (non-blocking)

None. The three prior open questions are resolved and folded into the
specification:

- **O1 (resolved)** — admin order processing (`admin-orders`, `/admin/orders`)
  and the user "my orders" read view (`orders`, `/orders`) are **separate
  features** with separate screens.
- **O2 (resolved)** — the interim `AdminHomePage` is **deleted**, superseded by
  the `admin-dashboard` Dashboard placeholder.
- **O3 (resolved)** — every route except `/login` requires an **authenticated
  and active** profile; the active check is added to the shared auth guard.

## References

- `docs/01-overview.md` — roles, screens, mobile-first, `uk` default.
- `docs/design/README.md` — theme, screen catalog (`05 Screens`), responsive
  navigation (`06b`), unadopted follow-ups (lines 47-48), open decision 3.
- `docs/02-architecture.md` — layer boundaries.
- `src/app/router.tsx`, `src/app/providers/AppProviders.tsx` — current routing
  and header placement.
- `src/features/auth/{useAuth.ts,RequireAuth.tsx,RequireAdmin.tsx}` — role and
  guards.
- `src/shared/components/{AppHeader,LanguageSwitcher,ColorSchemeToggle,StatePlaceholder}/`
  — reused controls.

## Approval

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Author | Claude (agent) | 2026-07-10 | Draft |
| Approver | User | 2026-07-10 | Approved |
