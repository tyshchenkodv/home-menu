# Specification: Sequential batch number

| Field | Value |
| --- | --- |
| Slug | `batch-sequence-number` |
| Status | Approved |
| Request | Carve-out from `mvp-audit-remediation` (implementation-time scope change) |
| Created | 2026-07-11 |
| Related | Supersedes the "Pending follow-up" note for `batch-sequence-number` in `docs/specifications/README.md`; extends `mvp-completion` |

## Problem statement

When a prepared batch is created, admins and users need a short, stable,
human-friendly identifier to refer to a physical batch of cooked portions
("which batch is this order from?", "discard batch #7").

Today there is no real batch number. The admin order card derives an **interim
code** inline — the last four characters of the Firestore document id,
uppercased (`order.preparedBatchId.slice(-4).toUpperCase()`, e.g. "партія
7A3C") at `src/features/admin-orders/components/AdminOrderCard/AdminOrderCard.tsx`.
That code is:

- **not human-friendly** — a hex fragment nobody can read aloud or remember;
- **not ordered** — gives no sense of "earlier vs later batch";
- **not stored** — it is recomputed from the id and exists nowhere in the
  data model, so it cannot be queried, sorted, or referenced elsewhere.

The interim code's own source comment already anticipates this specification.

## Goals

1. Assign every newly created prepared batch a **global, monotonically
   increasing, gap-tolerant sequential number**, allocated at creation time.
2. Store the number as a first-class integer field (`batchNumber`) on the
   prepared-batch document, exposed through the domain type and converter.
3. Allocate the number **atomically within the existing batch-creation
   Firestore transaction**, so two concurrent batch creations never receive
   the same number.
4. Display the number as `#NNN` (zero-padded to at least 3 digits, growing
   naturally beyond) wherever the interim code is shown today, replacing the
   id-derived code.
5. Enforce the new field in Firestore Security Rules: valid on create,
   immutable on every subsequent update (including user reservation and
   cancellation moves).
6. Keep the counter document readable only where required and writable only
   through the batch-creation transaction path (admins).
7. Cover the allocation, immutability, formatting, and concurrency-safety
   behaviors with unit, rules, and component tests, in both locales.

## Non-goals

- Per-dish or daily-reset numbering (explicitly rejected — a single global
  counter was chosen).
- Backfilling a `batchNumber` onto pre-existing batches. Historical batches
  created before this change have no number; the UI falls back gracefully
  (see UX). No data migration job is run.
- Reusing or compacting numbers when a batch is discarded (numbers are
  allocated once and never recycled; gaps are acceptable and expected).
- Changing any availability, reservation, conservation, or expiry behavior.
- A user-facing search/filter by batch number (future work if needed).

## Workflow, domain, and data model

### Source of truth

A single Firestore **counter document** holds the last allocated batch number.

- Path: `counters/preparedBatchNumber` (a dedicated top-level `counters`
  collection so future counters can share the pattern).
- Shape: `{ value: number }` where `value` is the highest number allocated so
  far (starts effectively at 0; first batch becomes 1).

### Allocation

Both existing batch writers allocate the next number inside their transaction:

- `markOrderPrepared` — cook-request flow, batch written at
  `src/infrastructure/firebase/services/orderTransactions.ts` (~line 680).
- `registerBatch` — ad-hoc cooking flow, batch written (~line 1176).

Allocation algorithm inside each transaction:

1. `transaction.get(counterRef)` — **must occur before any write in the
   transaction** (Firestore requires all reads before all writes; both
   functions currently issue their first write as an ingredient update, so the
   counter read is added ahead of those).
2. `next = (snapshot.exists() ? snapshot.data().value : 0) + 1`.
3. `transaction.set(counterRef, { value: next })` (idempotent set, not
   `increment()`, so the value is deterministic and testable).
4. Write the batch document with `batchNumber: next`.

Because the counter read participates in the transaction, a concurrent batch
creation that touched the same counter forces a Firestore retry, guaranteeing
uniqueness without an index or Cloud Function.

### Domain and types

- `PreparedBatch<TTimestamp>` (`src/domain/batches/types.ts`) gains
  `batchNumber: number`.
- `PreparedBatchDoc` / `PreparedBatchWithId`
  (`src/shared/types/preparedBatch.ts`) inherit it.
- `preparedBatchConverter` (`fromFirestore`) maps the new field.
- A pure formatter (new, `src/domain/batches/formatBatchNumber.ts` or similar)
  turns a number into the `#NNN` display string. UI copy still comes from
  i18next — the formatter returns the numeric token, the translation supplies
  surrounding text.

### Compatibility / migration

Additive, no backfill. Documents written before this change lack
`batchNumber`. The converter maps a missing field to `null`; consumers treat
`null` as "no number" and fall back to the prior interim code (or omit the
segment) so old batches never render `#undefined`. New writes always include a
number.

## UX and accessibility

- **Admin order card** (`AdminOrderCard.tsx`): the meta line currently reads
  `{{requester}} · партія {{code}}`. It becomes `{{requester}} · партія
  #{{number}}` using the stored, formatted number. When `batchNumber` is null
  (legacy batch), fall back to the existing id-derived code so no order loses
  its batch reference.
- No new route, role, or destructive action. Roles unchanged (admins create
  batches; the number is read-only to everyone via rules).
- Loading/empty/error states unchanged — the number is part of already-loaded
  batch data.
- Accessibility: the number is plain text within the existing meta line; no
  color-only signal.

## Deep impact analysis

| Area | Assessment |
| --- | --- |
| Architecture | `domain/batches` (type + formatter), `infrastructure` (converter + two transaction writers + counter ref), `features/admin-orders` (display), `shared/types`. No new layer. |
| Firebase | New `counters/preparedBatchNumber` doc; counter read+set added inside two existing transactions (reads-before-writes ordering enforced); converter change; new `batchNumber` field on `preparedBatches`. No new composite index (single-doc counter). |
| Domain | New invariant: `batchNumber` strictly increases across batches and is immutable per batch. Conservation, availability, and expiry invariants unchanged. |
| Privacy | A monotonic count leaks only the total number of batches ever cooked — acceptable, non-personal. No identities in the counter. Synthetic fixtures only. |
| i18n | `orders.admin.meta.batch` value updated (uk + en) to interpolate `#{{number}}`. Any new key added to both locales; parity test must pass. |
| UX | Single meta-line copy change; legacy fallback prevents regressions. |
| Compatibility | Additive field; null-safe converter and fallback; no backfill; safe for deployed clients reading old docs. |
| Quality | Unit (formatter, allocation logic), rules (create valid/invalid number, immutability on admin update + user reservation/cancellation moves, counter access), component (`AdminOrderCard` renders `#NNN` and legacy fallback). |

### Security Rules changes (`firestore.rules`)

- `hasOnlyBatchFields` (the closed 15-field allow-list, ~243) must include
  `batchNumber`, otherwise every batch create/update is rejected.
- `hasRequiredBatchTypes` must assert `batchNumber is int` (and `> 0`) on
  create.
- `isUserReservationMove` and `isUserCancellationMove` `after.keys().hasOnly([…])`
  lists must include `batchNumber`, plus `after.batchNumber == before.batchNumber`
  so a user move cannot alter the number.
- Admin update path must likewise keep `after.batchNumber == before.batchNumber`
  (number is allocate-once, never edited).
- New `match /counters/{counterId}`: `read` by `activeUser()` (client reads
  are not actually needed for allocation, but harmless and simpler);
  `write: if isAdmin()` constrained to the `{ value: int }` shape and a
  non-decreasing value (`request.resource.data.value > resource.data.value`
  on update, `== 1` or `>= 1` on create). Delete `false`.

## Acceptance criteria

- [ ] A newly created batch (both `markOrderPrepared` and `registerBatch`)
      persists a `batchNumber` equal to the previous max + 1.
- [ ] Two batches created in sequence have consecutive numbers; a discarded
      batch does not cause reuse of its number.
- [ ] The counter document is updated in the same transaction as the batch;
      a rules test confirms non-admins cannot write it.
- [ ] `AdminOrderCard` renders `партія #NNN` / `batch #NNN` for numbered
      batches and falls back to the id-derived code for legacy (null) batches.
- [ ] Rules reject a batch create whose `batchNumber` is missing, non-int, or
      ≤ 0, and reject any update that changes `batchNumber` (admin, reservation
      move, cancellation move).
- [ ] `orders.admin.meta.batch` updated in both `uk` and `en`; locale parity
      test passes.
- [ ] `npm run verify` and `npm run test:rules:docker` pass.

## Milestones

1. Domain type + converter + formatter + unit tests.
2. Transaction allocation (both writers) + rules field/immutability/counter +
   rules tests.
3. UI display + i18n + component test.
4. Docs sync + full gate.

## Open questions (non-blocking)

- Zero-padding width: start at 3 digits (`#001`). Recommendation: pad to 3,
  overflow naturally past 999. (Assumed; adjust in PLAN if undesired.)
- Whether legacy batches should show the interim code or nothing. Recommend
  keeping the interim code as fallback so no historical order loses its
  reference. (Assumed.)

## References

- `src/features/admin-orders/components/AdminOrderCard/AdminOrderCard.tsx`
  (interim code, ~55-64)
- `src/infrastructure/firebase/services/orderTransactions.ts`
  (`markOrderPrepared` ~658-688, `registerBatch` ~1053-1180)
- `src/domain/batches/types.ts`, `src/shared/types/preparedBatch.ts`,
  `src/infrastructure/firebase/converters/preparedBatchConverter.ts`
- `firestore.rules` (batch validation ~243-379)
- `src/locales/{uk,en}/translation.json` (`orders.admin.meta.batch`)

## Approval

| Role | Decision | Date |
| --- | --- | --- |
| User | Approved | 2026-07-11 |
