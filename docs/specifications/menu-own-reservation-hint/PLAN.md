# Implementation Plan: Menu own-reservation hint

| Field | Value |
| --- | --- |
| Slug | `menu-own-reservation-hint` |
| Status | Approved |
| Spec | [SPEC.md](./SPEC.md) (Approved 2026-07-11) |
| Created | 2026-07-11 |

## Goal, architecture, stack, constraints

Show the signed-in user their own outstanding holdings for the exact
dish/date/meal shown on each menu `DishAvailabilityCard`: an "Already reserved:
N" line for `reserved` ready orders and a "Cooking requested: N" line for active
(non-terminal) `cook` orders. Additive and presentational only.

- **Stack:** React + TypeScript + Vite + MUI, `i18next`/`react-i18next`,
  Firestore (read-only reuse of the existing own-orders subscription). No new
  Firebase surface.
- **Architecture:** one pure `domain/orders` selector; one feature hook in
  `features/menu` that subscribes to the user's own orders and reduces them to
  slot-keyed holdings; `MenuPage` wiring; `DishAvailabilityCard` +
  its props type; `uk`/`en` i18n additions.
- **Global constraints (CLAUDE.md / home-menu-project):** no UI strings inline
  in components (i18n only); matching `uk` + `en` keys in the same change; keep
  `src/domain` free of React/Firebase/MUI/i18n and of timezone concerns;
  synthetic fixtures only; no schema/Rules/index/transaction change; run
  `npm run verify` before completion; do not stage/commit.

## Scope and inherited non-goals

In scope: the four milestones in the SPEC. Non-goals are inherited verbatim from
the SPEC — notably: no change to `{{count}} ready` meaning, no re-reservation
blocking, no other members' holdings, no My orders / dialog / cancellation
changes, no counting terminal statuses, no new Firestore query beyond the
already-owned own-orders subscription.

## Deep impact analysis

| Area | Planning detail |
| --- | --- |
| Architecture | New pure selector `src/domain/orders/summarizeOwnSlotHoldings.ts`. New hook `src/features/menu/hooks/useOwnSlotHoldings.ts` (feature layer owns timezone reduction). New util `src/features/menu/utils/slotKey.ts` (`KYIV_TIME_ZONE`, `buildSlotKey`) — MenuPage stops re-declaring `KYIV_TIME_ZONE` and imports it. `MenuPage` computes per-card summaries; `DishAvailabilityCard` + `dishAvailabilityCardProps.ts` gain two optional numeric props. Dependency direction stays features→domain/shared; domain imports nothing new. |
| Data/domain | Selector input `OwnHoldingOrder { dishId; slotKey; kind; status; quantity }`, target `{ dishId; slotKey }`, output `{ reservedQuantity; requestedQuantity }`. Source of truth = the user's own `orders`. Reserved = `kind==='ready' && status==='reserved'`; Requested = `kind==='cook' && status ∈ {pending,approved,cooking,prepared}`. Slot key = `` `${calendarDateKey(date)}#${mealType}` ``. Summing is additive over matches. No concurrency concern (read-only, live snapshot). |
| Firebase | None. Reuses `subscribeOwnOrders(userId, …)` (`where('userId','==',uid)` — Rules already permit a user's own reads). No converter/index/Rules/transaction change. |
| Migration | None. Purely additive, presentational; no backfill; instant rollback by reverting the diff. Existing order documents render unchanged. |
| Privacy/i18n | Hint shows only the signed-in user's own counts — no other identities, no household inventory, no secrets, no new logs. New keys `menu.card.alreadyReserved`, `menu.card.alreadyRequested` with `{{count}}` added to **both** `src/locales/uk/translation.json` and `src/locales/en/translation.json`; `localeParity.test.ts` enforces parity. |
| UX | No route/permission change. Two `text.secondary` lines under the ready counter, each rendered only when its quantity `> 0`; primary action and availability counter unchanged. While own-orders load, no hint (absence, not spinner); own-orders error is swallowed so the menu renders exactly as today. Text carries meaning (no color-only signal). |
| Quality | TDD: unit tests for the selector; component tests for the card's conditional rendering; parity test covers i18n. Focused commands per task; final `npm run verify`. Update `docs/design/screens/menu-browse.md` DishCard note. |

## Conflict-resolution outcomes

- **Slot matching by day, not millis.** `scheduledFor` is a `Timestamp`; two
  orders for "the same meal" can differ in millis if default meal times changed.
  Resolved per SPEC: reduce each order's `scheduledFor` to a Kyiv
  `calendarDateKey` and compare `date#mealType`. The reduction lives in the
  feature hook (timezone belongs outside `domain`).
- **`KYIV_TIME_ZONE` duplication.** Currently a `MenuPage` local const. Resolved:
  move to `utils/slotKey.ts` and import in both `MenuPage` and the hook — single
  source, behavior-preserving.
- **Best-effort hint vs. menu status.** The own-orders subscription must not gate
  or fail the menu. Resolved: hook returns `[]` on error/loading; menu status is
  unchanged.
- No other conflicts found (no ordering, no security, no rollout conflict).

## Affected paths and interfaces

New:

- `src/domain/orders/summarizeOwnSlotHoldings.ts`
  - `export interface OwnHoldingOrder { dishId: string; slotKey: string; kind: OrderKind; status: OrderStatus; quantity: number }`
  - `export interface SlotHoldingsSummary { reservedQuantity: number; requestedQuantity: number }`
  - `export const summarizeOwnSlotHoldings = (orders: OwnHoldingOrder[], target: { dishId: string; slotKey: string }): SlotHoldingsSummary`
- `src/domain/orders/__tests__/summarizeOwnSlotHoldings.test.ts`
- `src/features/menu/utils/slotKey.ts`
  - `export const KYIV_TIME_ZONE = 'Europe/Kyiv'`
  - `export const buildSlotKey = (date: CalendarDate, mealType: MealType): string` → `` `${calendarDateKey(date)}#${mealType}` ``
- `src/features/menu/hooks/useOwnSlotHoldings.ts`
  - `export const useOwnSlotHoldings = (userId: string): OwnHoldingOrder[]` — subscribes via `subscribeOwnOrders`, maps each `OrderWithId` to `OwnHoldingOrder` using `buildSlotKey(toCalendarDate(order.scheduledFor.toMillis(), KYIV_TIME_ZONE), order.mealType)`; returns `[]` while loading or on error.

Changed:

- `src/features/menu/types/dishAvailabilityCardProps.ts` — add
  `reservedQuantity?: number; requestedQuantity?: number` (both default 0 at use site).
- `src/features/menu/components/DishAvailabilityCard/DishAvailabilityCard.tsx` —
  render the two optional hint lines.
- `src/features/menu/components/DishAvailabilityCard/__tests__/DishAvailabilityCard.test.tsx` —
  new cases.
- `src/features/menu/pages/MenuPage.tsx` — import `KYIV_TIME_ZONE` from
  `utils/slotKey`, call `useOwnSlotHoldings(user?.uid ?? '')`, compute per-view
  summary via `summarizeOwnSlotHoldings`, pass the two quantities to the card.
- `src/locales/uk/translation.json`, `src/locales/en/translation.json` — add the
  two `menu.card.*` keys.
- `docs/design/screens/menu-browse.md` — DishCard implementation note.

Interfaces reused (unchanged): `subscribeOwnOrders`, `OrderWithId`,
`toCalendarDate`, `calendarDateKey`, `useAuth` (`user.uid`), `MenuDishView`.

## Ordered tasks

### Task 1 — Pure slot-holdings selector (domain, TDD)

Depends on: none.

- [ ] Write `src/domain/orders/__tests__/summarizeOwnSlotHoldings.test.ts` with
      cases: (a) sums multiple `reserved` ready orders for the matching
      dish+slot into `reservedQuantity`; (b) sums active `cook` orders
      (`pending`/`approved`/`cooking`/`prepared`) into `requestedQuantity`;
      (c) excludes different `dishId`; (d) excludes different `slotKey`
      (date and meal variants); (e) excludes terminal statuses
      (`consumed`/`rejected`/`cancelled`) and `cancelled` ready orders;
      (f) empty input → `{0,0}`.
- [ ] Run `npx vitest run src/domain/orders/__tests__/summarizeOwnSlotHoldings.test.ts`
      → **RED** (module missing).
- [ ] Implement `src/domain/orders/summarizeOwnSlotHoldings.ts` per the interface
      above; `ACTIVE_COOK_STATUSES = ['pending','approved','cooking','prepared']`.
- [ ] Rerun the focused test → **GREEN**.

Deliverable: reviewable pure function + unit test, no UI.

### Task 2 — Slot-key util + own-orders hook

Depends on: Task 1 (uses `OwnHoldingOrder`).

- [ ] Add `src/features/menu/utils/slotKey.ts` (`KYIV_TIME_ZONE`, `buildSlotKey`).
- [ ] Add `src/features/menu/hooks/useOwnSlotHoldings.ts` subscribing via
      `subscribeOwnOrders`, mapping to `OwnHoldingOrder[]`, returning `[]` on
      loading/error, unsubscribing on cleanup and re-subscribing on `userId`
      change. No hint-specific test here beyond types — its behavior is
      exercised through the selector (Task 1) and the card (Task 3); the hook is
      a thin Firestore adapter mirroring `useMyOrders`.
- [ ] `npx tsc --noEmit` (or `npm run typecheck`) → no type errors.

Deliverable: reviewable util + hook.

### Task 3 — Card hint rendering + props + i18n (TDD)

Depends on: Task 1 (quantities are computed upstream; card just renders props).

- [ ] Add `menu.card.alreadyReserved` and `menu.card.alreadyRequested` (with
      `{{count}}`) to **both** `src/locales/uk/translation.json`
      («Вже зарезервовано: {{count}}», «Запит на готування: {{count}}») and
      `src/locales/en/translation.json` ("Already reserved: {{count}}",
      "Cooking requested: {{count}}").
- [ ] Extend `dishAvailabilityCardProps.ts` with
      `reservedQuantity?: number; requestedQuantity?: number`.
- [ ] Add card test cases in `DishAvailabilityCard.test.tsx`: reserved line
      shown when `reservedQuantity > 0`; requested line shown when
      `requestedQuantity > 0`; both hidden when 0/undefined; existing
      ready/reserve behavior unchanged.
- [ ] Run `npx vitest run src/features/menu/components/DishAvailabilityCard`
      → **RED**.
- [ ] Render the two `text.secondary` hint lines in `DishAvailabilityCard.tsx`
      (under the ready counter, reserved first), each gated on `> 0`, using the
      new keys.
- [ ] Rerun → **GREEN**.

Deliverable: reviewable card + i18n + tests.

### Task 4 — MenuPage wiring

Depends on: Tasks 1–3.

- [ ] In `MenuPage.tsx`: import `KYIV_TIME_ZONE` from `utils/slotKey` (remove the
      local re-declaration); read `user` from `useAuth`; call
      `useOwnSlotHoldings(user?.uid ?? '')`; compute
      `const slotKey = buildSlotKey(selectedDate, mealType)`; for each `view`
      compute `summarizeOwnSlotHoldings(holdings, { dishId: view.dish.id, slotKey })`
      and pass `reservedQuantity` / `requestedQuantity` to `DishAvailabilityCard`.
- [ ] Add/extend a `MenuPage.test.tsx` case: with a mocked own-order matching the
      selected slot, the card shows the reserved hint; switching meal/day clears
      it. (Mock `subscribeOwnOrders` like existing menu subscription mocks.)
- [ ] Run `npx vitest run src/features/menu/__tests__/MenuPage.test.tsx`
      → **GREEN** (after wiring).

Deliverable: end-to-end wired feature with a page-level test.

### Task 5 — Docs sync + verification gate

Depends on: Tasks 1–4.

- [ ] Update `docs/design/screens/menu-browse.md` with a DishCard implementation
      note describing the own-holdings hint (day+meal scoped, own orders only).
- [ ] `npm run fix` (eslint --fix then prettier) for any style.
- [ ] `npm run verify` → **all green** (typecheck, lint, format:check, test,
      build).
- [ ] Mark the index row `Implemented` in `docs/specifications/README.md`.

Deliverable: green gate + synced docs.

## Acceptance-criteria mapping

| SPEC acceptance criterion | Task(s) | Verification |
| --- | --- | --- |
| Reserved line shows summed reserved N for exact slot | 1, 3, 4 | selector unit test (a); card test; MenuPage test |
| Requested line shows summed active-cook N for exact slot | 1, 3, 4 | selector unit test (b); card test |
| Day/meal switch updates/clears hint | 2, 4 | `buildSlotKey` per selection; MenuPage test |
| Different dish/date/meal do not affect a card | 1 | selector tests (c),(d) |
| Terminal statuses never contribute | 1 | selector test (e) |
| Ready counter + Reserve/Request unchanged | 3 | card test asserts existing behavior intact |
| No hint line at quantity 0 | 3 | card test (both hidden at 0) |
| Both locale keys exist; parity passes | 3 | `localeParity.test.ts` in `npm run verify` |
| No schema/Rules/index/transaction change; reservation behavior unaffected | all | no infra files touched; full test suite in `npm run verify` |
| `npm run verify` passes | 5 | gate |

## Documentation, rollout, rollback, risks

- **Docs:** `docs/design/screens/menu-browse.md` DishCard note (Task 5).
- **Rollout:** additive; no flag, no migration; ships with the branch.
- **Rollback:** revert the diff — no persisted state to unwind.
- **Risks:** (1) meal-time drift desynchronizing millis — mitigated by day-level
  matching. (2) A large own-orders history increases the reduce cost — negligible
  at household scale; the same subscription already powers My orders.

## Non-blocking open questions

- Whether `prepared` cook requests deserve distinct "Ready to collect" wording —
  deferred per SPEC; single "Cooking requested" line for all non-terminal cook
  statuses in this slice.
- Final micro-placement/spacing of the two lines within the card footer — decided
  during Task 3 within existing design-system tokens.

## Approval

| Role | Decision | Date |
| --- | --- | --- |
| User | Approved | 2026-07-11 |
