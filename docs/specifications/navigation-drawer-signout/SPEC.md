# Unified left navigation drawer with sign-out

| Field | Value |
| --- | --- |
| Slug | `navigation-drawer-signout` |
| Status | Approved |
| Request | Add a way to sign out (to switch between users) and make the left navigation menu the single navigation surface on every viewport |
| Created | 2026-07-11 |
| Supersedes | Mobile navigation model of [Navigation shell](../navigation-shell/SPEC.md) (BottomNavigation + dashboard hub) |
| Related | [Navigation shell](../navigation-shell/SPEC.md), [Role migration to custom claims + no self-signup](../auth-custom-claims-migration/SPEC.md) |

## Problem statement

Two related gaps exist today.

1. **No sign-out affordance for a signed-in visitor.** `signOut()` exists in
   `authAdapter` and is only surfaced from `AccessDeniedState` (shown to
   unprovisioned/inactive/non-admin accounts). An authenticated, authorized
   user has no in-app control to sign out, so switching between the household's
   Google accounts requires clearing browser state manually. This is a real
   need for a shared-household app used by more than one person on the same
   device.

2. **The navigation model is split and asymmetric across viewports.**
   `AppShell` renders a permanent left `Drawer` at `md`+ but a `BottomNavigation`
   below it. The bottom navigation only fits `MOBILE_NAV_INLINE_LIMIT` items, so
   for the admin role (7 destinations) it shows a `mobilePrimary` subset and the
   remaining destinations (Dishes, Inventory, Batches, Settings) are only
   reachable through a mobile-only `HubLinks` block rendered on the admin
   dashboard. The result: destinations are duplicated, the dashboard carries
   navigation that is not conceptually part of the dashboard, and per-destination
   `mobilePrimary` / `mobileLabelKey` metadata exists solely to ration bottom-nav
   space.

We want one navigation surface — the left menu — present on every viewport,
holding every destination for the role, with sign-out living inside it. On
mobile the menu is hidden by default and opens as a temporary overlay from a
header control; on `md`+ it stays permanently visible as today.

## Goals

1. Provide an always-available way for an authenticated user to sign out from
   within the app chrome, so users can switch Google accounts on a shared
   device.
2. Make the left navigation drawer the single navigation surface for both roles
   on all viewport widths, listing every destination the role can reach.
3. On viewports below `md`, render the drawer as a temporary overlay opened from
   a hamburger control in the header and closed on destination selection, on
   backdrop tap, and on `Escape`.
4. On `md`+ viewports, preserve the current permanent, always-visible drawer.
5. Show the current account identity (email, falling back to display name when
   email is absent) inside the drawer, adjacent to the sign-out control, so the
   user can see who they are signed in as before switching.
6. Place the sign-out control pinned at the bottom of the drawer, visually
   separated from the navigation items.
7. Remove the now-redundant mobile `BottomNavigation` and the dashboard
   `HubLinks` block, and retire the navigation metadata that existed only to
   serve them.
8. Preserve existing navigation semantics: role-based destination filtering,
   active-route highlighting with `aria-current`, and pending/low-stock badge
   counts.

## Non-goals

- No change to routes, route guards, roles, or authorization logic.
- No change to how `signOut()` works in `authAdapter`, nor to the post-sign-out
  redirect (the existing auth-state subscription already routes a signed-out
  visitor to `/login`).
- No collapsible/rail behavior for the desktop drawer; it stays permanently
  open at `md`+.
- Language switcher and color-scheme toggle stay in the header; they do not move
  into the drawer.
- No account switcher, multi-account session memory, or "recently used
  accounts" — sign-out then sign-in is the switching mechanism.
- No new user-identity data source; identity is read from the existing Firebase
  Auth `User` already exposed by `useAuth`.

## Workflow and UX

### Desktop (`md` and up)

- The left drawer is permanent and always visible, unchanged in placement.
- It now additionally renders, pinned below the navigation list: a divider, the
  current-account identity line, and a sign-out control.

### Mobile (below `md`)

- The drawer is hidden by default. The header shows a hamburger (menu) icon
  button on its leading side.
- Activating the hamburger opens the drawer as a temporary overlay with a
  backdrop.
- The drawer closes when the user selects a destination, taps the backdrop, or
  presses `Escape`.
- The bottom navigation is removed. The admin dashboard no longer renders the
  hub links; every admin destination is reachable from the drawer.

### Drawer contents (both viewports)

1. Navigation items for the role, in the existing declared order, with active
   highlighting (`aria-current="page"`) and badge counts.
2. A divider.
3. Current-account identity: the signed-in email, falling back to display name,
   falling back to a generic localized "Signed in" label when neither is
   present.
4. A sign-out control labeled with the existing `auth.signOut` key that calls
   `signOut()`.

### States and accessibility

- Loading/empty/error: navigation renders whenever a role is known; no new
  async states are introduced. When `role` is not yet known the drawer shows no
  destinations (unchanged).
- The hamburger control has a localized accessible name and standard
  expanded/collapsed semantics for a disclosure that controls the drawer.
- The temporary drawer traps focus and restores focus to the trigger on close
  (MUI `Drawer` default behavior).
- The identity line is not an interactive control; it is readable text.
- Sign-out is a routine (non-destructive) action and needs no confirmation
  dialog.

## Impact analysis

| Area | Assessment |
| --- | --- |
| Architecture | Changes are confined to `shared/components/AppShell` and its subcomponents, `shared/components/AppHeader`, and `features/admin-dashboard`. `AppShell` gains open/close state for the mobile drawer and passes an open handler to the header (or a shared control). `AppNavDrawer` becomes the single nav renderer for both the permanent (`md`+) and temporary (mobile) variants and gains the identity + sign-out footer. `AppNavBottom` and its `styles`/`constants` (`MOBILE_NAV_INLINE_LIMIT`) are removed. `HubLinks` is removed from `AdminDashboardPage` and deleted. The `SignOutButton` created earlier is repurposed/inlined into the drawer footer rather than the header. |
| Firebase | None. No schema, converter, query, index, Rules, Auth, or transaction change. `signOut()` is unchanged. |
| Domain | None. No domain rule, invariant, unit, status, or concurrency change. |
| Privacy | The drawer displays the signed-in account's own email to that same signed-in user in their own session — not persisted, logged, or shared, and not committed to the repo. No fixture or documentation may contain a real address; examples use `example.test`. Note: `AuthContext` currently contains a `console.log(tokenResult)` that logs claims to the browser console — out of scope here, flagged as a separate cleanup. |
| i18n | New keys needed in both `uk` and `en`: hamburger accessible name (e.g. `nav.openMenu`) and a fallback identity label (e.g. `auth.signedIn`). `auth.signOut` already exists in both locales. `dashboard.hub.title` becomes unused and is removed from both locales. Locale parity tests must stay green. |
| UX | No route or permission change. Removes bottom navigation and the dashboard hub; adds a hamburger and a drawer footer. Responsive switch point stays at the existing `md` breakpoint. Sign-out is non-destructive; no confirm dialog. |
| Compatibility | Purely a client-side navigation/presentation change; additive and immediately effective, no migration, no deployed-data concern. Rollback is reverting the change. |
| Quality | Update/replace `AppShell` tests (drawer open/close on mobile, no bottom nav, footer present). Update `AdminDashboardPage` tests (no hub links). Remove `AppNavBottom` and `HubLinks` tests. Add drawer footer tests (identity line, sign-out invokes `signOut`). Update the affected design docs (`docs/design/screens/shared-patterns.md`, `admin-dashboard.md`, and `docs/design/README.md`) to record the unified drawer model superseding BottomNavigation. Run `npm run verify`. |

## Acceptance criteria

- [ ] An authenticated user sees a sign-out control inside the left drawer on
      both mobile and desktop; activating it calls `signOut()` and the app
      returns to `/login`.
- [ ] The drawer shows the current account email (or display-name/label
      fallback) adjacent to the sign-out control.
- [ ] On `md`+ the drawer is permanent and always visible (unchanged).
- [ ] On viewports below `md` the drawer is hidden by default, opens from a
      header hamburger control, and closes on destination selection, backdrop
      tap, and `Escape`.
- [ ] Every destination for the current role is reachable from the drawer on
      mobile; there is no bottom navigation.
- [ ] The admin dashboard no longer renders hub links and contains no
      navigation block.
- [ ] Role filtering, active-route `aria-current`, and badge counts behave as
      before in the drawer.
- [ ] `nav.openMenu` and `auth.signedIn` exist in both `uk` and `en`; the unused
      `dashboard.hub.*` keys are removed; locale parity tests pass.
- [ ] `npm run verify` passes; affected design docs are updated.

## Milestones

1. Drawer becomes the single nav surface: introduce mobile open/close state and
   the header hamburger; make `AppNavDrawer` render both variants.
2. Add the drawer footer (identity line + sign-out).
3. Remove `AppNavBottom`, `HubLinks`, and the obsolete metadata/keys.
4. Update tests, i18n, and design documentation; run the verification gate.

## Open questions (non-blocking)

- Whether to later add a lightweight confirm on sign-out if accidental taps
  prove common. Deferred; not part of this change.
- Whether the desktop drawer should eventually become collapsible. Out of scope.

## References

- Code: `src/shared/components/AppShell/AppShell.tsx`,
  `src/shared/components/AppShell/components/AppNavDrawer/AppNavDrawer.tsx`,
  `src/shared/components/AppShell/components/AppNavBottom/AppNavBottom.tsx`,
  `src/shared/components/AppShell/constants/navigationDestinations.ts`,
  `src/shared/components/AppHeader/AppHeader.tsx`,
  `src/features/admin-dashboard/components/HubLinks/HubLinks.tsx`,
  `src/features/admin-dashboard/pages/AdminDashboardPage.tsx`,
  `src/infrastructure/firebase/authAdapter.ts`, `src/features/auth/useAuth.ts`.
- Docs: `docs/design/README.md`, `docs/design/screens/shared-patterns.md`,
  `docs/design/screens/admin-dashboard.md`.

## Approval

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Author | Dmytro Tyshchenko (agent-assisted) | 2026-07-11 | Draft |
| Approver | Dmytro Tyshchenko | 2026-07-11 | Approved |
