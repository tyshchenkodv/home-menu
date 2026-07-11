# MVP audit remediation — implementation plan

| Field | Value |
| --- | --- |
| Slug | `mvp-audit-remediation` |
| Status | Approved |
| Specification | [SPEC.md](./SPEC.md) (Approved 2026-07-11) |
| Created | 2026-07-11 |

## Goal, architecture, stack

Deliver the six approved remediation slices against the existing stack (React
19, TypeScript, Vite, MUI v9, Firebase Auth/Firestore, `i18next`/`react-i18next`,
`HashRouter`). No new runtime dependency, no Cloud Functions, no paid tier.
Domain logic stays pure in `src/domain/**`; Firebase access stays behind
`src/infrastructure/firebase/**`; UI stays in `src/features/**` and
`src/shared/**`. All user-facing strings live in `src/locales/{uk,en}` with
`uk` default / `en` fallback.

### Global constraints (given to every implementation worker)

- Named exports only; no `export default` in components.
- No inline user-facing strings; add matching `uk` + `en` keys in the same task.
- Reference `theme.palette.*` / theme tokens, never raw hex, in feature code.
- TDD: write the failing test first, confirm RED, implement, confirm GREEN.
- Do not stage, commit, push, or open PRs.
- Workers receive only their bounded task + exact interfaces; product decisions
  stay with the primary agent.
- Implementation workers run on the Sonnet model (per user instruction); the
  primary agent integrates and runs the full gate.

## Scope and inherited non-goals

Scope = SPEC Goals 1–25. Inherited non-goals (SPEC): the auth **model**
migration (custom claims / sign-up lockdown), Cloud Functions/Storage/paid
tier, new mascot artwork, list virtualization / sticky headers / search /
photos, popup→redirect sign-in change.

**Two scope decisions recorded (2026-07-11, user):**

1. **Admin "mark reserved consumed"** is built in this PLAN (fulfilling SPEC
   Goal 14). The SPEC's discovery note said a new transaction "escalates to its
   own linked SPEC"; the user directed keeping it here, and because the
   capability is an explicit approved goal, the transaction is planned as the
   *how*. Recorded in Conflict resolution.
2. **Real sequential batch number** is a Firebase **schema** change (a
   monotonic counter document + a write inside `registerBatch`) that the
   approved SPEC scoped as display-only/no-write. Per `CLAUDE.md`
   (schema/transaction changes are substantial; material changes to approved
   requirements need a new linked SPEC), it is **carved out to a separate linked
   SPEC** `batch-sequence-number` (to be drafted next). This PLAN ships an
   interim stable short **code** derived from the batch document id and updates
   the copy/design note accordingly.

## Deep impact analysis

| Area | Planning detail |
| --- | --- |
| Architecture | `app` (`theme.ts`, `router.tsx`, `RootRedirect.tsx`, auth context/guards), `shared` (`StatusChip`, `StatePlaceholder`, `CatArt`, `AppShell` nav + badges, `AppHeader`), all `features/*` presentational + state components, plus one new domain fn and one new transaction for consume. Dependency direction unchanged (features → shared → domain/infra). |
| Data/domain | New pure fn `computeManualConsumption(order)` in `src/domain/orders/` (status `reserved`\|`prepared` → consumed, batch reserved→consumed deltas, **no** time gate — the only difference from `computeConsumedNormalization`). Source of truth for role/active stays the `users/{uid}` doc. Plural grammar is formatting only. |
| Firebase | New transaction `consumeOrder({ orderId, adminUid })` in `orderTransactions.ts`. Rules: (a) anchor client timestamps to `request.time` on create/update where the field is client-set; (b) `isUserReservationMove` requires strictly-decreasing available; (c) settings `timezone` no longer pinned to one literal; (d) confirm the admin batch reserved→consumed move for `consumeOrder` is permitted (admin already has batch write). Emulator tests via `npm run test:rules` (Java 21+, not in `npm run verify`). |
| Migration | Timestamp rule is **additive on new writes**; existing docs are not re-validated or rewritten. Client write changes that must send `request.time`-equal values ship **before/with** the rule (single deployable client, so sequence within the slice). Rollback = revert the rule commit. No backfill. |
| Privacy/i18n | Dev-only auth-error logging carries an error code/message, no PII, `import.meta.env.DEV`-gated. Removing the hardcoded `Europe/Kyiv` improves reusability. New/changed keys added to both locales; obsolete `nav.requests`/`nav.more` removed; `docs/design/i18n-catalog.md` updated; parity test stays green. |
| UX | Login/admin-landing redirect target unified to `/admin`. Dashboard becomes the mobile admin hub. Dialogs become responsive bottom-sheets. Nav gains badges. No permission-matrix change. |
| Quality | Vitest unit/component tests (pattern: `render` + `MemoryRouter` + `import '../../../app/i18n'` + `vi.mock('../useAuth')`); Rules emulator tests; locale-parity test; final `npm run verify`. Rules suite run separately and reported. |

## Conflict resolution

- **Consume transaction vs SPEC escalation note** → resolved: build here (Goal
  14 authorizes the capability; user decision 2026-07-11). No SPEC edit (frozen);
  decision recorded here and surfaced, not hidden.
- **Real batch number vs approved no-write scope** → resolved: out of this
  PLAN; a separate `batch-sequence-number` SPEC. Interim short code here.
- **Doc conflicts** (dialog radius 22 vs 24; `05d` "reserve for requester" vs
  `admin-orders.md` resolved decision; segmented vs underline order tabs) →
  READMEs / resolved-decisions win; annotate the stale matrix rows in
  `docs/design/screens/*` rather than "fixing" code against them.
- No other conflicts found.

## Affected paths (primary)

- `src/app/theme.ts`, `src/app/router.tsx`, `src/app/RootRedirect.tsx`
- `src/features/auth/{AuthContext.tsx,authContextValue.ts,LoginPage.tsx,RequireActiveProfile.tsx}` + `components/`
- `src/shared/components/{StatusChip,StatePlaceholder,CatArt,AppHeader}/**`
- `src/shared/components/AppShell/**` (`AppNavDrawer`, `AppNavBottom`, `constants/navigationDestinations.ts`, `types/navigationDestination.ts`)
- `src/features/{menu,orders,admin-orders,admin-dashboard,batches,admin-dishes,admin-inventory,settings}/**`
- `src/domain/orders/` (new `manualConsumption.ts`), `src/infrastructure/firebase/services/orderTransactions.ts`
- `firestore.rules`, `tests/rules/firestore.rules.test.ts`
- `src/locales/{uk,en}/translation.json`
- Docs: `docs/design/README.md`, `docs/design/screens/*`, `docs/design/i18n-catalog.md`, `docs/06-auth-and-security.md`, `docs/02-architecture.md`

## Ordered tasks

Each task: focused test(s) first (RED), minimal implementation (GREEN), refactor
green, then the task's focused command. `TEST` = `npm test -- <path>`.
Slices are independently reviewable; tasks within a slice are ordered by
dependency.

### Slice 1 — Login-blocking bugs

- [ ] **T1.1 — `error` auth status.** In `authContextValue.ts` add `'error'` to
  `AuthStatus`. In `AuthContext.tsx`, in the `loadUserProfile.catch`, set
  `status: 'error'` (not `'authenticated'`) and log via an `import.meta.env.DEV`
  guard. RED: extend `src/features/auth/__tests__/*` (or add
  `AuthContext.test.tsx`) asserting a rejected `loadUserProfile` yields
  `status: 'error'`; a resolved `null` still yields `authenticated`+`null`.
  Files: `authContextValue.ts`, `AuthContext.tsx`. `TEST src/features/auth`.
- [ ] **T1.2 — Guard renders retryable error.** `RequireActiveProfile.tsx`: on
  `status === 'error'` render a new retry state (reuse `StatePlaceholder`
  `confused` + a retry button that re-triggers profile load) instead of
  `AccessDeniedState`; keep `AccessDeniedState` for `authenticated` + inactive/
  missing profile. RED: `requireActiveProfile.test.tsx` — `error` shows retry,
  not access-denied; missing profile still access-denied. New keys
  `auth.loadError.title/body/retry` (uk+en).
- [ ] **T1.3 — Redirect any active profile off `/login`.** `LoginPage.tsx`:
  replace the admin-only guard with: active `admin` → `/admin`; active `user`
  → `/menu`. RED: extend `LoginPage.test.tsx` — active `user` renders a
  `<Navigate to="/menu">` (no sign-in button); active admin → `/admin`.
- [ ] **T1.4 — Unify admin landing to `/admin`.** `RootRedirect.tsx` already
  sends admin → `/admin`; make `LoginPage` match (done in T1.3). Confirm no
  other reference sends admin to `/admin/inventory`. RED: assertion in T1.3.
- [ ] **T1.5 — Clear unauthenticated state.** Verify `RequireActiveProfile`
  `unauthenticated` → `<Navigate to="/login">` and `/login` renders the sign-in
  card for unauthenticated visitors (already true); add a component test
  documenting it. No code change expected; if a gap is found, fix minimally.
- [ ] **T1.6 — Sign-in failure surfaces a clear error** (already partially
  present via `hasError`). Confirm `LoginPage` shows the localized error on
  `signInWithGoogle` rejection; add/confirm test. (Popup→redirect stays an open
  question, not built.)

### Slice 2 — Typography & dark-theme tokens

- [ ] **T2.1 — Define every used typography variant.** In `theme.ts`
  `typography`, add `h4`, `h6`, `subtitle2`, `caption` with correct family
  (Nunito Variable for `h4`/`h6`; Nunito Sans for `subtitle2`/`caption`),
  weight, and size chosen to match the design scale (card titles read as a
  compact heading, not MUI's 34px/400). RED: `src/app/__tests__/theme.test.ts`
  asserting `theme.typography.h4.fontFamily` includes `Nunito` and each added
  variant has an explicit `fontSize`/`fontWeight` (no MUI default leak).
  Cross-check the four `variant="h4"` card titles render as the intended size
  via a component test on one card.
- [ ] **T2.2 — AppHeader wordmark family.** Ensure the `AppHeader` wordmark
  (`variant="h6"`) resolves to Nunito after T2.1; adjust `styles.wordmark` only
  if needed. RED: component test asserting the wordmark computed font-family.
- [ ] **T2.3 — Dark-theme token leaks.** Move the hardcoded light hexes out of
  component overrides so they re-tone per scheme: `MuiCard` border/`boxShadow`,
  `MuiBottomNavigation` `borderTop`, `MuiButton` contained `boxShadow` must use
  theme-scheme-aware values (e.g. `theme.vars.palette.divider` /
  scheme-specific overrides) rather than `#F3DDE5` / `rgba(227,99,151,...)`.
  RED: `theme.test.ts` asserting the card border in the dark scheme is not the
  light divider hex. Update `docs/design/README.md` theme block note.

### Slice 3 — StatusChip & mascots

- [ ] **T3.1 — StatusChip leading dot + light fill.** `StatusChip.tsx`: render
  an 8px leading dot (icon/`::before`) and apply light-tinted `.light` fills
  with readable text per `shared-patterns.md` matrices, in both schemes. RED:
  `StatusChip.test.tsx` — a dot element is present; the chip background resolves
  to the `.light` token (not `.main`) for a sample status. Keep label always
  rendered (never color-only).
- [ ] **T3.2 — StatePlaceholder supports `idle` + optional CTA + sizes.**
  Widen the `variant` union to include `idle`; add an optional `action`
  (label + onClick) rendered as an outlined/contained button; size the mascot
  per `05g` (loading ~70, empty/error ~88) instead of fixed 120. RED:
  `StatePlaceholder.test.tsx` — renders `idle`; renders an action button when
  `action` given; passes the expected size to `CatArt`.
- [ ] **T3.3 — Correct per-screen mascot pose.** Audit each feature's
  `EmptyState`/`ErrorState`/`LoadingState` wrapper against `05g`; fix the
  dashboard "all calm" empty to `idle`. RED: dashboard `EmptyState.test.tsx`
  asserts `idle`. (Other screens already map empty→empty/sleeping→loading/
  confused→error; change only where the canon differs.)

### Slice 4 — Navigation badges, labels, mobile admin hub

- [ ] **T4.1 — Badge-capable destinations.** Extend `NavigationDestination`
  with an optional `badgeCountKey`/badge source; render an MUI `Badge` on the
  drawer and bottom-nav items for cooking-requests (pending count) and
  inventory (low-stock count). Source the counts from existing hooks/selectors
  (discover the pending-orders and low-stock selectors; if none is reusable,
  add a thin selector — no new query if a subscription already exists). RED:
  `AppNavDrawer.test.tsx` — a badge with the count renders on the requests and
  inventory items; zero count renders no badge.
- [ ] **T4.2 — Drawer/bottom-nav labels & composition.** Fix labels to the
  catalog: dashboard → `nav.dashboard` («Панель»), admin orders →
  `nav.cookingRequests` («Запити на готування»), mobile third tab label
  `nav.admin` value «Адмін» (not «Адміністрування»); correct drawer order
  (Панель / Запити / Страви / Інвентар / Партії / Налаштування); remove the
  stray extra item. Remove obsolete `nav.requests`/`nav.more` keys from both
  locales. RED: `selectDestinations`/drawer test asserting label keys and order;
  parity test stays green.
- [ ] **T4.3 — Mobile admin hub on the dashboard.** Below `md`,
  `AdminDashboardPage` renders onward links to every admin destination not on
  the bottom nav (Cooking requests, Batches, Dishes, Inventory, Settings). RED:
  `AdminDashboardPage.test.tsx` at a narrow viewport (or via a passed prop)
  asserts links to `/admin/batches`, `/admin/dishes`, `/admin/inventory`,
  `/settings` exist; at `md`+ they may be absent. This closes the "admin can't
  navigate on a phone" bug and interacts with Slice 5 dashboard work (do T4.3
  and T5-dashboard together to avoid rework).

### Slice 5 — Per-screen states, dialogs, copy, plurals

Sub-sequenced per screen; each screen's task adds the missing state
headlines/CTAs/skeletons and the screen-specific fixes from the SPEC. Pattern
per task: RED component test for the missing element → implement → GREEN.

- [ ] **T5.1 — Shared: plural forms.** Convert count-bearing keys to i18next
  plural keys (`_one/_few/_many/_other` for `uk`; `_one/_other` for `en`) and
  pass `count`. Covers portions, ingredients, hours across menu/orders/
  admin-orders/batches/dishes. RED: a formatting test rendering 1 vs 3 portions
  in both locales. Update `i18n-catalog.md`.
- [ ] **T5.2 — Menu.** Add empty/error headlines (`menu.empty.title`,
  `menu.error.title`) + loading skeletons; reservation subtitle includes the
  date; reservation-failure state = mascot + headline + interpolated body
  (`{{available}}`/`{{requested}}`) + refresh CTA; reserve dialog meal-tag chip
  + "N of M left" helper; passed-meal explanation + "to next meal" CTA;
  availability chip `flex: none` applied; admin expired-batch banner. RED:
  `MenuPage`/`ReserveDialog`/`DateMealSelector` tests per element. New keys for
  banner, CTA, helper (uk+en).
- [ ] **T5.3 — My orders.** Empty/error headlines; loading skeletons; cancel
  dialog icon badge. RED: `OrdersPage`/`CancelOrderDialog` tests.
- [ ] **T5.4 — Admin orders.** Empty/error headlines; column skeletons;
  rejection dialog secondary button → «Назад»/"Back" (new `common.back` key);
  Kanban desktop layout does not clip cards / empty columns keep width; prepared
  meta shows the interim batch **code** (`id.slice(-4).toUpperCase()`). RED:
  `AdminOrdersPage`/`RejectDialog` tests. (Consume/cancel actions land in T5.8.)
- [ ] **T5.5 — Dashboard.** Tiles navigate (`onTileClick` wired to routes);
  quick-action rows + pending-requests + needs-attention panels per
  `admin-dashboard.md`; expired tile carries a `⚠`/glyph severity marker
  (non-color). Combine with T4.3. RED: `AdminDashboardPage`/`SummaryTiles`
  tests.
- [ ] **T5.6 — Batches.** Empty/error headlines; discard button variant/color/
  label per `05d` (contained error for expired «Утилізувати N порції»; outlined
  warning for expiring; «Утилізувати…» when enabled non-expired); counter tiles
  semantic tints; discarded chip `outlined`; discard dialog "!" badge; meta
  strings interpolate values (fix the hardcoded `Пн 7…`). RED: `BatchCard`/
  `BatchCounters`/`DiscardBatchDialog` tests.
- [ ] **T5.7 — Inventory.** Correction dialog: Save disabled until required
  reason filled; subtitle (current qty), helper, placeholder, canonical
  title/label/error copy; error state gets a retry; empty state gets a CTA;
  zero-quantity row «0 г — закінчилися» in error tone; chip copy («Є»/«Мало»);
  movement actor in meta if available (else keep documented omission). RED:
  `CorrectionDialog`/`InventoryPage`/`IngredientCard` tests.
- [ ] **T5.8 — Admin reserved actions (consume + cancel).**
  - Domain: new pure `computeManualConsumption(order)` in
    `src/domain/orders/manualConsumption.ts` (reserved|prepared → consumed,
    batch reserved→consumed deltas, no time gate). RED:
    `manualConsumption.test.ts`.
  - Infra: new `consumeOrder({ orderId, adminUid })` transaction in
    `orderTransactions.ts` applying the deltas + order patch atomically,
    asserting conservation. RED: add to `orderTransactions.test.ts`.
  - Rules: confirm/allow the admin batch reserved→consumed move and the order
    →consumed update; add emulator test. (Run via `npm run test:rules`.)
  - Hook/UI: extend `useAdminOrderCommands` with `consume` and `cancel`
    (cancel reuses existing `cancelOrder`); `AdminOrderCard` renders the
    `reserved` branch: «Позначити спожитим» (contained success) + «Скасувати»
    (outlined neutral). Wire `orders.admin.actions.markConsumed`. RED:
    `AdminOrderCard.test.tsx` reserved branch shows both buttons and invokes the
    commands.
- [ ] **T5.9 — Dishes.** Empty state headline + body + CTA; archive dialog
  folder badge; selected meal-type chip leading `✓`. RED: `DishesPage`/
  `ArchiveDishDialog`/`DishFormDialog` tests.
- [ ] **T5.10 — Responsive dialogs.** All confirmation/form dialogs render as
  bottom-sheets below `md` and centered modals at `md`+ (shared dialog wrapper
  or `fullScreen`/`PaperProps` breakpoint). RED: one dialog test asserting the
  mobile-sheet treatment at a narrow viewport.

### Slice 6 — Rules hardening

- [ ] **T6.1 — Server-anchored timestamps.** In `firestore.rules`, for
  client-set audit/ordering timestamps on create (and `updatedAt` on update),
  require `== request.time` where the field is client-supplied; ensure the
  client writes `serverTimestamp()`/`request.time`-equal values first. RED:
  `firestore.rules.test.ts` — a create with a forged `createdAt`/`preparedAt`
  fails; a `request.time`-equal write succeeds. Sequence client change before
  the rule within this slice.
- [ ] **T6.2 — Zero-delta guard.** `isUserReservationMove` requires
  `after.availableQuantity < before.availableQuantity`. RED: a zero-delta
  reservation move now fails; a valid decreasing move succeeds.
- [ ] **T6.3 — Timezone not hardcoded.** Replace the `timezone == 'Europe/Kyiv'`
  literal in the settings rule with a format/allowlist check that is not pinned
  to one household. RED: a settings write with a different valid IANA timezone
  succeeds; an invalid value fails. Update `docs/06`.

### Slice 7 — Docs & final gate

- [ ] **T7.1 — Update current documentation** for every behavior change:
  `docs/design/README.md` (typography variants, dark tokens), `docs/design/
  screens/*` (annotate stale matrix rows; batch code note), `docs/design/
  i18n-catalog.md` (plurals, removed/added keys), `docs/06` (timestamp/timezone
  rules), `docs/02` (auth error status/logging). Mark the interim batch code and
  the forthcoming `batch-sequence-number` SPEC.
- [ ] **T7.2 — Full gate.** Run `npm run fix` then `npm run verify`
  (typecheck, lint, format:check, test, build) → must be green. Run
  `npm run test:rules` (emulator; Java 21+) and report its result explicitly;
  if the environment cannot run it, say so and do not mark Slice 6 verified.
- [ ] **T7.3 — Mark index `Implemented`** only after T7.2 is green.

## Acceptance-criteria → task → verification

| SPEC acceptance criterion | Task(s) | Verification |
| --- | --- | --- |
| Active user→/menu, admin→/admin, no card while active | T1.3–T1.4 | `TEST src/features/auth` |
| Load failure = retryable error, not access-denied; missing = access-denied; dev log | T1.1–T1.2 | auth tests |
| No undefined typography variant; correct family/weight/size | T2.1–T2.2 | `theme.test.ts` + card component test |
| No light hex in dark mode | T2.3 | `theme.test.ts` |
| StatusChip dot + light fill both themes | T3.1 | `StatusChip.test.tsx` |
| Canonical mascot pose + skeletons per screen | T3.2–T3.3, T5.2–T5.7,T5.9 | per-screen tests |
| Nav badges; labels/order; obsolete keys gone | T4.1–T4.2 | drawer/parity tests |
| Admin can mark reserved consumed and cancel | T5.8 | domain+infra+`AdminOrderCard` tests, `test:rules` |
| Dashboard tiles navigate; panels render | T5.5 | dashboard tests |
| Phone admin reaches every destination | T4.3 | `AdminDashboardPage.test.tsx` |
| Correction Save disabled until reason; copy | T5.7 | `CorrectionDialog.test.tsx` |
| Correct plural forms both locales | T5.1 | plural formatting test |
| Dialogs bottom-sheet < md, modal ≥ md | T5.10 | dialog test |
| Rules reject forged timestamp + zero-delta; timezone not hardcoded | T6.1–T6.3 | `test:rules` |
| Both-locale parity; `npm run verify` green | T5.1,T7.1–T7.2 | parity test + gate |
| Docs updated | T7.1 | structural review |

## Documentation, rollout, rollback, risks

- **Rollout**: ship by slice; Slice 1 first (restores login). Within Slice 6,
  client timestamp writes precede the rule tightening (single client, deploy
  together). Rules changes are additive on new writes.
- **Rollback**: revert per-slice; Slice 6 rollback = revert the rules commit
  (no data migration to undo).
- **Risks**: (a) Rules emulator needs Java 21+ and is outside `npm run verify`
  — if unavailable, Slice 6 is implemented but its emulator tests are reported
  as un-run, not silently skipped. (b) Typography size changes cascade
  app-wide; verify a sample of screens visually after T2.1. (c) The consume
  transaction touches batch counters — the conservation assertion and a
  concurrent-move test guard against drift. (d) Mobile-hub and dashboard work
  overlap (T4.3/T5.5) — do together.

## Non-blocking open questions

1. `signInWithPopup` → `signInWithRedirect` (deferred; Slice 1 only guarantees a
   clear error).
2. Exact interim batch-code format (`4-char upper` proposed) pending the
   `batch-sequence-number` SPEC that replaces it.
3. Whether the dashboard hub links are also shown at `md`+ (default: hidden;
   drawer covers it).

## Approval

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Author | Claude (agent) | 2026-07-11 | Draft |
| Approver | Dmytro Tyshchenko | 2026-07-11 | Approved |
