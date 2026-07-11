# Plan: Menu expired-batch admin banner

| Field | Value |
| --- | --- |
| Slug | `menu-expired-batch-banner` |
| Status | Approved |
| Spec | [SPEC.md](./SPEC.md) (Approved 2026-07-11) |
| Created | 2026-07-11 |

## Goal, architecture, stack

Render an admin-only `error`-tinted banner on the menu-browse screen for any
dish backed by an expired (`expiresAt < now`, not discarded) prepared batch,
fed from batch data the menu already subscribes to. Availability logic is not
touched. Stack: React 19 + TS + MUI v9, i18next uk/en, Vitest + RTL.

## Scope

In: an expired-backing-batch selector, surfacing it from `useDishAvailability`,
an admin gate in `MenuPage`, a new banner component, i18n, tests. Out (inherited
non-goals): any `evaluateDishAvailability`/availability/reservation change,
hiding dishes from users, auto-discard, non-admin messaging.

## Deep impact analysis

| Area | Detail |
| --- | --- |
| Architecture | `features/menu` only: `hooks/useDishAvailability.ts` (surface expired batches), `types/` (extend `MenuDishView` or add parallel map), `pages/MenuPage.tsx` (admin gate + render), `components/ExpiredBatchBanner` (new). Reuses `domain/batches/expiration.isBatchExpired`. No infra/domain-availability change. |
| Data/domain | No new invariant. Predicate: `isBatchExpired(batch.expiresAt, now) && batch.status !== 'discarded'`. `useDishAvailability` already holds `batchesByDishId` with `expiresAt`; `subscribeAvailableBatchesForDish` queries `status=='available'` so expired-available batches are in memory. |
| Firebase | None — no schema/query/index/rules/transaction change. |
| Privacy | Banner shows batch date + portion count (non-personal, admin-only). Synthetic fixtures. |
| i18n | New `menu.expiredBanner.{title,chip,body,cta}` in uk+en; parity enforced. Body interpolates a date and (optional) count. |
| UX | Admin-only additive banner per `menu-browse.md`; users unaffected. Derived from loaded data → no new async state. |
| Compatibility | Purely presentational/additive. |
| Quality | Unit (selector), component (admin sees banner w/ expired batch; user none; admin none when no expired batch; CTA route). |

## Conflict resolution

- `MenuPage` does not currently read auth; `useAuth` is already used in
  `useMenuCommands.ts`, so importing it in `MenuPage` is consistent. No conflict.
- `MenuDishView` currently exposes `{ dish, availability }` only. Chosen
  approach: **extend the hook result with an admin-oriented list** of expired
  backing batches per dish (e.g. `expiredBatchesByDishId` or an added
  `expiredBacking` field on the view). Availability `views` filtering stays
  exactly as today, so no user-visible change. No other conflict found.

## Affected paths

- `src/domain/batches/expiration.ts` — reuse `isBatchExpired` (no change).
- `src/features/menu/hooks/useDishAvailability.ts` — compute + expose expired
  backing batches per dish.
- `src/features/menu/types/*` (`menuDishView` / `useDishAvailabilityResult`) —
  extend result shape.
- `src/features/menu/pages/MenuPage.tsx` — read `profile`, gate + render banner.
- `src/features/menu/components/ExpiredBatchBanner/ExpiredBatchBanner.tsx` — NEW.
- `src/domain/menu/selectExpiredBackingBatches.ts` (or under `features/menu`) —
  NEW pure selector.
- `src/locales/{uk,en}/translation.json` — `menu.expiredBanner.*`.
- Tests: selector unit test; `ExpiredBatchBanner` + `MenuPage` component tests.

## Tasks (TDD)

### T1 — Expired-backing-batch selector
- [ ] T1.1 RED: `selectExpiredBackingBatches.test.ts` — given a dish's batches
      and `now`, returns only batches with `expiresAt < now` and `status !=
      'discarded'`; empty when none; ignores discarded expired ones. Run vitest
      → fails.
- [ ] T1.2 GREEN: implement the pure selector using `isBatchExpired`. Rerun →
      pass.

### T2 — Surface from hook
- [ ] T2.1 Extend `useDishAvailability` result type with
      `expiredBatchesByDishId: Record<string, PreparedBatchWithId[]>` (or per-
      view field), computed via the T1 selector over `batchesByDishId` with a
      `now` source consistent with the rest of the hook. `npm run typecheck`.
- [ ] T2.2 Confirm `views` filtering is unchanged (regression guard): existing
      `useDishAvailability`/menu tests still green (`npx vitest run menu`).

### T3 — Banner component
- [ ] T3.1 RED: `ExpiredBatchBanner.test.tsx` — renders `error`-tinted card
      with ⚠ chip, interpolated date/count body, and a CTA linking to the admin
      batches route. Run → fails.
- [ ] T3.2 GREEN: implement the banner per `menu-browse.md` (title `error.dark`,
      chip «⚠ Прострочено», contained `error` CTA «До партій →» → batches
      route). All copy via i18next. Rerun → pass.

### T4 — Admin gate in MenuPage
- [ ] T4.1 RED: `MenuPage` component test — with an admin profile and a dish
      backed by an expired non-discarded batch, the banner renders; with a
      regular user profile it does not; with an admin but no expired batch it
      does not. Run → fails.
- [ ] T4.2 GREEN: in `MenuPage`, read `profile` via `useAuth`; when
      `profile?.role === 'admin' && profile.active`, render
      `<ExpiredBatchBanner>` for each dish with expired backing batches (using
      the hook's new field). Regular users: no banner, identical output. Rerun
      → pass.

### T5 — i18n + docs + gate
- [ ] T5.1 Add `menu.expiredBanner.{title,chip,body,cta}` to uk+en; parity
      test green.
- [ ] T5.2 Update `docs/design/screens/menu-browse.md` implementation note:
      mark the banner implemented; record the scope caveat that availability is
      unchanged (expired stock still counts; dish not hidden from users), so the
      "users do not see the dish" line is future work.
- [ ] T5.3 `npm run verify` green.
- [ ] T5.4 Mark index `Implemented`.

## Acceptance-criteria mapping

| Criterion | Task | Verification |
| --- | --- | --- |
| Admin sees banner for expired-backed dish | T3/T4 | component tests |
| CTA → batches route | T3.1/T3.2 | component test |
| User never sees banner; view unchanged | T4.1/T4.2, T2.2 | component + regression |
| Admin sees none when no expired batch | T4.1 | component test |
| Availability unchanged | T2.2 | existing menu tests |
| i18n parity | T5.1 | localeParity test |
| Gate | T5.3 | `verify` |

## Documentation, rollout, rollback, risks

- Docs: `menu-browse.md` note updated with the availability caveat.
- Rollout: additive UI; no data/rules change; safe anytime.
- Rollback: remove banner render + hook field; nothing persisted.
- Risks: (a) `now` source drift between availability and banner — reuse the
  hook's existing `now` to stay consistent. (b) multiple expired batches per
  dish — body uses earliest `preparedAt` + total expired portions (finalize
  copy in T3). (c) ensuring the user path is byte-for-byte unchanged — covered
  by T2.2 regression + T4.1 user case.

## Non-blocking questions

- One banner per affected dish (assumed) vs one aggregated — per dish, matching
  the design.

## Approval

| Role | Decision | Date |
| --- | --- | --- |
| User | Approved | 2026-07-11 |
