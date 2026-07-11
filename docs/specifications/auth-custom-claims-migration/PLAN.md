# Plan: Role migration to custom claims + no self-signup

| Field | Value |
| --- | --- |
| Slug | `auth-custom-claims-migration` |
| Status | Approved |
| Spec | [SPEC.md](./SPEC.md) (Approved 2026-07-11) |
| Created | 2026-07-11 |

## Goal, architecture, stack

Move authorization (`role`, `active`) from a Firestore `users/{uid}` document to
Firebase Auth **custom claims**; read them on the client from the ID token and
in Security Rules from `request.auth.token`; deny entry to any signed-in account
with no `role` claim (app-level no-self-signup); provision claims with a local
`firebase-admin` script (no Cloud Functions, no GCIP upgrade).

Stack: React 19 + TS + Vite, Firebase client SDK 12 (Auth + Firestore),
`firebase-admin` (NEW devDependency, script + emulator only),
`@firebase/rules-unit-testing`, i18next uk/en, Vitest.

## Scope

In: Rules helpers → claims; rules-test harness → claim tokens + un-provisioned
denied; `scripts/setUserRole` (prod + emulator); client `AuthContext`/guards
read claims; un-provisioned sign-out + access-denied copy; docs. Out (inherited
non-goals): GCIP/`disableSignups`, Cloud Functions, admin UI, new sign-in
methods, self-registration.

## Deep impact analysis

| Area | Detail |
| --- | --- |
| Architecture | Recorded decision: local `firebase-admin` provisioning script. `features/auth` reads claims from `getIdTokenResult()`; `infrastructure` loses profile-as-authz reader (`loadUserProfile` demoted/removed). Rules helpers rewritten (4 functions, call sites unchanged). |
| Data/domain | Authz source of truth = ID-token claims `{ role, active }`. Absent `role` = not provisioned. `users/{uid}` demoted to non-authoritative display record (KEEP — decision below), written only by the admin script (rules `if false` for clients). |
| Firebase | Rules use `request.auth.token.{role,active}`; drop `get()/exists()` on `users`. `firebase-admin` `setCustomUserClaims`. No Cloud Functions, no GCIP. Emulator: claims via Auth emulator + `authenticatedContext(uid, claims)` in rules tests. |
| Migration | Compatibility window: until each real account is provisioned via the script it is treated as un-provisioned → denied. Owner runs the script per intended account (bootstrapping first admin via service-account key). Rollback = restore profile-based helpers + client reader from git. |
| Privacy | Service-account key is a hard secret: local ignored file / GitHub Secret, documented by name only in README; NEVER committed. Examples use placeholder UIDs + `example.test`. Claims add no extra personal data. Review diff/status/filenames for leaks before proposing any commit. |
| i18n | New `auth.notAuthorized.{title,body}` (+ any revised `auth.accessDenied.*`) in uk+en; parity enforced. |
| UX | Un-provisioned: sign-in → immediate `signOut()` → access-denied ("not authorized, contact owner"). Inactive: access-denied. Active user/admin: unchanged redirects. |
| Compatibility | Deployed old clients read profile docs; new rules deny them unless claims exist — coordinate deploy: provision accounts, then deploy rules+client together. |
| Quality | Rules tests (claim-gated access; un-provisioned denied; no self-escalation); client tests (AuthContext claims; un-provisioned signOut+denied; redirects); script emulator smoke test. |

## Conflict resolution

- **Deploy ordering** (real conflict): new rules deny any token without claims,
  so real accounts must be provisioned BEFORE the rules deploy, and client +
  rules deploy together. Documented in Rollout; no code conflict.
- **`users/{uid}` fate** (SPEC open question) → **Decision: keep as
  non-authoritative display record.** Menu/orders show requester `displayName`;
  the doc holds display fields only, written by the admin script (admin SDK
  bypasses rules), client `create/update/delete: if false`, authz semantics
  removed. This preserves requester-name rendering with minimal churn.
- **Claim propagation** → **Decision: require re-login to apply role changes.**
  Document it; do not add live force-refresh logic (keeps client simple). The
  script docs note `getIdToken(true)`/re-login for immediate effect.
- **Bootstrapping first admin** → owner runs the script with the service-account
  key; admin SDK bypasses rules, so no chicken-and-egg.

## Affected paths

- `firestore.rules` — `signedIn`/`claims`/`activeUser`/`isAdmin`; `users/{uid}`
  block; keep all downstream call sites.
- `tests/rules/firestore.rules.test.ts` — identities via
  `authenticatedContext(uid, { role, active })`; add un-provisioned
  `authenticatedContext(uid, {})` denied cases; drop profile-doc seeding for
  authz.
- `scripts/setUserRole.mjs` — NEW (`firebase-admin`, prod + emulator modes).
- `scripts/seedEmulatorAdmin.mjs` — replace with claims-based seeding (or a thin
  wrapper over `setUserRole` in emulator mode).
- `package.json` — add `firebase-admin` devDependency; `seed:admin` script →
  claims; optional `set:role` script.
- `src/features/auth/AuthContext.tsx` — read `getIdTokenResult()` claims; drive
  un-provisioned sign-out.
- `src/features/auth/authContextValue.ts` — value carries `role`/`active` from
  claims (profile may remain for display name).
- `src/features/auth/{LoginPage,RequireAdmin,RequireActiveProfile}.tsx` — read
  claims.
- `src/infrastructure/firebase/services/userService.ts` — `loadUserProfile`
  demoted to display-only (or removed if display name sourced elsewhere).
- `src/features/auth/components/AccessDeniedState.tsx` /
  new `NotAuthorizedState` — un-provisioned copy.
- `src/locales/{uk,en}/translation.json` — `auth.notAuthorized.*`.
- `docs/06-auth-and-security.md`, `README.md` — new workflow + env var names.

## Tasks (TDD)

### T1 — Rules → claims + harness
- [ ] T1.1 RED: rewrite `firestore.rules.test.ts` identities to inject claims:
      admin `{role:'admin',active:true}`, user `{role:'user',active:true}`,
      inactive `{role:'user',active:false}`, and NEW un-provisioned `{}` (no
      claims) which must be denied on every collection. Remove profile-doc authz
      seeding. Run `npm run test:rules:docker` → fails (rules still use
      `profile()`).
- [ ] T1.2 GREEN: in `firestore.rules` replace `profile()`-based helpers with
      `claims()`/`activeUser()`/`isAdmin()` reading `request.auth.token`; keep
      `users/{uid}` reads self/admin, `create/update/delete: if false`; keep all
      downstream call sites. Restart emulator, rerun → all pass incl.
      un-provisioned-denied and no-self-escalation.

### T2 — Provisioning script
- [ ] T2.1 Add `firebase-admin` devDependency (pinned exact, latest major).
- [ ] T2.2 Implement `scripts/setUserRole.mjs`: args `uid|email`, `role`,
      `active`; `setCustomUserClaims`; optional upsert of `users/{uid}` display
      record; prod mode (service-account key from ignored file / env var name
      documented, never committed) + emulator mode
      (`FIREBASE_AUTH_EMULATOR_HOST`). Structural/smoke check: run against the
      emulator to set an admin claim and verify via `getUser().customClaims`.
- [ ] T2.3 Replace `seedEmulatorAdmin.mjs` authz seeding with claims (or wrap
      `setUserRole` emulator mode); update `seed:admin` npm script.
- [ ] T2.4 README + `docs/06-auth-and-security.md`: provisioning workflow,
      env var NAMES only (no values), re-login-to-apply note, first-admin
      bootstrap. Confirm `.gitignore` covers the key file; no key committed.

### T3 — Client reads claims
- [ ] T3.1 RED: `AuthContext` test — on sign-in with token claims
      `{role:'admin',active:true}` the context exposes admin/active from claims
      (mock `getIdTokenResult`); a token with NO `role` claim triggers
      `signOut()` and yields an un-provisioned/denied state. Run vitest → fails.
- [ ] T3.2 GREEN: `AuthContext` reads `user.getIdTokenResult()`; map
      `token.claims.role`/`.active`; if `role` absent → call `signOut()` and set
      a `not-authorized` status. Keep loading `users/{uid}` for display name
      only (non-authz) or drop if unused. Rerun → pass.
- [ ] T3.3 Update `LoginPage` (redirect by claim), `RequireAdmin`,
      `RequireActiveProfile` to read claim-derived role/active. Add
      `NotAuthorizedState` (or branch `AccessDeniedState`) with
      `auth.notAuthorized.*` copy. Component tests for redirect-by-claim and
      un-provisioned denial. `npm run typecheck`.
- [ ] T3.4 Add `auth.notAuthorized.{title,body}` to uk+en; parity green.

### T4 — Docs + gate
- [ ] T4.1 Finalize `docs/06-auth-and-security.md` (claims model, permission
      matrix from `request.auth.token`, provisioning, rollout/rollback).
- [ ] T4.2 `npm run verify` green; `npm run test:rules:docker` green; confirm
      `firebase-admin` is devDependency-only and not in the client bundle
      (spot-check build output / import graph).
- [ ] T4.3 Leak scan (diff/status/filenames: no key, real uid, email, project
      id). Mark index `Implemented`.

## Acceptance-criteria mapping

| Criterion | Task | Verification |
| --- | --- | --- |
| Rules authorize from claims, no `users` get() | T1.2 | rules tests |
| No-`role` token denied (rules + client signOut) | T1.1/T3.1 | rules + client tests |
| Guards/context read claims | T3.1–T3.3 | client tests |
| `setUserRole` prod+emulator, documented | T2.2/T2.4 | emulator smoke + docs |
| Harness claim tokens + un-provisioned | T1.1 | rules tests |
| `firebase-admin` devDep only | T2.1/T4.2 | package.json + bundle check |
| Auth copy parity | T3.4 | localeParity test |
| No secrets/PII in repo | T2.4/T4.3 | leak scan |
| Gate | T4.2 | `verify` + `test:rules:docker` |

## Documentation, rollout, rollback, risks

- **Rollout (ordered):** 1) merge code + rules; 2) owner runs `setUserRole` for
  every intended real account (first admin included) using the service-account
  key; 3) deploy rules + client together. Un-provisioned/old accounts are then
  denied by design.
- **Rollback:** revert to profile-based rules helpers + client `loadUserProfile`
  authz (both in git history); claims can remain harmlessly.
- **Risks:** (a) deploying rules before provisioning locks everyone out →
  mitigated by the ordered rollout. (b) service-account key leak → hard secret
  handling, `.gitignore`, README names only, leak scan gate (T4.3). (c) a live
  user needs re-login to pick up a changed claim → documented. (d) requester
  display name depends on kept `users/{uid}` display record — verified in T3.2.

## Non-blocking questions

- Resolved in Conflict resolution: keep `users/{uid}` for display; require
  re-login for claim changes. Revisit only if the owner objects.

## Approval

| Role | Decision | Date |
| --- | --- | --- |
| User | Approved | 2026-07-11 |
