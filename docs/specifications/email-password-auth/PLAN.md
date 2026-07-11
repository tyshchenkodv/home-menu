# Plan: Email/password login, no Google Sign-In

| Field | Value |
| --- | --- |
| Slug | `email-password-auth` |
| Status | Approved |
| Spec | [SPEC.md](./SPEC.md) (Approved, revised scope) |
| Created | 2026-07-11 |

## Goal, architecture, stack

Replace Google Sign-In with a manually-provisioned email/password login that
matches the design, rename the activity claim `active` → `isActive`, unify the
not-activated screens into one keep-session screen, and add conventional
`/403` + `/404` pages driven by a `usePermissions` hook.

Stack unchanged: React + TypeScript + Vite + MUI + `HashRouter` + Firebase Auth
+ Firestore + `i18next`. Named exports only. UI strings live only in `uk`/`en`
i18n resources (`uk` default, `en` fallback). Authorization source of truth is
the ID-token custom claims; Firestore Rules are the boundary. Verification gate:
`npm run verify`; style via `npm run fix`.

## Scope

In: `src/features/auth/**`, `src/infrastructure/firebase/authAdapter.ts`,
`src/app/router.tsx`, new error pages, `src/locales/{uk,en}/translation.json`,
`firestore.rules`, `tests/rules/firestore.rules.test.ts`,
`scripts/setUserRole.mjs`, `scripts/seedEmulatorAdmin.mjs`,
`docs/06-auth-and-security.md`, `docs/design/screens/login.md`.

Inherited non-goals (from SPEC): no self-signup/verification/forgot-password; no
change to the Firestore permission matrix, domain, transactions, or the
`users/{uid}` display record (its `UserProfile.active` field is a display field
and is **not** renamed); no `emailVerified` gating; minimal 403/404; role→home
routing unchanged.

## Deep impact analysis

| Area | Detail |
| --- | --- |
| Architecture | `authAdapter` swaps provider function. `AuthContext` gains a `notActivated` status and keeps the session (no auto `signOut`); `authContextValue` renames the context field `active` → `isActive` and the status `notAuthorized` → `notActivated`. New `usePermissions` hook centralizes role/activation checks; `RequireAdmin`/`RequireActiveProfile` consume it. New `NotActivatedState` replaces `NotAuthorizedState` + the inactive use of `AccessDeniedState` (both deleted). New `ForbiddenPage`/`NotFoundPage` under `src/features/errors/`. Dependency direction unchanged (features → shared/infrastructure). |
| Data/domain | No domain change. Authorization = claims. `authenticated` now means role ∈ {admin,user} **and** `isActive === true`; every other signed-in shape is `notActivated`. |
| Firebase | No schema/index/transaction change. Rules: `claims().active` → `claims().isActive` in `activeUser()` (+ comments). Provider becomes Email/Password (console). Scripts set/emit the `isActive` claim; CLI flag `--active` → `--isActive`. Emulator does **not** hot-reload rules — restart it before running Rules tests (see [[emulator-rules-reload]]). |
| Migration | Claim rename is not backward compatible: accounts holding only `active` read as `notActivated` until re-provisioned with `scripts/setUserRole.mjs` (fail-closed — Rules deny without `isActive == true`; no data exposure). Single-household coordinated re-provision; no automated backfill. Rollback = revert code + Rules and re-provision under `active`. |
| Privacy | No real identities: fixtures/i18n use `*.test`. The mockup's `olena@dim.ua` must not enter code/tests/docs. Remove the `console.log(tokenResult)` token leak. No admin email in code (static hint). |
| i18n | Add `uk`+`en`: `auth.login.{emailLabel,passwordLabel,showPassword,hidePassword,submit,noAccessHint}`, `auth.login.errors.{invalidCredentials,tooManyRequests,network,generic}`, `auth.notActivated.{title,body,contactAdmin}` (`body` interpolates `{{email}}`), `error.{forbiddenTitle,notFoundTitle,backHome}`. Remove `auth.login.googleButton`, `auth.login.signingIn` (repurposed), `auth.notAuthorized.*`, `auth.accessDenied.*`. `localeParity` test must stay green. |
| UX | Login: form + validation + submit states + `LanguageSwitcher`. Not-activated: single keep-session screen (email + «Вийти»). New `/403`, catch-all `*` `/404` at top level (no AppShell), button → `/`. Admin guard redirects active non-admins to `/403`. |
| Quality | Vitest component/unit tests per task (RED→GREEN), Rules emulator tests renamed, `localeParity`, docs updated, full `npm run verify`. |

## Conflict resolution

- **Status semantics change:** folding "role present but inactive" from
  `authenticated`+`active=false` into a single `notActivated` status removes the
  need for `RequireActiveProfile`'s separate `!active` branch. Resolved:
  `authenticated` implies active; guards branch on status only (plus role for
  admin). No consumer depends on the old `notAuthorized` string except the
  guards and tests updated here.
- **Context field vs display field both named `active`:** the `useAuth` context
  field is renamed to `isActive`; the `UserProfile.active` display field (and
  `buildProfile({active})` in tests) stays `active`. The two are disambiguated
  explicitly in Task 5/8 steps.
- **404 placement:** catch-all lives at the top level (outside
  `RequireActiveProfile`) so it renders chrome-free and its "home" button routes
  by role via `/`; an unauthenticated visitor's `/` resolves to `/login`.
- No other conflicts found.

## Affected paths and interfaces

- `src/infrastructure/firebase/authAdapter.ts` — replace `signInWithGoogle` with
  `signInWithEmailAndPassword(email: string, password: string): Promise<User>`.
- `src/features/auth/authContextValue.ts` — `AuthStatus` gains `notActivated`,
  drops `notAuthorized`; field `active` → `isActive`.
- `src/features/auth/AuthContext.tsx` — keep session; read `claims.isActive`;
  set `notActivated`; remove token `console.log`.
- `src/features/auth/usePermissions.ts` *(new)* — `{ status, role, isAdmin }`
  derived from `useAuth`.
- `src/features/auth/RequireActiveProfile.tsx`, `RequireAdmin.tsx` — use
  `usePermissions`; `notActivated` → `NotActivatedState`; admin mismatch →
  `<Navigate to="/403" replace />`.
- `src/features/auth/components/NotActivatedState.tsx` *(new)*; delete
  `NotAuthorizedState.tsx`, `AccessDeniedState.tsx` (keep/rename their shared
  styles module as `NotActivatedState.styles.ts`).
- `src/features/auth/LoginPage.tsx` + `LoginPage.styles.ts` — email/password
  form.
- `src/features/errors/ForbiddenPage.tsx`, `NotFoundPage.tsx` *(new)* + a shared
  `ErrorPage` layout + styles.
- `src/app/router.tsx` — add `/403` and `*` routes.
- `src/locales/{uk,en}/translation.json`.
- `firestore.rules`, `tests/rules/firestore.rules.test.ts`,
  `scripts/setUserRole.mjs`, `scripts/seedEmulatorAdmin.mjs`.

## Tasks

Each task is independently reviewable. Commands assume repo root. RED = focused
test fails as described; GREEN = it passes; then broaden.

### Task 1 — Email/password auth adapter

- [ ] Add `src/infrastructure/firebase/__tests__/authAdapter.test.ts` mocking
      `firebase/auth`: asserts `signInWithEmailAndPassword(email, password)`
      calls the Firebase modular fn with `(auth, email, password)` and returns
      `credential.user`.
- [ ] RED: `npx vitest run src/infrastructure/firebase/__tests__/authAdapter.test.ts`
      (module/function missing).
- [ ] Implement the wrapper; remove `signInWithGoogle`, `GoogleAuthProvider`,
      `signInWithPopup` imports.
- [ ] GREEN: rerun the focused test.
- Deliverable: adapter exposes email/password sign-in; no Google symbols remain.

### Task 2 — AuthContext status model + keep-session + `isActive`

- [ ] Update `src/features/auth/__tests__/AuthContext.test.tsx`: (a) token with
      `role` + `isActive:true` → `authenticated`, `isActive` testid `true`;
      (b) token with no `role` → status `notActivated`, **user retained**,
      `signOut` **not** called; (c) token with `role` but `isActive:false` →
      `notActivated`; (d) no user → `unauthenticated`. Replace the old
      "signs out … notAuthorized" cases. Update the `TestComponent` to read
      `isActive`.
- [ ] RED: `npx vitest run src/features/auth/__tests__/AuthContext.test.tsx`.
- [ ] Edit `authContextValue.ts` (`AuthStatus`: add `notActivated`, remove
      `notAuthorized`; field `active` → `isActive`). Edit `AuthContext.tsx`:
      read `tokenResult.claims.isActive === true`; compute `authenticated` only
      when `isKnownRole(role) && isActive`, else `notActivated` **without**
      `signOut`; keep `user`; delete the `signedOutForNoRoleRef` machinery and
      the `console.log(tokenResult)`.
- [ ] GREEN: rerun; then `npx vitest run src/features/auth`.
- Deliverable: session-preserving `notActivated`; `isActive` claim; no token log.

### Task 3 — i18n keys (additions)

- [ ] Add the new keys (see i18n row) to both `src/locales/uk/translation.json`
      and `src/locales/en/translation.json`, with `uk` copy transcribed from the
      design mockup (e.g. title «Профіль ще не активовано») and `en`
      equivalents. Do **not** remove obsolete keys yet (UI still references
      them until Tasks 4–6).
- [ ] Structural check: `npx vitest run src/locales/__tests__/localeParity.test.ts`
      stays green (matched keys in both locales).
- Deliverable: all new strings present and locale-symmetric.

### Task 4 — `usePermissions`, guards, unified not-activated screen

- [ ] Add `NotActivatedState.tsx` test (component) asserting it renders the
      title, the email (via `user.email`, interpolated), the contact-admin
      block, and a «Вийти» button wired to `signOut`.
- [ ] Update `src/features/auth/__tests__/routeGuards.test.tsx`: unprovisioned
      and inactive accounts render the unified not-activated screen (assert its
      title); an **active non-admin** visiting `/admin/inventory` lands on
      `/403` (assert 403 marker); active admin reaches admin content; active
      user reaches `/menu`; unauthenticated → `/login`. Update `buildUser`
      claims to `{ role, isActive }`; leave `buildProfile({active})` as the
      display record.
- [ ] RED: `npx vitest run src/features/auth/__tests__/routeGuards.test.tsx`.
- [ ] Add `usePermissions.ts` (`{ status, role, isAdmin }`). Add
      `NotActivatedState.tsx` (+ styles). Rewrite `RequireActiveProfile`
      (`notActivated` → `NotActivatedState`; drop `!active` branch) and
      `RequireAdmin` (loading → `AuthLoadingState`; `unauthenticated` →
      `/login`; `notActivated` → `NotActivatedState`; active non-admin →
      `<Navigate to="/403" replace />`). Delete `NotAuthorizedState.tsx` and
      `AccessDeniedState.tsx`; migrate needed styles.
- [ ] GREEN: rerun routeGuards + `NotActivatedState` tests.
- Deliverable: single not-activated screen, centralized permission checks,
  `/403` redirect for role mismatch.

### Task 5 — Login form

- [ ] Rewrite `src/features/auth/__tests__/LoginPage.test.tsx`: renders
      wordmark, tagline, `LanguageSwitcher`, email + password fields, show/hide
      toggle, «Увійти» button, static "no access?" hint; submitting valid
      credentials calls the adapter and (on `authenticated`) redirects by role;
      an auth error maps to the localized inline message and re-enables the
      form; empty/invalid fields block submit. Mock the adapter's
      `signInWithEmailAndPassword`.
- [ ] RED: `npx vitest run src/features/auth/__tests__/LoginPage.test.tsx`.
- [ ] Rewrite `LoginPage.tsx`: controlled email/password `TextField`s, password
      show/hide `IconButton`, required + email-format validation, submit state
      (spinner + disable), Firebase error-code → i18n mapping
      (`invalid-credential`/`wrong-password`/`user-not-found`/`invalid-email` →
      `invalidCredentials`; `too-many-requests` → `tooManyRequests`;
      `network-request-failed` → `network`; else `generic`), `LanguageSwitcher`,
      static hint, `Navigate` for `authenticated`/`notActivated`. Update
      `LoginPage.styles.ts` for the form/switcher/paw layout per design tokens.
- [ ] GREEN: rerun; then `npx vitest run src/features/auth`.
- Deliverable: design-matching email/password login.

### Task 6 — 403 / 404 pages + routing

- [ ] Add tests for `ForbiddenPage`/`NotFoundPage`: each shows its code
      (403/404) and a home button that navigates to `/`. Add/extend a router
      test (or `src/app/__tests__/App.test.tsx`) asserting an unknown path
      renders the 404 page. Update `App.test.tsx` mock (remove
      `signInWithGoogle`, add `signInWithEmailAndPassword`).
- [ ] RED: `npx vitest run src/features/errors src/app/__tests__/App.test.tsx`.
- [ ] Add `src/features/errors/ErrorPage.tsx` (shared layout: code heading +
      `useNavigate('/')` button) and thin `ForbiddenPage`/`NotFoundPage`
      wrappers. Register `<Route path="/403" element={<ForbiddenPage/>} />` and
      `<Route path="*" element={<NotFoundPage/>} />` at top level in
      `router.tsx`.
- [ ] GREEN: rerun.
- Deliverable: conventional 403/404 with role-aware home button.

### Task 7 — i18n cleanup

- [ ] Remove now-unused keys (`auth.login.googleButton`, `auth.login.signingIn`
      if unused, `auth.notAuthorized.*`, `auth.accessDenied.*`) from both
      locales.
- [ ] `grep -rn "googleButton\|notAuthorized\|accessDenied" src` returns no
      references; `npx vitest run src/locales/__tests__/localeParity.test.ts`
      green.
- Deliverable: no dead i18n keys.

### Task 8 — Claim rename in Rules, scripts, Rules tests

- [ ] Edit `firestore.rules`: `claims().active` → `claims().isActive` in
      `activeUser()`; update the claim-name comments.
- [ ] Edit `tests/rules/firestore.rules.test.ts`: replace every
      `authenticatedContext(uid, { role, active })` with `{ role, isActive }`
      (and the header comments). Do not touch `users/{uid}` document `active`
      fields used as display data.
- [ ] Edit `scripts/setUserRole.mjs`: claim `{ role, isActive }`; CLI flag
      `--active` → `--isActive`; internal `parseActive`/vars/help/usage/comments.
      Edit `scripts/seedEmulatorAdmin.mjs`: pass `--isActive true`.
- [ ] Restart the Firebase emulator (rules do not hot-reload), then
      `npm run test:rules` (or the project's Rules test script) → green.
- Deliverable: `isActive` claim consistent across Rules, scripts, Rules tests;
  no `active` **claim** reference remains (display-record `active` untouched).

### Task 9 — Documentation

- [ ] Update `docs/06-auth-and-security.md`: email/password sign-in, no Google,
      `isActive` claim name, keep-session not-activated behavior, the
      disable-self-signup console step, and the re-provision migration note.
- [ ] Update `docs/design/screens/login.md`: replace the "superseded /
      Google-only" narrative with the as-built email/password form, the
      unified not-activated screen, the `LanguageSwitcher`, and the 403/404
      pages.
- [ ] Structural check: docs reference `isActive`, `signInWithEmailAndPassword`,
      `/403`, `/404`; no stale "Google Sign-In" claim as the current method.
- Deliverable: current docs match as-built behavior.

### Task 10 — Verification gate

- [ ] `npm run fix` then `npm run verify` (typecheck, lint+Prettier,
      format:check, test, build) → green. Report anything that cannot run.
- [ ] Mark the index row `Implemented` only after green.

## Acceptance-criteria → task/verification map

| Acceptance criterion | Task(s) | Verification |
| --- | --- | --- |
| Email/password form matches design | 3,5 | `LoginPage.test.tsx` |
| Valid creds route by role | 2,5 | `LoginPage.test.tsx`, `AuthContext.test.tsx` |
| Wrong creds → single generic error | 5 | `LoginPage.test.tsx` |
| No Google/create/reset paths | 1,5,6 | grep + `authAdapter.test.ts`, `App.test.tsx` |
| Not-activated keeps session + «Вийти» | 2,4 | `AuthContext.test.tsx`, `routeGuards.test.tsx` |
| Claim renamed to `isActive` everywhere | 2,8 | `AuthContext.test.tsx`, Rules tests, grep |
| `emailVerified` does not gate | 2 | `AuthContext.test.tsx` |
| Token `console.log` removed | 2 | code review + grep |
| New strings in `uk`+`en`, obsolete removed | 3,7 | `localeParity.test.ts` + grep |
| Docs updated | 9 | doc review |
| `/404` for unknown path | 6 | `App.test.tsx` |
| Active non-admin → `/403` | 4,6 | `routeGuards.test.tsx` |
| `usePermissions` single source | 4 | guard tests + code review |
| `npm run verify` passes | 10 | gate |

## Documentation, rollout, rollback, risks

- **Docs:** Task 9 (current docs only; SPEC/PLAN stay immutable post-approval).
- **Rollout:** deploy code + Rules together; switch the Firebase Auth provider
  to Email/Password and **disable sign-up** in the console; re-provision every
  household account with `scripts/setUserRole.mjs` so `isActive` is present.
- **Rollback:** revert the code + Rules commit and re-provision under the old
  `active` claim.
- **Risks:** (1) forgetting to restart the emulator hides Rules regressions —
  Task 8 restarts it explicitly; (2) missing an `active`→`isActive` claim site
  fails closed (deny), not open — acceptable; (3) conflating the display-record
  `active` with the claim — mitigated by explicit steps.

## Non-blocking open questions

- Final `en` wording for the not-activated body and the "no access?" hint is
  transcribed during Task 3 from the mockup; no behavioral impact.

## Approval

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Owner | Dmytro Tyshchenko | 2026-07-11 | Approved |
