# Specification: Menu own-reservation hint

| Field | Value |
| --- | --- |
| Slug | `menu-own-reservation-hint` |
| Status | Approved |
| Request | User report: after reserving a portion, the menu card gives no sign you already hold one — it is unclear whether you reserved it or not. |
| Created | 2026-07-11 |
| Related | Builds on `mvp-completion` (menu reserve/request flow); extends `docs/design/screens/menu-browse.md` "DishCard" |

## Problem statement

On the menu-browse screen each dish is a `DishAvailabilityCard`
(`src/features/menu/components/DishAvailabilityCard/DishAvailabilityCard.tsx`)
showing an availability chip, a `{{count}} ready` counter, and a primary action
(Reserve / Request).

The `{{count}} ready` counter is the batch's **still-available** portion count.
Reserving a portion runs a transaction that decrements the batch's
`availableQuantity` and creates an `Order` with `kind: 'ready'`,
`status: 'reserved'`. So after a user reserves 2 of 6 portions, the same card
simply shows "4 ready" with **no indication that this user is holding the other
2**. The only place the user's own reservation surfaces today is the **My
orders** screen.

Result (user's words, paraphrased): the card is confusing — you cannot tell
from it whether you already reserved this dish for this meal or not, so you
might reserve again or hesitate.

The same confusion applies to an outstanding **cooking request** the user has
already submitted for that slot (`kind: 'cook'`, not yet consumed): the card
shows the generic Request action with no hint that a request is already in
flight.

## Goals

1. On each `DishAvailabilityCard`, when the signed-in user already holds one or
   more **ready reservations** (`kind: 'ready'`, `status: 'reserved'`) for that
   **exact slot** (same dish, selected calendar date, and selected meal), show
   an "Already reserved: N" info line under the ready-count area, where N is the
   summed reserved quantity across the user's matching reservation orders.
2. On the same card, when the user already has one or more **active cooking
   requests** (`kind: 'cook'`, status not yet terminal) for that exact slot,
   show a separate "Cooking requested: N" info line, where N is the summed
   requested quantity.
3. Scope a card's hint strictly to the currently selected day + meal tab: the
   number must reflect only orders for that dish, that calendar date (Kyiv), and
   that meal type, and must update as the user switches day or meal.
4. Leave the Reserve / Request primary action and the `{{count}} ready`
   availability counter unchanged — the hint is additive; the user may still
   reserve more up to availability.
5. Add all hint copy to both `uk` and `en` resources with matching keys.
6. Do not change availability, reservation, or cooking-request write behavior,
   Firestore schema, Rules, indexes, or transactions.
7. Cover the slot-matching/summarization logic with unit tests and the card's
   conditional hint rendering with component tests.

## Non-goals

- Changing what `{{count}} ready` means or subtracting the user's own holdings
  from it (availability already excludes reserved portions; no double-count).
- Blocking or disabling re-reservation when the user already holds portions.
- Showing **other** household members' reservations or requests on the card
  (the hint is strictly the signed-in user's own holdings; Firestore Rules
  already scope a non-admin's order reads to their own orders).
- Any change to the My orders screen, cancellation, or the reserve/request
  dialogs.
- Counting terminal orders (`consumed`, `rejected`, `cancelled`) toward either
  hint.
- Real-time recomputation of availability or new indexes/queries beyond the
  user's own-orders subscription that the app already owns.

## Workflow, domain, and data model

### What counts (source of truth)

For a card representing `dish` at the selected `calendarDate` + `mealType`, over
the signed-in user's own orders:

- **Reserved hint quantity** = sum of `order.quantity` for orders where
  `kind === 'ready'` **and** `status === 'reserved'` **and** `dishId` matches
  **and** the order's `scheduledFor`, converted to a Kyiv calendar date, equals
  the selected date **and** `mealType` matches.
- **Requested hint quantity** = sum of `order.quantity` for orders where
  `kind === 'cook'` **and** `status ∈ {pending, approved, cooking, prepared}`
  (every non-terminal cook status) **and** the same dish/date/meal match.

A hint line renders only when its summed quantity is `> 0`.

**Slot match is day-level, not millisecond-level.** The order's `scheduledFor`
is compared by **Kyiv calendar date + meal type**, not by exact millis, so a
later change to the admin's default meal times cannot desynchronize the hint
from a reservation made earlier. This matches the "dish + date + meal" scope the
user chose and the menu's own day/meal selection model.

### Domain function

Add a pure, framework-free helper under `src/domain/orders/` that takes the
user's orders (already reduced to the fields it needs: `dishId`, a slot key of
Kyiv-date + `mealType`, `kind`, `status`, `quantity`) plus a target
(`dishId` + slot key) and returns `{ reservedQuantity, requestedQuantity }`.
Timezone conversion of `scheduledFor` to a Kyiv calendar-date key happens at the
hook/feature layer (reusing the menu's existing `toCalendarDate` +
`calendarDateKey` utilities), keeping `src/domain` free of framework/timezone
concerns — consistent with `docs/02-architecture.md`.

### Data source

Reuse `subscribeOwnOrders(userId, …)`
(`src/infrastructure/firebase/services/orderService.ts`) — the same subscription
that powers My orders — via a menu-scoped hook (or by extending the menu data
flow). `MenuPage` reads `user.uid` from `useAuth` (already available; the menu
feature already uses `useAuth`). No new query, index, or Rules change: a
non-admin already subscribes to `where('userId','==',uid)`, which Rules permit.

The subscription is best-effort for the hint: if it errors, the menu still
renders exactly as today with no hint (the hint is additive and never blocks the
menu's own loading/error states).

## UX and accessibility

- The hint appears as one or two short info lines associated with the ready
  counter (e.g. under the `{{count}} ready` line), visually secondary
  (`text.secondary`)—an unobtrusive status line, not a call to action. Final
  placement/style is a PLAN detail within the existing card layout and the
  shared design-system tokens; it must not push the primary action out of its
  documented position.
- Reserved line: «Вже зарезервовано: {{count}}» / "Already reserved: {{count}}".
- Requested line: «Запит на готування: {{count}}» / "Cooking requested:
  {{count}}".
- Text carries the meaning (no color-only signal), satisfying the repo's
  accessibility convention.
- Roles: the hint is shown to any signed-in user for their **own** holdings.
  Admins see their own holdings by the same rule; this is presentational and not
  an authorization surface.
- States: derived from the already-subscribed orders; shares the menu's existing
  loading/empty/error/ready handling. While own-orders are still loading, no
  hint is shown (absence, not a spinner). No hint when both quantities are 0.

## Deep impact analysis

| Area | Assessment |
| --- | --- |
| Architecture | `features/menu` (new/extended hook to subscribe own orders, `MenuPage` wiring, `DishAvailabilityCard` + its props type, new i18n) and one pure `domain/orders` selector. No `infrastructure` change — reuses `subscribeOwnOrders`. |
| Firebase | None. No schema, converter, query, index, Rules, or transaction change. The own-orders subscription already exists and is Rules-permitted. |
| Domain | New pure selector summarizing the user's own slot holdings; no change to existing invariants, statuses, or reservation/cooking transitions. Day-level slot matching defined above. |
| Privacy | Hint shows only the signed-in user's own reserved/requested counts — no other identities, no new personal data surfaced, no household inventory. Synthetic fixtures only. |
| i18n | New `menu.card.alreadyReserved` and `menu.card.alreadyRequested` keys with `{{count}}` interpolation, added to `uk` and `en`; parity test must pass. |
| UX | Additive secondary info line(s) on the card; primary action and availability counter unchanged; day/meal-scoped. |
| Compatibility | Purely additive and presentational; no data or client-contract change; no rollout/rollback concern. |
| Quality | Unit tests for the slot summarizer (match/no-match by dish, date, meal, kind, status; summing multiple orders; terminal statuses excluded). Component tests for the card rendering each hint when > 0 and hiding it at 0. i18n parity test. |

## Acceptance criteria

- [ ] A card for a dish/date/meal where the user holds a `reserved` ready order
      shows "Already reserved: N" with N = the summed reserved quantity for that
      exact slot.
- [ ] A card where the user has an active (non-terminal) `cook` request for that
      exact slot shows "Cooking requested: N" with N = the summed requested
      quantity.
- [ ] Switching the selected day or meal updates/clears the hint so it always
      reflects the currently shown slot only.
- [ ] Orders for a different dish, different date, or different meal do not
      affect a card's hint.
- [ ] Terminal orders (`consumed`, `rejected`, `cancelled`) never contribute to
      either hint.
- [ ] The `{{count}} ready` counter and the Reserve/Request action are unchanged
      in meaning and behavior; the user can still reserve up to availability.
- [ ] No hint line renders when the corresponding quantity is 0.
- [ ] `menu.card.alreadyReserved` and `menu.card.alreadyRequested` exist in both
      locales; parity test passes.
- [ ] No Firestore schema/Rules/index/transaction change; reservation and
      cooking-request behavior and their tests are unaffected.
- [ ] `npm run verify` passes.

## Milestones

1. Pure own-slot-holdings summarizer in `domain/orders` + unit tests.
2. Menu-scoped own-orders subscription/hook + `MenuPage` wiring computing each
   card's hint quantities (Kyiv date + meal matching).
3. `DishAvailabilityCard` hint lines + props extension + i18n (`uk`/`en`) +
   component tests.
4. Documentation sync (`docs/design/screens/menu-browse.md` DishCard note and
   any affected current docs) + `npm run verify` gate.

## Open questions (non-blocking)

- Exact visual placement/order of the two hint lines relative to the ready
  counter within the card. Recommendation: stack them directly under the ready
  counter, `text.secondary`, reserved line first. (Finalize in PLAN.)
- Whether `prepared` cook requests should read as "Cooking requested" or a
  distinct "Ready to collect" wording. Recommendation: keep the single
  "Cooking requested" line for all non-terminal cook statuses in this slice to
  avoid new status vocabulary on the menu; revisit separately if needed.

## References

- `docs/design/screens/menu-browse.md` ("DishCard", reservation flow ~144-186)
- `src/features/menu/components/DishAvailabilityCard/DishAvailabilityCard.tsx`
  and `src/features/menu/pages/MenuPage.tsx`
- `src/features/menu/types/dishAvailabilityCardProps.ts`,
  `src/features/menu/types/menuDishView.ts`
- `src/features/orders/hooks/useMyOrders.ts`,
  `src/infrastructure/firebase/services/orderService.ts`
  (`subscribeOwnOrders`)
- `src/domain/orders/types.ts` (`Order`, `OrderKind`, `OrderStatus`)
- `src/features/menu/utils/buildDateOptions.ts`
  (`toCalendarDate`, `calendarDateKey`), `KYIV_TIME_ZONE` in `MenuPage`
- `src/features/auth/useAuth.ts`

## Approval

| Role | Decision | Date |
| --- | --- | --- |
| User | Approved | 2026-07-11 |
