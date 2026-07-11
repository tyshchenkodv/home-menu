# Specification: Menu expired-batch admin banner

| Field | Value |
| --- | --- |
| Slug | `menu-expired-batch-banner` |
| Status | Approved |
| Request | Carve-out from `mvp-audit-remediation` (implementation-time scope change) |
| Created | 2026-07-11 |
| Related | Supersedes the "Pending follow-up" note for the menu expired-batch banner in `docs/specifications/README.md`; implements the deferred design in `docs/design/screens/menu-browse.md` |

## Problem statement

The menu-browse screen design (`docs/design/screens/menu-browse.md`) specifies
an **admin-only banner** for a dish whose backing prepared batch has expired: an
`error`-tinted card telling the admin the batch has passed its best-before and
its portions are waiting to be discarded, with a CTA to the Batches screen.

This banner is not implemented. During `mvp-audit-remediation` a deeper issue
was found and deliberately deferred: `evaluateDishAvailability`
(`src/domain/dishes/evaluateDishAvailability.ts`) **ignores `expiresAt`
entirely** — it sums `availableQuantity` for every non-discarded batch, so an
expired-but-not-discarded batch still counts as ready portions. As a result an
expired dish is today **neither hidden from users nor bannered for admins**.

The product decision for this SPEC is: **do not change availability behavior.**
Expired portions keep counting toward availability exactly as today. This SPEC
adds only the admin-facing banner so an admin can notice expired stock and act
(discard it in Batches). Changing availability to exclude expired batches is an
explicit non-goal, reserved for a future business-rule specification.

## Goals

1. On the menu-browse screen, for each dish backed by at least one **expired,
   non-discarded** prepared batch (`expiresAt < now` and `status !=
   'discarded'`), render an **admin-only** banner per the menu-browse design.
2. Show the banner to admins only; regular users see no banner and no change
   to what they see today.
3. Reuse the existing `isBatchExpired` domain helper as the expiry predicate;
   do not introduce a second definition of "expired".
4. Feed the banner from batch data the menu already subscribes to; do **not**
   modify `evaluateDishAvailability` or any availability/reservation logic.
5. Provide the banner's CTA to the Batches screen.
6. Add all banner copy to both `uk` and `en` resources.
7. Cover admin-visibility gating and the expired predicate with component and
   unit tests.

## Non-goals

- **Excluding expired batches from availability** (the underlying business-rule
  change). Deferred to a separate future SPEC. Availability stays as-is.
- Hiding the dish from users when its only stock is expired (the design's
  "users simply do not see the dish" premise depends on the availability change
  above, which is out of scope). Users continue to see today's behavior.
- Auto-discarding expired batches, notifications, or any write from the menu
  screen. The banner is read-only and navigational.
- Non-admin messaging about expiry.

## Workflow, domain, and data model

### Expiry predicate (source of truth)

`src/domain/batches/expiration.ts` → `isBatchExpired(expiresAt, now)` already
returns `expiresAt !== null && expiresAt.toMillis() < now.toMillis()`. The
banner condition for a dish is:

> at least one backing batch with `isBatchExpired(batch.expiresAt, now) === true`
> **and** `batch.status !== 'discarded'`.

No new domain type is required for the predicate; a small pure selector may
compute "expired backing batches per dish" for testability.

### Data availability

`src/features/menu/hooks/useDishAvailability.ts` already holds
`batchesByDishId: Record<string, PreparedBatchWithId[]>`, populated from
`subscribeAvailableBatchesForDish` (which queries `status == 'available'`, so
expired-but-available batches are present in memory). Each batch carries
`expiresAt`. **The expiry data is therefore already loaded** — the banner needs
it surfaced out of the hook.

The hook's public `views` (`MenuDishView`) currently expose `{ dish,
availability }` only, not the backing batches. This SPEC extends the view (or
adds a parallel admin-only map) with the expired backing-batch information the
banner needs (e.g. the earliest/most relevant expired batch's `preparedAt` for
the "batch from <date>" copy, and a count of expired portions).

### Admin gating

`MenuPage` (`src/features/menu/pages/MenuPage.tsx`) does not currently read
auth. `useAuth` is already used elsewhere in the menu feature
(`useMenuCommands.ts`), so `MenuPage` can read `profile` and render the banner
only when `profile?.role === 'admin' && profile.active`. Firestore Rules remain
the authorization boundary; this gate is presentational only.

## UX and accessibility

Per `docs/design/screens/menu-browse.md` (banner spec, ~lines 118-132):

- An `error`-tinted banner card: title in `error.dark`, a chip
  «⚠ Прострочено» / "⚠ Expired", body text naming the batch date and stating the
  portions await discarding, and a **contained `error` CTA** «До партій →» /
  "To batches →" navigating to the admin Batches route.
- The «⚠» glyph accompanies the text label (color is never the sole signal),
  consistent with the dashboard expired tile.
- The banner appears for admins only. Regular users see the menu exactly as
  today.
- States: the banner is derived from already-loaded batch data, so it shares
  the menu's existing loading/empty/error handling; no new async state.
- Responsive: the banner card follows the existing menu card width and the
  shared banner/card patterns.

## Deep impact analysis

| Area | Assessment |
| --- | --- |
| Architecture | `features/menu` only (hook view extension, page gate, new banner component). Reuses `domain/batches/expiration`. No `evaluateDishAvailability` change, no infrastructure change. |
| Firebase | None. No schema, query, index, rules, or transaction change — data is already subscribed. |
| Domain | No new invariant. Expiry predicate reused. Availability logic explicitly untouched. |
| Privacy | Banner shows a batch date and portion count — non-personal household operational data, admin-only. No identities. Synthetic fixtures. |
| i18n | New `menu.expiredBanner.*` keys (title, chip, body with date/count interpolation, cta) added to `uk` and `en`; parity test must pass. |
| UX | Admin-only additive banner; users unaffected; matches documented design. |
| Compatibility | Purely additive presentational feature; no data or client-contract change. |
| Quality | Component test: admin sees banner when an expired non-discarded batch backs a dish; user (and admin with no expired batch) sees none. Unit test for the expired-backing-batch selector. |

## Acceptance criteria

- [ ] For an admin, a dish backed by an expired (`expiresAt < now`),
      non-discarded batch shows the `error`-tinted banner with the ⚠ chip,
      date-aware body, and "To batches →" CTA.
- [ ] The banner CTA navigates to the admin Batches route.
- [ ] A regular user never sees the banner; the user's menu view is byte-for-
      byte unchanged from today.
- [ ] An admin sees no banner for dishes with no expired non-discarded batch.
- [ ] `evaluateDishAvailability` is unchanged; availability/reservation
      behavior and tests are unaffected.
- [ ] `menu.expiredBanner.*` keys exist in both locales; parity test passes.
- [ ] `npm run verify` passes.

## Milestones

1. Expired-backing-batch selector + hook view extension + unit test.
2. Banner component + admin gate in `MenuPage` + i18n + component tests.
3. Docs sync (mark the menu-browse implementation note as done) + gate.

## Open questions (non-blocking)

- If several backing batches are expired, the body copy references one date.
  Recommendation: use the earliest expired batch's `preparedAt`, and if the
  copy supports it, include the total expired portion count. (Assumed; finalize
  in PLAN.)
- Whether the banner appears once per affected dish (recommended) or once
  aggregated for the whole screen. Recommendation: per dish, matching the
  design's "batch behind a dish" framing. (Assumed.)

## References

- `docs/design/screens/menu-browse.md` (banner spec + not-implemented note,
  ~118-132)
- `src/domain/dishes/evaluateDishAvailability.ts` (confirms expiry ignored;
  stays unchanged)
- `src/features/menu/hooks/useDishAvailability.ts` (`batchesByDishId`),
  `src/features/menu/pages/MenuPage.tsx`, `src/features/menu/types/`
- `src/domain/batches/expiration.ts` (`isBatchExpired`)
- `src/features/auth/useAuth.ts`

## Approval

| Role | Decision | Date |
| --- | --- | --- |
| User | Approved | 2026-07-11 |
