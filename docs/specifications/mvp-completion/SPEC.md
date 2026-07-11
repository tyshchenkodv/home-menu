# MVP completion

| Field | Value |
| --- | --- |
| Slug | `mvp-completion` |
| Status | Approved |
| Request | Implement every remaining MVP feature in one pre-approved umbrella so an agent can build to a passing verification gate without intermediate approval stops |
| Created | 2026-07-11 |
| Related | [Navigation shell](../navigation-shell/SPEC.md) (partially amended here), [Admin inventory foundation](../admin-inventory-foundation/SPEC.md), [Design system foundation](../design-system-foundation/SPEC.md) |

## Problem statement

The application scaffold is complete: auth with role guards, the responsive
navigation shell, the design system, and the full admin-inventory feature.
Every other destination (`/menu`, `/orders`, `/admin`, `/admin/orders`,
`/admin/batches`, `/admin/requests`, dishes management) renders a
`FeaturePlaceholder` "coming soon" screen. The product cannot do its core job:
browsing a derived menu, reserving prepared portions, requesting cooking,
completing cooking, and managing dishes and batches.

The supporting documentation is now complete and internally consistent:

- `docs/03-data-model.md` and `docs/04-business-logic.md` define every
  collection, invariant, and transaction;
- `docs/06-auth-and-security.md` defines the permission matrix and the Rules
  test checklist;
- `docs/design/screens/*.md` transcribe every screen (layout, data states,
  dialogs, validation, status matrices) with resolved design decisions;
- `docs/design/i18n-catalog.md` catalogs all 307 uk/en translation keys.

This specification is the single approval that authorizes implementing all
remaining MVP features, including the navigation amendments decided on
2026-07-10, and defines the small set of business rules the current
documentation left open.

## Goals

1. **Menu browse** (`/menu`): date and meal selection, derived dish
   availability per `docs/03` "Derived availability" and `docs/04` "Building
   the menu", with status chips Ready now / Can be cooked / Unavailable /
   Not configured.
2. **Ready-order reservation**: `placeReadyOrder` FIFO transaction per
   `docs/04`, launched from a dish card via the reservation confirmation
   dialog.
3. **Cooking requests**: creation from a dish card in Menu browse; lifecycle
   `pending → approved → cooking → prepared` with `rejected` and `cancelled`
   per `docs/04`.
4. **My orders** (`/orders`): "Active" and "History" tabs listing the user's
   orders and cooking requests together; cancellation per `docs/04`
   (reserved while `now < scheduledFor`; pending/approved for requests);
   client-derived consumed state after `scheduledFor`.
5. **Admin orders** (`/admin/orders`): four-column Kanban
   (pending/approved/cooking/prepared) plus a "History" tab with a status
   filter over terminal orders (reserved, consumed, rejected, cancelled);
   approve, reject (optional reason), start cooking, complete cooking, and
   audited correction actions.
6. **Completing cooking**: the `docs/04` "Completing cooking" transaction
   (actual yield, ingredient deduction, batch creation, reservation), both
   from a request and ad hoc without one.
7. **Prepared batches** (`/admin/batches`): counters, expiration warnings,
   ad-hoc batch registration, and discard of the available remainder.
8. **Admin dashboard** (`/admin`): summary tiles (pending requests, low
   stock, expired batches, ready portions) and quick links to the admin
   subscreens.
9. **Dishes management** (`/admin/dishes`): list with availability chips and
   Active/Archived tabs, create/edit forms per
   `docs/design/screens/admin-dishes.md`, archive and restore.
10. **Settings persistence**: default meal times stored in `settings/general`
    edited with time-picker fields; sensible in-app defaults
    (08:00 / 13:00 / 19:00, `Europe/Kyiv`) when the document does not exist.
11. **Navigation amendments** (amends `navigation-shell`): the admin mobile
    bottom navigation uses a dedicated "Admin" tab (no "More" sheet); the
    user bottom navigation is Menu / Orders / Settings; the `/admin/requests`
    route and the standalone user requests destination are removed (requests
    live inside My Orders and the admin Kanban); the Settings screen has no
    theme row (theme toggle lives only in the `AppHeader`).
12. **Firestore security**: rules, converters, and composite indexes for
    `dishes`, `preparedBatches`, `orders`, and `settings/general` per the
    `docs/06` permission matrix and requirements, with emulator rules tests
    covering the `docs/06` checklist.
13. **i18n**: every user-facing string from `docs/design/i18n-catalog.md`
    exists in both `uk` and `en` resources; no user-facing literals in
    components.

## Non-goals

- CI/CD or deployment changes (needs real GitHub secrets; separate work).
- Playwright end-to-end tests (deferred per `docs/07`).
- Server-side scheduling, Cloud Functions, Storage, or offline writes.
- Partial batch discard (only the full available remainder is discarded).
- Editing an existing order's quantity or schedule by the user.
- User management UI (profiles remain manually provisioned).
- Push or in-app notifications.
- Changing the implemented admin-inventory feature beyond the navigation
  amendments (goal 11).

## Domain and data model

`docs/03-data-model.md` is the source of truth; no schema changes are
required. The following rules close the gaps the current documentation left
open. They are part of this specification's contract:

1. **Dish validation**: a dish may be saved with zero recipe items (it
   derives "Not configured" and cannot be ordered); every present recipe item
   must be complete (ingredient reference plus `requiredQuantity > 0` or
   `requiresPresence == true`); `mealTypes` must contain at least one value;
   `description` is optional.
2. **Menu date range**: the date selector offers today through today + 7
   days. A meal on the selected date is orderable only while
   `now < scheduledFor`, where `scheduledFor` combines the selected date with
   the default meal time from settings.
3. **Order quantity bounds**: integer `1..99`, additionally bounded by total
   available prepared portions for ready orders.
4. **Admin correction**: an audited correction is a transaction that cancels
   an order or request from any non-terminal status, requires a reason
   (stored in `rejectionReason`), restores allocations for reserved orders,
   and records the acting admin via `updatedBy`. The resulting status is
   `cancelled`. No other retroactive edits exist in the MVP.
5. **Expired or discarded batch with reserved orders**: no automatic
   mutation. Both roles see a warning on the affected cards; the admin
   resolves via correction (rule 4). Discarding a batch never touches
   `reservedQuantity`.
6. **Consumed normalization**: opening the admin orders History tab triggers
   best-effort, per-order idempotent normalization transactions
   (`reservedQuantity -= quantity`, `consumedQuantity += quantity`,
   `status = consumed`) for orders whose persisted status is `reserved` or
   `prepared` and `scheduledFor < now`, per `docs/04`.
7. **Domain modules**: pure functions live under `src/domain/` —
   `domain/dishes` (`evaluateDishAvailability`, dish validation),
   `domain/batches` (`allocateReadyBatchesFifo`, conservation checks,
   expiration), `domain/orders` (`canTransitionOrder`, cancellation and
   normalization rules, `scheduledFor` construction). Domain functions return
   stable English error codes; presentation maps codes to i18next keys.
8. **Firestore access**: typed services and hooks under
   `src/infrastructure/firebase` following the existing inventory service
   patterns; all multi-document mutations (reservation, cooking completion,
   cancellation, correction, discard, normalization) use `runTransaction`.

## UX and accessibility

`docs/design/screens/*.md` are the canon for layout, copy, data states,
dialogs, and validation; `docs/design/i18n-catalog.md` is the canon for
strings. Cross-cutting requirements:

- every screen implements loading (`CatArt sleeping`/skeleton), empty
  (`CatArt empty`), error (`CatArt confused` with retry), and populated
  states;
- status is never conveyed by color alone; chips carry translated labels;
- destructive actions (discard, cancel, archive, correction) require
  confirmation dialogs; correction requires a non-empty reason;
- touch targets ≥ 44 px on mobile; dialogs trap focus; the active navigation
  destination is exposed to assistive technology (existing shell behavior);
- responsive: `BottomNavigation` below `md`, persistent `Drawer` at and
  above; Kanban scrolls horizontally on mobile and shows four columns on
  desktop; both color schemes supported everywhere.

## Impact analysis

| Area | Impact |
| --- | --- |
| Architecture | New `domain/dishes`, `domain/batches`, `domain/orders` modules; new feature folders `menu`, `orders`, `admin-orders`, `batches`, `admin-dishes`, `admin-dashboard` (replacing placeholders); `cooking-requests` feature folder is absorbed into `orders`/`admin-orders` and removed; router and `AppShell` navigation amended per goal 11. |
| Firebase | New rules blocks, converters, typed services, and queries for `dishes`, `preparedBatches`, `orders`, `settings/general`; five new composite indexes from `docs/03`; transactions per `docs/04`; no data migration (all collections are new). |
| Domain | Invariants 1–10 from `docs/04` enforced in pure TypeScript with unit tests; batch conservation invariant asserted in every batch-touching transaction; time handling uses `Timestamp` and the `Europe/Kyiv` timezone from settings. |
| Privacy | Synthetic fixtures only (`admin@example.test`, `test-admin-uid` style); no real identities, project IDs, or household data; `.env*` stays ignored. |
| i18n | All keys from the catalog land in `src/locales/uk` and `src/locales/en`; `uk` default, `en` fallback; dish names/descriptions are user-generated and never machine-translated. |
| UX | Routes `/menu`, `/orders`, `/admin`, `/admin/orders`, `/admin/batches`, `/admin/dishes` become real; `/admin/requests` is removed; role guards unchanged (`RequireAuth`, `RequireActiveProfile`, `RequireAdmin`). |
| Compatibility | Additive rollout on empty production collections; HashRouter URLs for removed routes fall back to the role home redirect; no deployed-client concerns (single household). |
| Quality | Unit tests for every domain module; component tests for screens, dialogs, and guards; emulator rules tests covering the `docs/06` checklist; `npm run verify` green; current docs (`docs/02`, `docs/05`, design README) updated after implementation. |

## Acceptance criteria

- [ ] Menu browse shows only orderable-meal dishes with correct derived
      chips for all four availability states, within the today..+7 range.
- [ ] Reserving portions creates a `reserved` order with FIFO allocations,
      decrements `availableQuantity`, and fails atomically on insufficient
      stock or a concurrent conflict.
- [ ] A cooking request created from a dish card reaches `prepared` through
      the full admin lifecycle; ingredients are deducted and a batch with
      reserved portions is created in one transaction.
- [ ] Actual yield below the requested quantity fails the completion
      transaction with a translated error.
- [ ] A user can cancel exactly the states the rules allow, and allocations
      are restored on reservation cancel.
- [ ] After `scheduledFor`, the user and admin UIs derive consumed; opening
      the admin History tab normalizes stale counters idempotently.
- [ ] Admin correction cancels any non-terminal order with a required
      reason, restoring allocations when present.
- [ ] Batch discard zeroes `availableQuantity` into `discardedQuantity`,
      never touches reserved portions, and preserves the conservation
      invariant.
- [ ] Dishes CRUD enforces rule 1 (domain validation) and supports archive
      and restore; archived dishes disappear from the menu.
- [ ] Default meal times persist to `settings/general` and fall back to
      08:00/13:00/19:00 when the document is missing.
- [ ] Navigation matches goal 11 on mobile and desktop for both roles; the
      Settings screen has no theme row.
- [ ] Firestore rules pass the full `docs/06` emulator checklist; user
      writes to admin-only collections are denied; order ownership is
      enforced.
- [ ] `firestore.indexes.json` contains the six composite indexes from
      `docs/03`.
- [ ] Every user-facing string resolves from `uk` and `en` resources; no
      hardcoded literals in components.
- [ ] `npm run verify` and the emulator rules tests pass.

## Milestones

1. **Domain foundation** — `domain/dishes`, `domain/batches`,
   `domain/orders` with unit tests; shared status/chip mappings.
2. **Dishes** — rules + service + `/admin/dishes` CRUD; menu availability
   becomes computable.
3. **Menu and reservation** — `/menu`, reservation transaction, rules and
   indexes for `orders` and `preparedBatches`.
4. **My orders** — `/orders` tabs, cancellation, derived consumed,
   requests-inside-orders; request creation dialog in Menu.
5. **Admin orders and cooking** — Kanban, History with normalization,
   rejection/correction, completion transaction, ad-hoc batch registration.
6. **Batches and dashboard** — `/admin/batches` counters and discard,
   `/admin` tiles and quick links.
7. **Settings and navigation amendments** — meal-times persistence, Admin
   tab, route removals, Settings theme-row removal.
8. **Hardening** — full rules-test checklist, i18n sweep against the
   catalog, documentation updates, final verification gate.

Milestone order may interleave where dependencies allow; each milestone ends
with a green `npm run verify` plus applicable rules tests.

## Open questions (non-blocking)

- Whether the dashboard "expired batches" tile links to a pre-filtered
  batches view or the plain screen (default: plain screen).
- Exact skeleton composition per screen (default: follow the transcriptions;
  where silent, match admin-inventory patterns).

## References

- `docs/01-overview.md` … `docs/06-auth-and-security.md` (product, data
  model, business rules, permission matrix).
- `docs/design/screens/*.md` and `docs/design/i18n-catalog.md` (screen and
  string canon).
- `docs/design/screen-spec-checklist.md` (coverage definition; its
  `/requests` route row is superseded by goal 11).
- Existing patterns: `src/features/admin-inventory/`,
  `src/domain/inventory/`, `src/infrastructure/firebase/`,
  `firestore.rules`, `src/test/`.

## Approval

| Date | Decision | Notes |
| --- | --- | --- |
| 2026-07-11 | Approved | Explicit user approval in session; grill-me waived by user instruction, open business rules resolved inline |
