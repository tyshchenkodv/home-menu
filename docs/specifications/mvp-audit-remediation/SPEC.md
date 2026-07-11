# MVP audit remediation

| Field | Value |
| --- | --- |
| Slug | `mvp-audit-remediation` |
| Status | Approved |
| Request | Full MVP audit (2026-07-11): fix login-blocking auth bugs, restore design fidelity (typography, mascots, status chips, dark theme), close per-screen UX gaps against `docs/design/screens/*`, and harden Security Rules |
| Created | 2026-07-11 |
| Related | [MVP completion](../mvp-completion/SPEC.md) (screens amended here), [Design system foundation](../design-system-foundation/SPEC.md), [Navigation shell](../navigation-shell/SPEC.md), [Admin inventory design retrofit](../admin-inventory-design-retrofit/SPEC.md) |
| Forthcoming linked | **Auth model migration** (custom claims + Identity Platform sign-up lockdown) — a separate SPEC; this SPEC only fixes the login **bugs**, not the auth **model**. |

## Problem statement

A live audit of the implemented MVP (both roles, both locales, light/dark,
desktop/mobile, against `docs/design/screens/*.md`) found three classes of
defect:

1. **Login is broken for the primary case.** An active `role: 'user'` account
   completes Google sign-in but is never redirected off `/login`
   ([`LoginPage.tsx:21-24`](../../../src/features/auth/LoginPage.tsx) redirects
   only active admins), so the user sits on the sign-in screen — the reported
   "I can't log in". Separately,
   [`AuthContext.tsx:51-58`](../../../src/features/auth/AuthContext.tsx)
   swallows every profile-load failure (offline, `permission-denied`, aborted
   request) into `profile: null, status: 'authenticated'`, which the guard
   renders as "Access denied" — a transient network error is shown to a
   provisioned member as a permanent lockout, with nothing logged. An
   unauthenticated/unprovisioned visitor on `/login` sees no explanatory state,
   and admins land inconsistently (`/admin` from the root redirect vs
   `/admin/inventory` from login).

2. **Design fidelity has regressed from the canon.** Card, dialog, and some
   inline titles use MUI typography variants that the theme never defines
   (`h4` × 7, `h6` × 2, `subtitle2` × 6, `caption` × 9), so they fall back to
   MUI defaults — e.g. dish/order/batch card titles render as `h4` at 34px,
   weight 400, and not even in Nunito. This is the reported "fonts are the
   wrong size and not all stylized". The `StatusChip` has no leading status dot
   and uses saturated `.main` fills instead of the specified light-tinted
   pastel chips. `StatePlaceholder` cannot render the `idle` mascot, so the
   dashboard "all calm" state and other state→pose pairings show the wrong cat.
   Several component overrides hardcode light-mode pink hexes that persist in
   dark mode (card border/shadow, bottom-nav border, contained-button shadow).

3. **Per-screen structure diverges from `docs/design/screens/*`.** Across
   menu, orders (user + admin), dashboard, batches, dishes, inventory, and
   settings: missing empty/error headlines and CTAs, missing loading
   skeletons, missing navigation badges (cooking-requests count, low-stock
   count), an admin who cannot mark a `reserved` order consumed, a
   non-clickable dashboard, a correction dialog whose Save is enabled with an
   empty required reason, dialogs that never become bottom-sheets on mobile,
   incorrect plural grammar, and many copy mismatches versus
   `docs/design/i18n-catalog.md`.

   A distinct navigation defect compounds this on phones: admin has seven
   destinations but the bottom navigation renders at most four and drops every
   `mobilePrimary: false` item (Inventory, Batches, Dishes, Settings), while the
   persistent drawer only appears at `md`+. The "Admin" tab leads to `/admin`,
   but the dashboard offers no onward navigation, so on a phone an admin can
   reach only Menu, Orders, and the Dashboard — four screens are unreachable.

Security Rules review also found gaps the current documentation does not record
as accepted: client-supplied timestamps are never validated against
`request.time`, a zero-delta batch "reservation" write is permitted, and the
timezone is hardcoded to `Europe/Kyiv` in a repository meant to be a reusable
template.

The full itemized findings (file:line) are the working input to this SPEC and
are summarized per screen in the impact and acceptance sections below.

## Goals

Each goal is independently testable.

### Slice 1 — Login-blocking bugs (highest priority)

1. **Any active profile is routed off `/login`.** After successful sign-in, an
   active `user` reaches `/menu` and an active `admin` reaches the single
   canonical admin landing route; `/login` never renders the sign-in card for
   an already-authenticated active profile.
2. **Profile-load errors are distinguished from "not provisioned".** A new
   `error` auth status is introduced. A missing `users/{uid}` document still
   yields the access-denied UX; a genuine load failure (network/permission)
   yields a distinct, retryable error state and is logged in development per
   `docs/02-architecture.md` logging guidance.
3. **Unauthenticated/unprovisioned visitors get a clear state**, not a blank or
   dead-end screen, on every guarded route and on `/login`.
4. **Admin landing route is consistent** between the root redirect and the
   login redirect.

### Slice 2 — Typography & theme fidelity

5. **Every typography variant the app renders is defined by the theme** with
   the correct family (Nunito for display/headings, Nunito Sans for body/UI),
   weight, and size, so no component falls back to MUI defaults. This includes
   the variants currently used but undefined (`h4`, `h6`, `subtitle2`,
   `caption`) and the `AppHeader` wordmark.
6. **Dark theme is a pure token remap.** No component override leaks a
   light-mode hex into dark mode; card borders/shadows, bottom-nav border, and
   contained-button shadow re-tone with the active color scheme.

### Slice 3 — Shared components (chips & mascots)

7. **`StatusChip` matches canon**: an 8px leading status dot plus label (status
   never by color alone), and light-tinted pastel fills per the status matrices
   in `shared-patterns.md`, in both themes.
8. **Mascot pose matches state on every screen.** `StatePlaceholder` supports
   the `idle` pose; each screen's loading/empty/error/"all calm" state renders
   the pose the design canon (`05g`) assigns, at the specified sizes.
9. **`StatePlaceholder` supports an optional CTA** so empty/error states can
   carry the action button the per-screen specs require.

### Slice 4 — Navigation

10. **Navigation badges exist**: the admin cooking-requests destination shows a
    pending-count badge and the inventory destination shows a low-stock badge,
    per `shared-patterns.md` `06b`.
11. **Drawer/bottom-nav composition, order, and labels match the catalog**:
    admin drawer is Панель / Запити на готування / Страви / Інвентар / Партії /
    Налаштування; mobile third tab is «Адмін»; obsolete `nav.requests` /
    `nav.more` keys are removed; `nav.dashboard` / `nav.cookingRequests` are
    used as cataloged.

### Slice 5 — Per-screen states, dialogs, and copy

12. **Every list screen has all four data states with the specified headline,
    body, mascot, and CTA** (menu, my-orders, admin-orders, batches, dishes,
    inventory, dashboard), including loading skeletons where specified.
13. **Menu**: reservation subtitle includes the date; the reservation-failure
    state shows mascot + headline + interpolated body + refresh CTA; the
    passed-meal edge case shows the explanation and "to next meal" CTA; the
    admin expired-batch banner renders; the availability chip never shrinks
    against long dish names.
14. **Orders**: an admin can mark a `reserved` order consumed and cancel it;
    the rejection dialog's secondary button reads «Назад»/"Back"; the cancel
    dialog carries its icon badge; prepared admin meta shows a stable batch
    number.
15. **Dashboard** is actionable and doubles as the mobile admin hub: tiles
    navigate, quick-action rows and the pending-requests / needs-attention
    panels render per `admin-dashboard.md`, and the expired tile carries a
    non-color severity marker. On viewports below `md`, the dashboard also
    presents onward links to **every** admin destination it does not otherwise
    surface (Cooking requests, Batches, Dishes, Inventory, Settings), so an
    admin can reach all screens from a phone via the "Admin" tab. At `md`+ the
    persistent drawer remains the primary navigation and the hub links may be
    omitted or de-emphasized.
16. **Batches**: the discard action uses the variant/color and label the `05d`
    matrix assigns per status; counter tiles carry their semantic tints; the
    discarded chip is outlined; the discard dialog carries its "!" badge; meta
    strings interpolate their values (no hardcoded dates).
17. **Inventory**: the correction dialog disables Save until the required
    reason is filled and renders its subtitle, helper, placeholder, and
    canonical title/label/error copy; the zero-quantity row reads
    «0 г — закінчилися» in error tone; error state has a retry; empty state has
    a CTA.
18. **Dishes**: empty state has headline + body + CTA; the archive dialog
    carries its folder badge; selected meal-type chips show the leading check.
19. **Correct plural grammar** (portions, ingredients, hours) via i18next
    plural forms, in both locales, wherever counts are rendered.
20. **Dialogs are bottom-sheets on mobile and centered modals at `md`+**, per
    `shared-patterns.md` `05e` / `05i`.

### Slice 6 — Security Rules hardening

21. **Server-anchored timestamps.** Create/update writes that carry
    audit/ordering timestamps (`createdAt`, `updatedAt`, `preparedAt`,
    `scheduledFor` where applicable) are validated against `request.time` so a
    client cannot forge audit or FIFO-ordering times, with emulator tests.
22. **No zero-delta batch reservation writes.** The `isUserReservationMove`
    rule requires a strictly decreasing available count, with an emulator test.
23. **Timezone is not hardcoded to one household** in the settings Rule; the
    reusable-template constraint from `docs/06` is honored.

### Cross-cutting

24. **i18n parity is preserved**: every added/changed user-facing string exists
    in both `uk` and `en`, `uk` default / `en` fallback, enforced by the parity
    test; no inline strings enter components.
25. **`npm run verify` passes** and current documentation
    (`docs/design/README.md`, `docs/design/screens/*`, `docs/06`, `docs/02`) is
    updated where behavior changes.

## Non-goals

- **The auth model migration** (roles via Firebase custom claims; blocking new
  Auth-account creation via the Identity Platform upgrade / `disabledUserSignup`;
  an Admin-SDK provisioning script). This SPEC fixes the login **bugs** only.
  The migration is a separate, forthcoming linked SPEC; nothing here forecloses
  it, and Rules changes in Slice 6 stay compatible with a later claims-based
  model.
- Cloud Functions, Storage, or any paid-tier / Blaze dependency.
- New mascot artwork or poses beyond the existing five CatArt variants
  (`idle`, `empty`, `sleeping`, `confused`, `logo`); only their state mapping
  and sizing are corrected.
- List virtualization, sticky letter-group headers, search-from-10-items, and
  dish photo thumbnails from `05h` (deferred; call out as open questions, not
  built here).
- Replacing `signInWithPopup` with a redirect flow (tracked as an open
  question; this SPEC only ensures sign-in failures surface a clear, retryable
  error rather than a silent dead-end).
- Any change to the domain transaction logic in `src/domain/*` beyond what a
  listed UX fix strictly requires (e.g. exposing a stable batch number is a
  read/format concern, not a transaction change).

## Workflow, domain, and data model

This is primarily a UI-fidelity and bug-fix effort; the domain model,
collections, and transactions defined in `docs/03` / `docs/04` do not change.
Specific data-touching points:

- **Auth status** gains an `error` state in the client `AuthContext` only; the
  `users/{uid}` schema is unchanged. Source of truth for role/active remains
  the Firestore profile document (until the separate migration).
- **Admin `reserved` → consumed / cancel** uses the existing documented
  transitions and transactions in `docs/04`; no new transition is invented. If
  the audit's "mark consumed" path requires a transaction not already present,
  that is flagged **Unknown — discovery step:** confirm against
  `src/domain/orders/*` before planning Slice 5, and if a new transaction is
  needed it escalates to its own linked SPEC rather than expanding this one.
- **Batch number** shown in admin/prepared meta must be a stable,
  human-readable identifier. **Unknown — discovery step:** determine whether a
  batch sequence/number already exists in the batch document or must be derived
  deterministically (e.g. a short stable hash is the current behavior); pick the
  approach in PLAN without adding a write.
- **Timestamps** move to server-anchored validation in Rules; client writes
  that currently send `new Date()`/`Timestamp.now()` must send values equal to
  `request.time` (or `serverTimestamp()` where the transaction allows). Existing
  documents are not rewritten; the rule change is additive on new writes
  (see Compatibility).

## UX and accessibility

- **Roles**: `user` and `admin` as today; no permission-matrix change.
- **States**: every list/detail screen must present loading, empty, error, and
  populated states with the canonical mascot pose, headline, body, and CTA from
  the matching `docs/design/screens/*.md` and `shared-patterns.md` `05g`.
- **Destructive actions** (cancel order, discard batch, archive dish) keep
  their confirmation dialogs and gain the specified icon badges.
- **Accessibility**: status is never conveyed by color alone (chip dot + label,
  dashboard severity glyph); touch targets ≥ 44px; the reservation/cooking
  stepper `−`/`+` controls carry correct, non-swapped `aria-label`s; the
  `<main>` landmark is not nested inside the `nav` landmark; dialogs manage
  focus and are dismissible by scrim/Esc.
- **Responsive**: dialogs are bottom-sheets below `md` and centered modals at
  `md`+; the admin Kanban scrolls horizontally on mobile and shows all four
  columns on desktop without clipping card content.

## Deep impact analysis

| Area | Assessment |
| --- | --- |
| Architecture | Changes span `app` (theme, router/redirect, AuthContext), `shared` (StatusChip, StatePlaceholder, CatArt sizing, AppShell nav + badges, AppHeader), and every `features/*` screen's presentational components and state wrappers. No new architectural boundary; domain and infrastructure services are unchanged except the read/format concerns noted above. |
| Firebase | **Rules** change (Slice 6): server-anchored timestamps, zero-delta guard, non-hardcoded timezone; **emulator tests** added for each. No schema, converter, index, or transaction change. Auth: client status handling only. |
| Domain | No invariant, unit, or status change. Admin `reserved`→consumed/cancel reuses existing transitions (subject to the discovery step above). Plural grammar is a formatting concern. |
| Privacy | No new tracked identifiers; audit findings that mention real-looking data are emulator-only. Dev-only logging of auth errors must not log PII beyond an error code/message and must be development-gated. Timezone de-hardcoding removes a maintainer-specific value — a privacy/reusability improvement. |
| i18n | Many new/changed keys (state headlines, CTAs, badges, banners, correction-dialog copy, plural forms) in both `uk` and `en`; obsolete `nav.requests`/`nav.more` removed; `docs/design/i18n-catalog.md` updated. Parity test must stay green. |
| UX | New/changed states, dialogs (bottom-sheet responsive), navigation badges and labels, dashboard actionability, admin reserved actions. Routes unchanged except the login/admin-landing redirect target. |
| Compatibility | Rules timestamp validation is **additive on new writes**; existing documents are not re-validated and are not rewritten. **Risk:** any currently-deployed client that writes a non-`request.time` timestamp would be rejected after the rule ships — since this repo is client-only and deployed together, PLAN must sequence the client write change before/with the rule change. Rollback = revert the rule. No document backfill required. |
| Quality | Unit tests for redirect/auth-status logic, plural formatting, and chip/mascot mapping; component tests for the new/fixed states and dialogs; Rules emulator tests for Slice 6; the existing locale-parity test; `npm run verify` as the gate. |

## Acceptance criteria

- [ ] An active `user` signing in from `/login` lands on `/menu`; an active
      `admin` lands on the single canonical admin route; neither can see the
      sign-in card while authenticated and active.
- [ ] A simulated profile-load failure renders a distinct, retryable error
      state (not "access denied") and logs in development only; a missing
      profile still renders access-denied.
- [ ] No `Typography` in `src/` renders a variant undefined by the theme; card,
      dialog, and wordmark titles render in the correct family/weight/size.
- [ ] In dark mode, no card border, bottom-nav border, contained-button shadow,
      or other override shows a light-mode pink hex.
- [ ] `StatusChip` shows a leading dot and light-tinted fill in both themes for
      all documented statuses.
- [ ] Each screen's four data states render the canonical mascot pose (incl.
      dashboard `idle`), headline, body, and CTA; loading states show skeletons
      where specified.
- [ ] The admin cooking-requests and inventory nav items show their count
      badges; drawer/bottom-nav labels and order match the catalog; obsolete
      nav keys are gone.
- [ ] An admin can mark a `reserved` order consumed and cancel it from the UI.
- [ ] The dashboard tiles navigate and the quick-action / attention panels
      render.
- [ ] On a phone, an admin can reach every admin destination (Cooking
      requests, Batches, Dishes, Inventory, Settings) from the "Admin" tab via
      the dashboard hub; none are unreachable below `md`.
- [ ] The correction dialog's Save is disabled until the required reason is
      entered; its subtitle/helper/placeholder/copy match the spec.
- [ ] Counts render with correct plural forms in `uk` and `en`.
- [ ] Dialogs are bottom-sheets below `md` and modals at `md`+.
- [ ] Rules reject a forged timestamp and a zero-delta reservation move
      (emulator tests); the settings timezone is not hardcoded to one value.
- [ ] Every added/changed string exists in both locales; the parity test and
      full `npm run verify` pass.
- [ ] `docs/design/*`, `docs/06`, and `docs/02` are updated where behavior
      changed.

## Milestones

1. **Slice 1 — Login bugs** (Goals 1–4). Ships first so sign-in works for both
   roles.
2. **Slice 2 — Typography & dark-theme tokens** (Goals 5–6). Theme-level,
   cascades app-wide.
3. **Slice 3 — StatusChip & mascots** (Goals 7–9).
4. **Slice 4 — Navigation badges & labels** (Goals 10–11).
5. **Slice 5 — Per-screen states, dialogs, copy, plurals** (Goals 12–20),
   sub-sequenced per screen.
6. **Slice 6 — Rules hardening** (Goals 21–23), client write changes sequenced
   before/with the rule change.

Cross-cutting i18n parity, docs, and `npm run verify` (Goals 24–25) close each
slice.

## Open questions (non-blocking)

1. Should `signInWithPopup` move to `signInWithRedirect` for robustness against
   popup blockers / COOP? (Out of scope here; Slice 1 only guarantees a clear
   retryable error.)
2. `05h` richer edge cases — list virtualization, sticky letter headers,
   search-from-10, dish photos — deferred; schedule separately if wanted.
3. Where two design docs conflict (e.g. dialog radius 22 in `shared-patterns`
   vs 24 in `README`/`theme.ts`; the shared-patterns `05d` "reserve for
   requester" admin button vs the `admin-orders.md` resolved decision), the
   READMEs/resolved-decisions win; PLAN records each so stale matrix rows are
   annotated rather than "fixed" against.

## References

- Current docs: `docs/design/README.md`, `docs/design/screens/*.md`,
  `docs/design/i18n-catalog.md`, `docs/06-auth-and-security.md`,
  `docs/02-architecture.md`, `docs/03-data-model.md`, `docs/04-business-logic.md`.
- Key code: `src/app/theme.ts`, `src/app/router.tsx`, `src/app/RootRedirect.tsx`,
  `src/features/auth/*` (`AuthContext.tsx`, `LoginPage.tsx`,
  `RequireActiveProfile.tsx`, `RequireAdmin.tsx`),
  `src/shared/components/{StatusChip,StatePlaceholder,CatArt,AppShell,AppHeader}/*`,
  `src/features/{menu,orders,admin-orders,admin-dashboard,batches,admin-dishes,admin-inventory,settings}/*`,
  `firestore.rules`, `tests/rules/firestore.rules.test.ts`,
  `src/locales/{uk,en}/translation.json`.

## Approval

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Author | Claude (agent) | 2026-07-11 | Draft |
| Approver | Dmytro Tyshchenko | 2026-07-11 | Approved |
