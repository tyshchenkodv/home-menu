# MVP completion — implementation plan

| Field | Value |
| --- | --- |
| Slug | `mvp-completion` |
| Status | Approved |
| Specification | [SPEC.md](./SPEC.md) (Approved 2026-07-11) |
| Created | 2026-07-11 |

## Goal and global constraints

Implement every remaining MVP feature per the approved SPEC in eight vertical
milestones, each ending with a green `npm run verify` and, where rules change,
green `npm run test:rules:docker` against running emulators.

Global constraints (binding for every task):

- React 19 + TypeScript + Vite + MUI CSS-variables theme + `HashRouter`;
  named exports only; one component per folder with colocated `.styles.ts`.
- Domain rules are pure TypeScript under `src/domain/`, returning stable
  English error codes; presentation maps codes to i18next keys.
- Firestore access only through typed converters + services under
  `src/infrastructure/firebase/`; every multi-document mutation uses
  `runTransaction`.
- All user-facing strings come from `src/locales/{uk,en}/translation.json`
  per `docs/design/i18n-catalog.md`; `uk` default, `en` fallback; never `ua`.
- Screen canon: `docs/design/screens/*.md`. Business canon: `docs/03`,
  `docs/04`, `docs/06`, plus SPEC "Domain and data model" rules 1–8.
- TDD: every behavior lands with a failing test first (RED), then the
  minimal implementation (GREEN), then refactor while green.
- No staging, commits, pushes, or PRs unless the user explicitly asks.
- Synthetic fixtures only (`test-admin-uid`, `*.example.test`).

## Scope

All 13 SPEC goals. Inherited non-goals: no CI/deploy changes, no Playwright,
no partial discard, no server scheduler, no user management UI, no
notifications, no admin-inventory changes beyond navigation amendments.

## Impact analysis

| Area | Planning detail |
| --- | --- |
| Architecture | New `src/domain/{dishes,batches,orders}` mirroring `src/domain/inventory` (types, validators, commands, errors, `__tests__`). New converters/services under `src/infrastructure/firebase/{converters,services}`. Feature folders `menu`, `orders`, `admin-orders`, `batches`, `admin-dishes`, `admin-dashboard` replace `FeaturePlaceholder` pages; `src/features/cooking-requests/` is deleted (absorbed into `orders`/`admin-orders`). Dependency direction stays features → domain/infrastructure/shared. |
| Data/domain | Shapes verbatim from `docs/03`; no schema changes. Batch conservation invariant asserted inside every batch-touching transaction. `scheduledFor` built from selected date + `settings/general.defaultMealTimes` in `Europe/Kyiv`. Concurrency via Firestore transaction retries; losing command surfaces a domain error code. |
| Firebase | New converters (`dishConverter`, `preparedBatchConverter`, `orderConverter`, `generalSettingsConverter`), services (`dishService`, `batchService`, `orderService`, `settingsService`), transaction module `orderTransactions.ts` (reserve, cancel, complete-cooking, correction, normalization, discard). `firestore.rules`: new match blocks for `dishes`, `preparedBatches`, `orders`, `settings/general` per the `docs/06` matrix. `firestore.indexes.json`: add the five missing composite indexes from `docs/03`. Emulator suite extends `tests/rules/firestore.rules.test.ts`. |
| Migration | None — all new collections; additive rollout; rollback = route removal. Removed `/admin/requests` URL falls back to the role home redirect (existing `RootRedirect`). |
| Privacy/i18n | No real identities or project IDs; fixtures synthetic. Every new key added to both `uk` and `en` from the catalog; catalog `PROPOSED` gaps resolved during the i18n sweep task. |
| UX | Routes `/menu`, `/orders`, `/admin`, `/admin/orders`, `/admin/batches`, `/admin/dishes`; guards unchanged. AppShell nav: user = Menu/Orders/Settings; admin adds a dedicated Admin tab; the "More" sheet and `/admin/requests` are removed. Settings loses the theme row. All four data states per screen; destructive confirmations; correction requires a reason. |
| Quality | Unit tests per domain module; component tests (Vitest + Testing Library, `src/test/setup.ts` mocks) per screen/dialog; rules tests per collection; docs sync (`docs/02`, `docs/05`, `docs/design/README.md`) in the final task; `npm run verify` gate per milestone and at the end. |

## Conflict resolution

- `docs/design/screen-spec-checklist.md` still lists `/requests`: superseded
  by SPEC goal 11; checklist row left as historical transcription.
- `src/features/cooking-requests/` exists as a placeholder feature: deleted;
  its route removed with the navigation amendment (Task 2).
- Navigation-shell SPEC (approved, immutable) mandated the "More" sheet: the
  amendment is authorized by SPEC goal 11; navigation-shell files are not
  edited.
- No other conflicts found.

## Affected paths (exact)

- `src/domain/dishes/{types.ts,validateDish.ts,evaluateDishAvailability.ts,errors.ts}` + `__tests__/`
- `src/domain/batches/{types.ts,allocateReadyBatchesFifo.ts,batchInvariants.ts,expiration.ts,errors.ts}` + `__tests__/`
- `src/domain/orders/{types.ts,canTransitionOrder.ts,cancellationRules.ts,normalization.ts,scheduledFor.ts,errors.ts}` + `__tests__/`
- `src/infrastructure/firebase/converters/{dishConverter.ts,preparedBatchConverter.ts,orderConverter.ts,generalSettingsConverter.ts}`
- `src/infrastructure/firebase/services/{dishService.ts,batchService.ts,orderService.ts,settingsService.ts,orderTransactions.ts}` + `__tests__/orderTransactions.test.ts`
- `src/features/admin-dishes/` (new: pages `DishesPage`, components `DishList`, `DishCard`, `DishFormDialog`, `ArchiveDishDialog`, hooks `useDishes`, `useDishCommands`)
- `src/features/menu/` (pages `MenuPage`; components `DateMealSelector`, `DishAvailabilityCard`, `ReserveDialog`, `CookingRequestDialog`; hooks `useMenuDishes`, `useDishAvailability`, `useMenuCommands`)
- `src/features/orders/` (pages `OrdersPage`; components `OrderCard`, `OrderTabs`, `CancelOrderDialog`; hooks `useMyOrders`, `useOrderCommands`)
- `src/features/admin-orders/` (pages `AdminOrdersPage`; components `KanbanBoard`, `KanbanColumn`, `AdminOrderCard`, `HistoryList`, `RejectDialog`, `CorrectionDialog`, `CompleteCookingDialog`; hooks `useAdminOrders`, `useAdminOrderCommands`, `useHistoryNormalization`)
- `src/features/batches/` (pages `BatchesPage`; components `BatchCounters`, `BatchCard`, `RegisterBatchDialog`, `DiscardBatchDialog`; hooks `useBatches`, `useBatchCommands`)
- `src/features/admin-dashboard/` (pages `AdminDashboardPage`; components `SummaryTiles`, `PendingRequestsPanel`; hooks `useDashboardData`)
- `src/features/settings/pages/SettingsPage.tsx` (meal times + theme-row removal), new `MealTimesForm` component, hook `useGeneralSettings`
- `src/shared/components/AppShell/` (nav model amendment), `src/shared/components/StatusChip/` (extend mappings)
- `src/app/router.tsx`, `src/app/RootRedirect.tsx`
- `src/locales/uk/translation.json`, `src/locales/en/translation.json`
- `firestore.rules`, `firestore.indexes.json`, `tests/rules/firestore.rules.test.ts`
- Deleted: `src/features/cooking-requests/`, `src/shared/components/FeaturePlaceholder/` (after last placeholder is replaced)
- Docs (final task): `docs/02-architecture.md`, `docs/05-components-and-flows.md`, `docs/design/README.md`, `docs/specifications/README.md`

## Tasks

Each task: RED (named failing test) → GREEN (minimal implementation) →
refactor → `npm run verify`. Rules tasks additionally run
`npm run test:rules:docker` (requires `npm run emulators` up).

### Task 1 — Domain foundation

- [ ] `src/domain/dishes`: RED `validateDish.test.ts` (empty recipe allowed →
      not-configured; incomplete row rejected `dish/incomplete-recipe-item`;
      `requiredQuantity > 0`; ≥1 meal type `dish/meal-type-required`); RED
      `evaluateDishAvailability.test.ts` (all four availability states,
      archived dish, presence vs quantity items) → GREEN.
- [ ] `src/domain/batches`: RED `allocateReadyBatchesFifo.test.ts` (FIFO by
      `preparedAt`, spans batches, insufficient stock
      `batch/insufficient-available`); RED `batchInvariants.test.ts`
      (conservation equality, negative counters rejected); RED
      `expiration.test.ts` → GREEN.
- [ ] `src/domain/orders`: RED `canTransitionOrder.test.ts` (full matrix
      incl. correction-from-any-non-terminal); RED `cancellationRules.test.ts`
      (reserved requires `now < scheduledFor`; pending/approved for cook);
      RED `normalization.test.ts` (idempotent, only reserved/prepared past
      `scheduledFor`); RED `scheduledFor.test.ts` (date + meal time,
      Europe/Kyiv, today..+7 window, quantity 1..99) → GREEN.
- [ ] Extend `src/shared/components/StatusChip/` mappings for order, batch,
      and availability statuses (component test extends existing suite).

### Task 2 — Navigation amendments (depends on 1: none; independent)

- [ ] RED: update `src/app/__tests__/rootRedirect.test.tsx` +
      `src/features/auth/__tests__/routeGuards.test.tsx` + AppShell tests for
      the new nav model (user Menu/Orders/Settings; admin + Admin tab; no
      More sheet; `/admin/requests` gone; `/admin/dishes` present).
- [ ] GREEN: amend `AppShell`, `router.tsx`; delete
      `src/features/cooking-requests/`; add `/admin/dishes` route with a
      temporary placeholder page.
- [ ] RED→GREEN: SettingsPage test asserts no theme control; remove the row
      (toggle remains in `AppHeader`).

### Task 3 — Dishes vertical slice (depends on 1, 2)

- [ ] Rules RED: extend `tests/rules/firestore.rules.test.ts` — `dishes`
      user read / admin write / user write denied / no delete / field
      allowlist. GREEN: `firestore.rules` `match /dishes/{dishId}`.
- [ ] `dishConverter` + `dishService` (list active/archived, create, update,
      archive/restore) with converter unit tests.
- [ ] `src/features/admin-dishes/`: component tests per
      `docs/design/screens/admin-dishes.md` (tabs, form validation messages,
      archive dialog, four data states) → implement.
- [ ] Index: add `dishes: archivedAt ASC, name ASC` to
      `firestore.indexes.json`.

### Task 4 — Menu and reservation (depends on 3)

- [ ] Rules RED: `preparedBatches` (user read; writes admin-only except
      through order transaction) and `orders` (create requires
      `userId == request.auth.uid`, enum/field validation, immutable
      ownership, own-cancel only, admin full) → GREEN rules blocks.
- [ ] Converters + services: `preparedBatchConverter`, `orderConverter`,
      `batchService`, `orderService`; `settingsService` +
      `generalSettingsConverter` with 08:00/13:00/19:00 fallback (unit
      test: missing doc → defaults).
- [ ] `orderTransactions.reserveReadyOrder` RED integration test in
      `src/infrastructure/firebase/__tests__/orderTransactions.test.ts`
      (mirrors `inventoryTransactions.test.ts` emulator pattern): FIFO
      allocation, counter moves, atomic failure on insufficient stock →
      GREEN.
- [ ] `src/features/menu/`: `DateMealSelector` (today..+7, past-meal
      disabled), `DishAvailabilityCard` (four chips), `ReserveDialog`,
      `CookingRequestDialog` (creates `kind: 'cook'`, `pending`); component
      tests per `docs/design/screens/menu-browse.md` and
      `cooking-request.md` → implement.
- [ ] Indexes: `orders` ×3 and `preparedBatches` composite indexes from
      `docs/03`.

### Task 5 — My orders (depends on 4)

- [ ] `orderTransactions.cancelOrder` RED (reserved: allocation restore;
      cook: pending/approved only; forbidden past `scheduledFor` or from
      `cooking`) → GREEN.
- [ ] `src/features/orders/`: Active/History tabs, `OrderCard` status matrix
      (visible/disabled actions per `docs/design/screens/my-orders.md`),
      derived consumed display, batch-expired warning, `CancelOrderDialog`;
      component tests → implement.

### Task 6 — Admin orders and cooking (depends on 5)

- [ ] `orderTransactions` RED→GREEN: `approveRequest`, `rejectRequest`
      (optional reason), `startCooking`, `completeCooking` (full `docs/04`
      transaction incl. yield < requested failure, ingredient deduction,
      `cooking` movements, batch creation, reservation),
      `correctOrder` (required reason, restores allocations, → `cancelled`),
      `normalizeConsumedOrders` (idempotent batch of per-order
      transactions).
- [ ] `src/features/admin-orders/`: Kanban (4 columns, mobile horizontal
      scroll), History tab (status filter + normalization on open), dialogs
      (`RejectDialog`, `CorrectionDialog` reason-required validation,
      `CompleteCookingDialog` actual yield/preparedAt/expiresAt); component
      tests per `docs/design/screens/admin-orders.md` → implement.

### Task 7 — Batches and dashboard (depends on 6)

- [ ] `orderTransactions.discardBatch` RED (available → discarded, reserved
      untouched, conservation holds) → GREEN; ad-hoc
      `registerBatch` (admin cooking without request:
      `sourceCookingRequestId: null`, full yield available, ingredient
      deduction + movements).
- [ ] `src/features/batches/`: counters, card statuses (fresh/expiring/
      expired/fully-reserved/discarded), `RegisterBatchDialog`,
      `DiscardBatchDialog`; component tests per
      `docs/design/screens/admin-batches.md` → implement.
- [ ] `src/features/admin-dashboard/`: tiles (pending requests, low stock,
      expired batches, ready portions) + quick links; component tests per
      `docs/design/screens/admin-dashboard.md` → implement. Remove
      `FeaturePlaceholder` if unused.

### Task 8 — Settings, i18n sweep, hardening, docs (depends on 7)

- [ ] SettingsPage meal times: `MealTimesForm` with `type="time"` fields,
      persistence via `settingsService`, missing-doc defaults banner;
      component tests per `docs/design/screens/settings.md` → implement.
- [ ] i18n sweep: reconcile `src/locales/{uk,en}/translation.json` against
      `docs/design/i18n-catalog.md`; resolve every `PROPOSED` gap; RED = a
      test iterating both resource trees for key parity.
- [ ] Rules-test completeness pass against the full `docs/06` checklist
      (unauthenticated, unprovisioned, inactive, role escalation, audit
      deletion) — `npm run test:rules:docker` green.
- [ ] Docs sync: `docs/02` route/module map, `docs/05` component map,
      `docs/design/README.md` adoption status.
- [ ] Final gate: `npm run verify` green; then mark the index entry
      `Implemented`.

## Acceptance-criteria mapping

| SPEC acceptance criterion | Task | Verification |
| --- | --- | --- |
| Menu derived chips + date window | 4 | menu component tests; `evaluateDishAvailability` unit tests |
| FIFO reservation atomicity | 4 | `orderTransactions.test.ts` emulator integration |
| Cooking request full lifecycle | 4–6 | transaction integration + Kanban component tests |
| Yield-below-request failure | 6 | `completeCooking` RED case |
| Cancellation rules + allocation restore | 5 | `cancelOrder` integration + cancellationRules unit |
| Derived consumed + History normalization | 5, 6 | normalization unit + `useHistoryNormalization` component test |
| Correction with required reason | 6 | `correctOrder` integration + `CorrectionDialog` test |
| Discard conservation | 7 | `discardBatch` integration + invariant unit |
| Dishes CRUD + archive/restore | 3 | dish validation unit + feature component tests |
| Meal-times persistence + defaults | 8 | `settingsService` unit + SettingsPage test |
| Navigation amendments | 2 | router/AppShell/Settings tests |
| Rules checklist | 3, 4, 8 | `npm run test:rules:docker` |
| Six composite indexes | 3, 4 | `firestore.indexes.json` diff review |
| i18n parity | 8 | locale-parity test |
| Verification gate | every task, final in 8 | `npm run verify` |

## Documentation, rollout, rollback, risks

- Documentation updates are Task 8 deliverables; approved SPEC/PLAN stay
  frozen.
- Rollout is additive; no data migration. Rollback of any milestone =
  reverting its file set; earlier milestones remain functional.
- Risks: (1) Rules `getAfter()` counter validation may prove impractical for
  multi-batch allocations — fall back to TypeScript enforcement per
  `docs/06` "Client-only limitations" and document the decision;
  (2) emulator availability — tasks 3–8 require `npm run emulators` running;
  (3) Kanban mobile ergonomics — follow the transcription, defer polish.

## Non-blocking questions

- Dashboard expired-batches tile links to the plain batches screen (SPEC
  default) — revisit post-MVP.

## Approval

| Date | Decision | Notes |
| --- | --- | --- |
| 2026-07-11 | Approved | Explicit user approval in session; implementation authorized to proceed slice-by-slice to the verification gate without intermediate approval stops |
