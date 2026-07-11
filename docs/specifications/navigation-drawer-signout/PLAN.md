# PLAN — Unified left navigation drawer with sign-out

| Field | Value |
| --- | --- |
| Slug | `navigation-drawer-signout` |
| Status | Approved |
| Specification | [SPEC.md](./SPEC.md) (Approved 2026-07-11) |
| Created | 2026-07-11 |

## Goal

Make the left navigation `Drawer` the single navigation surface on every
viewport, add a header hamburger that opens it as a temporary overlay below
`md`, and add a drawer footer showing the current account identity plus a
sign-out control. Remove the mobile `BottomNavigation` and the dashboard
`HubLinks`, and retire the metadata/i18n keys that only served them.

## Architecture, stack, constraints

- Stack: React + TypeScript + Vite + MUI (`Drawer`, `AppBar`, `IconButton`,
  `List`), `HashRouter`, `react-i18next`. No Firebase schema/Rules/Auth change.
- Named exports only; no `export default` in components. UI strings live in
  i18next resources with matching `uk` (default) and `en` (fallback) keys.
- Domain logic untouched; this is presentation/navigation only.
- Verification gate: `npm run verify`. Style fixes via `npm run fix` only.
- All changes confined to `src/shared/components/AppShell/**`,
  `src/shared/components/AppHeader/**`,
  `src/shared/components/SignOutButton/**` (delete),
  `src/features/admin-dashboard/**`, and `src/locales/**`, plus design docs.

## Scope

In scope: the drawer/header/dashboard/i18n changes above and their tests and
docs. Inherited non-goals from SPEC: no route/guard/role/auth-logic change, no
change to `signOut()` or the post-sign-out redirect, no collapsible desktop
drawer, header language/theme controls stay put, no account switcher, no new
identity data source.

## Impact analysis

| Area | Detail |
| --- | --- |
| Architecture | `AppShell` gains `mobileOpen` state and computes `accountLabel` from `useAuth().user`. It renders exactly one `AppNavDrawer` whose `variant` is `permanent` at `md`+ and `temporary` below, passing `open`/`onClose`/`onNavigate`. `AppHeader` gains an optional `onOpenNav` handler and renders a leading hamburger `IconButton` only when it is provided. `AppNavDrawer` becomes the single nav renderer and hosts the footer. `AppNavBottom`, `HubLinks`, and `constants/mobileNavLimits.ts` are deleted. Dependency direction unchanged (shared ← features consumers). The single `nav` landmark is preserved by moving `component="nav"` + `aria-label={t('nav.landmark')}` inside the drawer. |
| Data/domain | No domain data. `accountLabel = user?.email ?? user?.displayName ?? t('auth.signedIn')`. Nav item shape loses `mobilePrimary` and `mobileLabelKey`; `NavBadgeKey`, `badgeKey`, `roles`, `labelKey`, `Icon`, `path`, `key` unchanged. |
| Firebase | None. `authAdapter.signOut()` reused as-is; the existing `subscribeToAuthState` handler already resets to `/login` on sign-out. |
| Migration | None. Pure client presentation change; additive and immediately effective; rollback = revert. |
| Privacy/i18n | The drawer shows the signed-in user their own email in their own session — not logged, persisted, or committed. New keys `nav.openMenu` and `auth.signedIn` added to both locales; `auth.signOut` already present. Remove now-unused `dashboard.hub` object and (after grep-confirmed unused) `nav.admin` and `nav.orders`. Locale parity test must stay green. No real addresses in fixtures/docs — `example.test` only. |
| UX | No route/permission change. Below `md`: hamburger opens temporary drawer; it closes on destination click (`onNavigate`), backdrop tap, and `Escape` (MUI `Drawer` `onClose`). At `md`+: permanent drawer unchanged, now with footer. Active route keeps `aria-current="page"`; badges unchanged. Sign-out is non-destructive (no confirm). |
| Quality | TDD per task below. Rewrite `AppShell` tests for the drawer model; add `AppNavDrawer` footer/variant tests; update `AppHeader` test for the hamburger; update `AdminDashboardPage` test (drop hub); update `selectDestinations` test (drop `mobileLabelKey`); delete `AppNavBottom`/`HubLinks` (no separate test files exist). Update design docs. Final `npm run verify`. |

## Conflicts resolved

- **Landmark uniqueness.** Today `<Box component="nav">` in `AppShell` wraps
  drawer + content. Moving the landmark inside the single rendered drawer keeps
  exactly one `navigation` landmark and lets `within(nav, …)` find items in both
  variants (portal content is still in `document.body`, so Testing Library
  finds it). Resolved.
- **Mobile query timing.** A closed temporary drawer unmounts its content
  (default `keepMounted={false}`), so nav links are absent until opened. Mobile
  tests must open the drawer first; this is intended behavior, not a conflict.
- **Unused i18n keys.** `nav.admin`/`nav.orders` were only `mobileLabelKey`
  values. Task 5 greps to confirm no remaining references before deleting them;
  if any non-test reference survives, the key is kept and the grep result noted.
- No other conflicts found (no source-of-truth, ordering, concurrency, security,
  or rollout conflict).

## Affected paths and interfaces

Edit:

- `src/shared/components/AppShell/AppShell.tsx` — `mobileOpen` state,
  `accountLabel`, single `AppNavDrawer` with variant, header wiring.
- `src/shared/components/AppShell/components/AppNavDrawer/AppNavDrawer.tsx` —
  new props and footer; render `Drawer` with `variant`/`open`/`onClose`.
- `src/shared/components/AppShell/components/AppNavDrawer/styles.ts` — footer
  styles (spacer to push footer to bottom, identity line, sign-out item).
- `src/shared/components/AppHeader/AppHeader.tsx` + `AppHeader.styles.ts` —
  optional `onOpenNav`, leading hamburger `IconButton`.
- `src/shared/components/AppShell/types/navigationDestination.ts` — drop
  `mobilePrimary`, `mobileLabelKey`.
- `src/shared/components/AppShell/constants/navigationDestinations.ts` — drop
  the two dropped fields from every entry.
- `src/features/admin-dashboard/pages/AdminDashboardPage.tsx` — remove
  `HubLinks` usage.
- `src/locales/uk/translation.json`, `src/locales/en/translation.json` — add
  `nav.openMenu`, `auth.signedIn`; remove `dashboard.hub`, `nav.admin`,
  `nav.orders` (unused).

Delete:

- `src/shared/components/AppShell/components/AppNavBottom/` (dir).
- `src/shared/components/AppShell/constants/mobileNavLimits.ts`.
- `src/features/admin-dashboard/components/HubLinks/` (dir).
- `src/shared/components/SignOutButton/` (dir — superseded by inline footer
  control created earlier this session).

New `AppNavDrawer` props:

```ts
interface AppNavDrawerProps {
  destinations: NavigationDestination[];
  badgeCounts?: NavBadgeCounts;
  variant: 'permanent' | 'temporary';
  accountLabel: string;
  open?: boolean; // temporary only
  onClose?: () => void; // temporary: backdrop / Escape
  onNavigate?: () => void; // called when a destination item is activated
}
```

New `AppHeader` prop: `onOpenNav?: () => void` (hamburger rendered only when set).

## Tasks

### Task 1 — i18n keys (RED→GREEN)

- [ ] Add `nav.openMenu` (uk «Відкрити меню», en "Open menu") and `auth.signedIn`
      (uk «Ви увійшли», en "Signed in") to both `translation.json` files, keeping
      key order tidy.
- [ ] Run `npm run test -- localeParity` and confirm parity test stays green.
- Dependency: none. Deliverable: matching keys in both locales.

### Task 2 — Header hamburger (RED→GREEN)

- [ ] Update `src/shared/components/AppHeader/__tests__/AppHeader.test.tsx`: add
      a test that with `onOpenNav` provided a button named `nav.openMenu` renders
      and clicking it calls the handler; and that without the prop no such button
      exists. Run focused test → RED.
- [ ] Add `onOpenNav?: () => void` to `AppHeader`; when set, render a leading
      `IconButton` (`MenuIcon`, `aria-label={t('nav.openMenu')}`,
      `aria-expanded`/`aria-controls` wired to the drawer id) before the brand.
      Add `menuButton` style. Focused test → GREEN.
- Dependency: Task 1. Deliverable: header with optional hamburger.

### Task 3 — AppNavDrawer dual-variant + footer (RED→GREEN)

- [ ] Add `src/shared/components/AppShell/components/AppNavDrawer/__tests__/AppNavDrawer.test.tsx`:
      (a) `variant="temporary"` with `open={false}` renders no destination links;
      with `open` it renders them; (b) footer renders `accountLabel` text and a
      control named `auth.signOut`; (c) clicking sign-out calls the mocked
      `signOut` from `authAdapter`; (d) clicking a destination calls `onNavigate`.
      Mock `../../../../infrastructure/firebase/authAdapter`. Run → RED.
- [ ] Rewrite `AppNavDrawer` to accept the new props, render `Drawer` with the
      given `variant`/`open`/`onClose`, wrap the `List` + footer in
      `<Box component="nav" aria-label={t('nav.landmark')}>`, and add the footer:
      a spacer, `Divider`, an identity `Typography` (`accountLabel`), and a
      sign-out `ListItemButton` (`LogoutIcon` + `t('auth.signOut')`) calling
      `signOut()`. Destination `ListItemButton`s call `onNavigate` on click.
      Focused test → GREEN.
- Dependency: Task 1. Deliverable: reusable dual-variant drawer with footer.

### Task 4 — AppShell wiring (RED→GREEN)

- [ ] Rewrite `src/shared/components/AppShell/__tests__/AppShell.test.tsx` for the
      new model: mobile (matchMedia false) shows no nav links until the hamburger
      is clicked, then shows the role's full destination set (admin sees
      Inventory/Batches/Dishes/Settings too); desktop (matchMedia true) shows the
      permanent drawer with all destinations and no hamburger; `aria-current` on
      the active route; badge counts on cooking-requests/inventory; footer shows
      the account label and sign-out invokes the mocked `signOut`. Mock
      `authAdapter`. Run → RED.
- [ ] Update `AppShell` to hold `mobileOpen` state, compute
      `accountLabel = user?.email ?? user?.displayName ?? t('auth.signedIn')`,
      render `<AppHeader onOpenNav={isDesktop ? undefined : () => setMobileOpen(true)} />`,
      and render one `<AppNavDrawer variant={isDesktop ? 'permanent' : 'temporary'}
      open={mobileOpen} onClose={() => setMobileOpen(false)}
      onNavigate={() => setMobileOpen(false)} accountLabel=… destinations=…
      badgeCounts=… />`. Remove the `AppNavBottom` import/usage and the outer
      `component="nav"` wrapper (landmark now lives in the drawer). Focused test →
      GREEN.
- Dependency: Tasks 2, 3. Deliverable: unified shell.

### Task 5 — Remove dead code, metadata, and keys (RED→GREEN)

- [ ] `grep -rn "nav.admin\|nav.orders" src` and confirm only removable
      references remain; delete `nav.admin`, `nav.orders`, and the `dashboard.hub`
      object from both locales (keep any key still referenced, and note it).
- [ ] Remove `mobilePrimary` and `mobileLabelKey` from `NavigationDestination`
      and from every entry in `navigationDestinations.ts`. Update
      `src/shared/components/AppShell/utils/__tests__/selectDestinations.test.ts`
      to drop the `mobileLabelKey` assertions.
- [ ] Delete `AppNavBottom/`, `constants/mobileNavLimits.ts`, `HubLinks/`, and
      `SignOutButton/`. Remove the `HubLinks` import/usage from
      `AdminDashboardPage.tsx`.
- [ ] Update `src/features/admin-dashboard/__tests__/AdminDashboardPage.test.tsx`:
      delete the "renders the mobile admin hub" test.
- [ ] `grep -rn "AppNavBottom\|mobileNavLimits\|MOBILE_NAV_INLINE_LIMIT\|mobilePrimary\|mobileLabelKey\|HubLinks\|SignOutButton\|dashboard.hub" src` returns nothing. Run `npm run test` for the affected dirs → GREEN.
- Dependency: Task 4. Deliverable: no dead nav code or keys.

### Task 6 — Documentation (structural)

- [ ] Update `docs/design/screens/shared-patterns.md` (Tabs/BottomNavigation
      section) to record that navigation is a single left `Drawer` on all
      viewports — permanent at `md`+, temporary (hamburger-triggered) below —
      superseding the mobile `BottomNavigation`, and that it carries a footer with
      the account identity and sign-out.
- [ ] Update `docs/design/screens/admin-dashboard.md` to remove the mobile admin
      hub note (drawer now covers mobile navigation).
- [ ] Update `docs/design/README.md` if it references the BottomNavigation↔Drawer
      switch point, pointing to this spec.
- Dependency: Tasks 4–5. Deliverable: docs match shipped behavior.

### Task 7 — Verification gate

- [ ] `npm run fix` then `npm run verify`; confirm typecheck, lint, format,
      tests, and build all pass.
- [ ] Optionally verify in the browser preview: mobile hamburger opens/closes the
      drawer, sign-out returns to `/login`.
- [ ] Mark the SPEC row `Implemented` in `docs/specifications/README.md`.
- Dependency: Tasks 1–6. Deliverable: green gate.

## Acceptance-criteria mapping

| SPEC criterion | Task(s) | Verification |
| --- | --- | --- |
| Sign-out control in drawer calls `signOut()` → `/login` | 3, 4 | Drawer + shell tests assert mocked `signOut` called; preview check |
| Drawer shows account email/fallback | 3, 4 | Footer test asserts `accountLabel`; shell test |
| Permanent drawer at `md`+ unchanged | 4 | Desktop shell test lists all destinations, no hamburger |
| Below `md`: hidden, opens from hamburger, closes on select/backdrop/Escape | 2, 3, 4 | Header test (handler), drawer test (open/close, onNavigate), shell test |
| All role destinations reachable on mobile; no bottom nav | 4, 5 | Shell test after opening; grep shows no `AppNavBottom` |
| Dashboard has no hub/navigation block | 5 | Dashboard test drops hub; grep clean |
| Role filter, `aria-current`, badges preserved | 4 | Shell tests retained/updated |
| `nav.openMenu`/`auth.signedIn` in both locales; `dashboard.hub.*` removed; parity passes | 1, 5 | Parity test; grep |
| `npm run verify` passes; design docs updated | 6, 7 | Gate output; doc diffs |

## Documentation, rollout, rollback, risks

- Documentation: design docs updated in Task 6; SPEC index flipped to
  `Implemented` in Task 7. `docs/06-auth-and-security.md` unaffected (no auth
  behavior change).
- Rollout: single client change, effective on deploy, no migration.
- Rollback: revert the commit; no data or config to undo.
- Risks: (a) landmark relocation could break `nav`-scoped queries — mitigated by
  updating tests in the same task; (b) temporary-drawer focus/scroll behavior
  relies on MUI defaults — acceptable, standard pattern.

## Non-blocking open questions

- Optional sign-out confirmation and a collapsible desktop drawer remain out of
  scope (SPEC open questions). The stray `console.log(tokenResult)` in
  `AuthContext.tsx:74` is a separate cleanup, not part of this plan.

## Approval

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Author | Dmytro Tyshchenko (agent-assisted) | 2026-07-11 | Draft |
| Approver | Dmytro Tyshchenko | 2026-07-11 | Approved |
