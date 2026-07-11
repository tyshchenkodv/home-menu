# Plan: Sequential batch number

| Field | Value |
| --- | --- |
| Slug | `batch-sequence-number` |
| Status | Approved |
| Spec | [SPEC.md](./SPEC.md) (Approved 2026-07-11) |
| Created | 2026-07-11 |

## Goal, architecture, stack

Add a global, monotonic, gap-tolerant `batchNumber` to every newly created
prepared batch, allocated atomically inside the existing batch-creation
transactions, persisted on the document, enforced immutable by Rules, and
displayed as `#NNN` in place of today's id-derived interim code.

Stack: React 19 + TS + Vite + MUI v9, Firebase Firestore (client SDK 12,
transactions), i18next uk/en, Vitest, `@firebase/rules-unit-testing`.

## Scope

In: domain type + converter + pure formatter; counter document + transactional
allocation in both writers; Rules field/type/immutability + counter match;
`AdminOrderCard` display; i18n; tests. Out (inherited non-goals): per-dish/
daily numbering, backfill of legacy batches, number recycling, any
availability/reservation/expiry change.

## Deep impact analysis

| Area | Detail |
| --- | --- |
| Architecture | `domain/batches` (type, formatter), `shared/types/preparedBatch`, `infrastructure/firebase` (converter, `orderTransactions` two writers, counter ref), `features/admin-orders` (display). Dependency direction unchanged (feature→domain, infra→domain). |
| Data/domain | New field `batchNumber: number` (positive int). Invariant: strictly increasing across creations, immutable per batch. Counter doc `counters/preparedBatchNumber = { value: int }`, source of truth for the next number. Conservation/availability/expiry untouched. |
| Firebase | Counter read added before all writes in each transaction (reads-before-writes). `transaction.set(counterRef, { value: next })` + `batchNumber: next` on the batch. New `match /counters/{counterId}`. Field added to batch allow-list, type check, both user-move key lists + equality guard. No composite index. |
| Migration | Additive. Legacy batches have no field → converter maps to `null`; display falls back to id-derived code. No backfill job. Counter auto-creates on first allocation (absent → treat as 0). |
| Privacy/i18n | Counter leaks only total batch count (non-personal). `orders.admin.meta.batch` updated in uk+en; any new key mirrored. Synthetic fixtures only. |
| UX | One meta-line copy change; legacy fallback preserves references. No new route/role/destructive action. |
| Quality | Unit (formatter, allocation), rules (create valid/invalid, immutability across admin + user moves, counter access), component (`AdminOrderCard` numbered + legacy fallback). Full `npm run verify` + `test:rules:docker`. |

## Conflict resolution

- **Reads-before-writes**: both writers currently issue their first write as an
  ingredient `update`. The counter `transaction.get` must be added ahead of the
  earliest write in each function. Verified writers: `markOrderPrepared`
  (batch set ~680, first ingredient write ~630) and `registerBatch` (batch set
  ~1176, first ingredient write ~1128). No other conflict found.
- **User reservation/cancellation moves**: these client updates re-assert the
  full field allow-list and require non-counter fields unchanged; `batchNumber`
  must be added to their `hasOnly` lists **and** pinned equal, or user
  reserve/cancel on numbered batches breaks. Covered in T2.

## Affected paths

- `src/domain/batches/types.ts` — add `batchNumber` to `PreparedBatch`.
- `src/domain/batches/formatBatchNumber.ts` — NEW pure formatter.
- `src/shared/types/preparedBatch.ts` — inherits field (verify no manual list).
- `src/infrastructure/firebase/converters/preparedBatchConverter.ts` —
  `fromFirestore` maps `batchNumber` (null-safe), `toFirestore` passthrough.
- `src/infrastructure/firebase/services/orderTransactions.ts` — counter ref
  constant; allocation in `markOrderPrepared` and `registerBatch`.
- `firestore.rules` — batch field lists/types/immutability + `counters` match.
- `src/features/admin-orders/components/AdminOrderCard/AdminOrderCard.tsx` —
  use stored number, legacy fallback.
- `src/locales/{uk,en}/translation.json` — `orders.admin.meta.batch`.
- Tests: `src/domain/batches/__tests__/formatBatchNumber.test.ts`,
  `orderTransactions` allocation test (extend existing suite if present),
  `tests/rules/firestore.rules.test.ts`, `AdminOrderCard.test.tsx`.

## Tasks (TDD)

### T1 — Domain field + formatter
- [ ] T1.1 RED: add `formatBatchNumber.test.ts` — `formatBatchNumber(1) === '001'`,
      `formatBatchNumber(42) === '042'`, `formatBatchNumber(1234) === '1234'`.
      Run `npx vitest run formatBatchNumber` → fails (no module).
- [ ] T1.2 GREEN: implement `formatBatchNumber` (pad-start to 3). Rerun → pass.
- [ ] T1.3 Add `batchNumber: number` to `PreparedBatch<TTimestamp>`; update
      `preparedBatchConverter.fromFirestore` to map `data.batchNumber ?? null`
      cast appropriately (doc type may need `batchNumber: number | null` on the
      stored shape while domain uses `number` for freshly built batches —
      resolve by typing the converter output field as `number | null` and
      display-layer null-guarding). Fix any type breakage. `npm run typecheck`.

### T2 — Transactional allocation + Rules
- [ ] T2.1 RED (rules): in `firestore.rules.test.ts` add cases — admin create
      with valid `batchNumber` (int>0) allowed; create with missing/0/string
      rejected; admin update changing `batchNumber` rejected; a user reservation
      move and a cancellation move that keep `batchNumber` equal still allowed,
      one that changes it rejected; non-admin write to
      `counters/preparedBatchNumber` rejected, admin increment allowed. Run
      `npm run test:rules:docker` → fails.
- [ ] T2.2 GREEN (rules): in `firestore.rules` add `batchNumber` to
      `hasOnlyBatchFields`, add `data.batchNumber is int && data.batchNumber > 0`
      to `hasRequiredBatchTypes`; add `batchNumber` to `isUserReservationMove`
      and `isUserCancellationMove` `hasOnly` lists + `after.batchNumber ==
      before.batchNumber`; add admin-update equality `after.batchNumber ==
      before.batchNumber`; add `match /counters/{counterId}` (read
      `activeUser()`; create `isAdmin() && request.resource.data.keys().hasOnly(['value']) && request.resource.data.value is int && request.resource.data.value >= 1`; update same + `request.resource.data.value > resource.data.value`; delete false). Restart emulator (rules no hot-reload), rerun → pass.
- [ ] T2.3 RED (allocation): add a unit/integration test asserting a batch
      built by the writers carries `batchNumber = prevMax + 1`. If the writers
      are only exercisable against the emulator, add an emulator-backed test;
      otherwise extract the allocation step into a testable pure helper
      `nextBatchNumber(counterSnapshot)` and unit-test it. Run → fails.
- [ ] T2.4 GREEN: add `COUNTERS_COLLECTION`/counter ref; in both writers
      `transaction.get(counterRef)` before the first write, compute `next`,
      `transaction.set(counterRef, { value: next })`, set `batchNumber: next`
      on the batch doc. Rerun → pass. `npm run typecheck`.

### T3 — Display + i18n
- [ ] T3.1 RED: extend `AdminOrderCard.test.tsx` — a batch with `batchNumber:
      7` renders `#007`; a batch with `batchNumber: null` falls back to the
      id-derived code. Run → fails.
- [ ] T3.2 GREEN: update `AdminOrderCard` to prefer
      `formatBatchNumber(order.preparedBatchNumber)` when present, else the
      existing `slice(-4).toUpperCase()`. This requires the order's board
      projection to carry `preparedBatchNumber` — verify the admin order shape
      surfaces it; if not, thread it from the batch (discovery step in T3.0).
- [ ] T3.0 DISCOVERY (do first): confirm how `AdminOrderCard` obtains batch
      data — does `order` already join the batch, or only `preparedBatchId`? If
      only the id, decide minimal surface: add `preparedBatchNumber` to the
      admin board projection alongside `preparedBatchId`. Record outcome here.
- [ ] T3.3 Update `orders.admin.meta.batch` in uk (`… · партія #{{number}}`)
      and en; keep a legacy key/branch or reuse with the derived code. Ensure
      locale parity test passes.

### T4 — Docs + gate
- [ ] T4.1 Update `docs/` batch/data-model doc(s) noting `batchNumber` and the
      counter document; note legacy null fallback.
- [ ] T4.2 `npm run verify` green; `npm run test:rules:docker` green.
- [ ] T4.3 Mark index `Implemented`.

## Acceptance-criteria mapping

| Criterion | Task | Verification |
| --- | --- | --- |
| Number = prevMax+1 on both writers | T2.3/T2.4 | allocation test |
| Consecutive; no reuse on discard | T2.4 | allocation test (sequential) |
| Counter written in same txn; non-admin denied | T2.1/T2.2 | rules test |
| Card renders `#NNN` + legacy fallback | T3.1/T3.2 | component test |
| Rules reject bad/mutated number | T2.1/T2.2 | rules test |
| i18n parity | T3.3 | localeParity test |
| Gate | T4.2 | `verify` + `test:rules:docker` |

## Documentation, rollout, rollback, risks

- Docs: data-model/batches doc + this PLAN's completion.
- Rollout: additive; deploy rules with counter match before/with client.
  Counter self-creates on first batch.
- Rollback: revert field + rules; legacy fallback means no data cleanup needed.
- Risks: (a) reads-after-writes ordering mistake → transaction throws; mitigated
  by placing counter `get` first and testing. (b) `AdminOrderCard` may not have
  the number without a projection change (T3.0 discovery). (c) doc-type
  `number | null` vs domain `number` friction — resolved by null-safe converter
  + display guard.

## Non-blocking questions

- Pad width 3 (assumed). Adjust `formatBatchNumber` if the owner wants a
  different minimum.

## Approval

| Role | Decision | Date |
| --- | --- | --- |
| User | Approved | 2026-07-11 |
