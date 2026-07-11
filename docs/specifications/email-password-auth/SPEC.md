# Specification: Email/password login, no Google Sign-In

| Field | Value |
| --- | --- |
| Slug | `email-password-auth` |
| Status | Approved |
| Request | Owner request: "Хочу логін привести до типу як в дизайні. Хочу відмовитись від google авторизації … я сам в firebase /auth додаю юзерів з паролями, проставляю isVerified і у Custom claims ставлю role і isActive, і тільки такі юзери можуть проходити." Plus: "Хочу щоб дизайн відповідав як на скріншоті." |
| Created | 2026-07-11 |
| Related | Revises the sign-in method established in `auth-custom-claims-migration` (which remains the immutable record for the claims/no-self-signup model). Reinstates the original email/password login mockup documented as "superseded" in `docs/design/screens/login.md`. Revises `docs/06-auth-and-security.md` and `docs/design/screens/login.md`. |

## Problem statement

The current sign-in method is **Google Sign-In only**
(`signInWithGoogle` → `signInWithPopup(GoogleAuthProvider)`), chosen in
`auth-custom-claims-migration`. The owner now wants full manual control over
the household roster and a login screen that matches the original design:

1. **Sign-in method mismatch with design and control model.** The owner
   provisions every account by hand in Firebase Auth (email + password) and
   sets custom claims. Google Sign-In lets any Google account *authenticate*
   (it only fails authorization afterward), which does not match "тільки такі
   юзери можуть проходити" and leaves un-provisioned identities in the Auth
   user list. An email/password form that only ever calls
   `signInWithEmailAndPassword` cannot create accounts, so a person who was
   never added simply cannot sign in.

2. **Login UI does not match the approved design.** The as-built login page is
   a single "Sign in with Google" button. The design (see attached mockups and
   the historical transcription in `docs/design/screens/login.md`) is an
   email/password form: language switcher pill, cat hero, wordmark, tagline,
   email field, password field with a show/hide toggle, a full-width «Увійти»
   button, and a static "no access? contact the administrator" hint on a
   gradient background with decorative paw motifs.

3. **Two separate un-authorized screens and an abrupt sign-out.** A signed-in
   account with no `role` claim is **immediately signed out**
   (`AuthContext`), and there are two distinct states (`NotAuthorizedState`
   for no-role, `AccessDeniedState` for inactive). The design shows a single
   "Профіль ще не активовано" screen that keeps the user signed in, shows
   their email, and offers a «Вийти» button.

4. **Claim naming.** The activity flag is currently `active`; the owner refers
   to it as `isActive` and wants that name used consistently.

5. **Token leak in logs.** `AuthContext` contains a leftover
   `console.log(tokenResult)` that prints the full ID token result (including
   claims) to the browser console on every auth state change.

6. **Ad-hoc authorization/not-found handling.** `AccessDeniedState` currently
   doubles as both "inactive account" and "active account, wrong role for an
   admin route" (`RequireAdmin`). There is also no standard 404 page for
   unknown routes. The owner wants conventional React-Router `403` and `404`
   pages and a `usePermissions` hook so page/route access checks are
   centralized and role-mismatches route to a real `/403` page instead of an
   inline panel.

## Goals

1. Replace Google Sign-In with an **email/password** sign-in form on `/login`
   that calls only `signInWithEmailAndPassword`; remove all
   `GoogleAuthProvider` / `signInWithPopup` usage from the client.
2. The client must never expose an account-creation or password-reset path;
   provisioning stays entirely manual (Firebase Auth + admin provisioning
   script). A person with no pre-existing Auth account cannot sign in.
3. Authorization gate is unchanged in substance: access to the app requires a
   custom claim `role` ∈ {`admin`, `user`} **and** an activity flag that is
   `true`. `emailVerified` does **not** gate access.
4. Rename the activity custom claim from `active` to **`isActive`** everywhere
   it is read or written: Security Rules, provisioning script, emulator seed
   script, client `AuthContext`, tests, and documentation.
5. A successful sign-in whose account is **not yet activated** (no `role`
   claim, or `isActive != true`) **keeps the session** and renders a single
   unified "Профіль ще не активовано" screen showing the signed-in email and a
   «Вийти» (sign-out) button. No automatic sign-out on the no-role path.
6. The login screen matches the design: language switcher, cat hero mascot,
   wordmark + logo mark, tagline, email + password fields (password with
   show/hide toggle), full-width «Увійти» submit button, and a static
   "no access? contact the administrator" hint, with the design-system
   gradient/paw styling.
7. All new user-facing strings exist in both `uk` and `en`; obsolete Google-only
   strings are removed.
8. Remove the `console.log(tokenResult)` token leak.
9. `docs/06-auth-and-security.md` and `docs/design/screens/login.md` describe
   the as-built email/password flow, the `isActive` claim name, the
   keep-signed-in not-activated behavior, and the operational requirement to
   disable self-signup in the Firebase console.
10. Add conventional **`/403`** (forbidden) and **`/404`** (catch-all
    not-found) pages: each a minimal centered page showing the numeric code and
    a single button that returns the visitor to a home available to their role
    (via the root redirect, which routes `admin` → `/admin`, `user` → `/menu`,
    others → `/login`).
11. Add a **`usePermissions`** hook centralizing role/activation checks. The
    admin route guard uses it and redirects an authenticated, active, non-admin
    visitor to `/403` instead of rendering an inline access-denied panel;
    not-activated cases (no `role` or `isActive != true`) render the unified
    "Профіль ще не активовано" screen (goal 5), not `/403`.

## Non-goals

- No self-service account creation, email verification flow, or in-app
  "forgot password" (password resets happen in the Firebase console).
- No change to the Firestore permission matrix, the domain model, transactions,
  or the `users/{uid}` display-profile record and its Rules.
- No change to how roles route users (`admin` → `/admin`, `user` → `/menu`).
- No multi-factor auth, no session-timeout, no rate-limiting beyond Firebase's
  built-in throttling.
- No enforcement of `emailVerified` as an access condition (the owner sets it
  operationally; it stays informational).
- No Cloud Functions, Storage, or other paid services.
- The `/403` and `/404` pages are intentionally minimal (numeric code + one
  navigation button); no elaborate illustration or copy beyond a localized
  button label is required.
- `usePermissions` covers role/activation route access only; it is not a
  general RBAC/permission-matrix engine.

## Workflow, domain, and data model

### Sign-in flow (source of truth: Firebase Auth ID token custom claims)

1. Visitor enters email + password on `/login` and submits.
2. Client calls `signInWithEmailAndPassword(email, password)`.
   - **Failure** (wrong credentials, unknown account, disabled account, network,
     throttled) → inline error; the form re-enables for retry. Wrong password
     and unknown account share one generic message (no account-existence
     disclosure).
3. On success, `AuthContext` reads the ID token via `getIdTokenResult()`:
   - `role` ∈ {`admin`, `user`} **and** `isActive === true` → authenticated;
     route by role.
   - Otherwise (no `role`, unknown `role`, or `isActive !== true`) → status
     `notActivated`; **the session is kept**; the unified "Профіль ще не
     активовано" screen renders with the email and a «Вийти» button.
4. Claims take effect on the next ID token refresh (owner activates the account,
   the user signs out/in or reloads).

### Provisioning (unchanged model, renamed flag)

Manual only, via `scripts/setUserRole.mjs` (Firebase Admin SDK), which now sets
`{ role, isActive }`. The owner:

1. Creates the account in Firebase Auth (email + password), optionally marking
   `emailVerified`.
2. Runs the provisioning script with `--role` and the activity flag to set the
   `isActive` custom claim.
3. Disables self-signup in the Firebase console (Authentication → Settings →
   disable "Enable create (sign-up)") so no un-provisioned account can be
   created via the public `accounts:signUp` endpoint. This is an operational
   deployment step documented in `docs/06-auth-and-security.md`, not code.

### Claim rename migration (`active` → `isActive`)

- Any account provisioned under the old `active` claim must be re-provisioned
  with the script so the `isActive` claim is present; until then it reads as
  not-activated and lands on the not-activated screen (no data exposure — Rules
  deny without `isActive == true`). This is acceptable because the deployment is
  a single household re-provisioned by the owner; document it as a required
  post-deploy step. No automated backfill.

## UX and accessibility

Route `/login`, audience: all (unauthenticated).

- **Login — default:** language switcher (top corner), cat `idle` hero,
  logo mark + wordmark (`app.title`), tagline, email `TextField`, password
  `TextField` with show/hide toggle button, full-width contained «Увійти»
  button, static "no access?" hint text.
- **Login — validating:** required email and password; email format validated;
  submit disabled while fields invalid or a request is in flight.
- **Login — submitting:** button shows a spinner with an `aria-label`; repeat
  submits blocked.
- **Login — error:** inline error text (color + text, never color alone);
  button re-enabled.
- **Not-activated (post-auth, kept session):** single screen — cat `confused`
  hero, "Профіль ще не активовано" headline, body naming the signed-in email,
  a static "contact the administrator" info block, and an outlined «Вийти»
  button calling `signOut()`. Replaces both `NotAuthorizedState` and the
  inactive-account use of `AccessDeniedState`.
- **403 (forbidden):** route `/403`; minimal centered page — large "403" text
  and one button (localized label) that navigates to `/` (role-appropriate
  home). Reached when an active, non-admin visitor hits an admin route.
- **404 (not found):** catch-all route `*`; same minimal layout with "404" and
  the same home button. Reached for any unknown path.
- Accessibility: touch targets ≥ 44px; password toggle is a labeled button;
  email field uses `type="email"` / appropriate autocomplete; error and
  spinner announced to assistive tech; the numeric code on 403/404 has an
  accessible heading.

## Deep impact analysis

| Area | Assessment |
| --- | --- |
| Architecture | `features/auth`: rewrite `LoginPage` (form + validation + submit state), unify not-activated components, adjust `RequireActiveProfile`, `RequireAdmin`, `AuthContext`, `authContextValue` (rename status). Add a `usePermissions` hook (single source for role/activation route checks). `infrastructure/firebase/authAdapter`: replace `signInWithGoogle` with `signInWithEmailAndPassword`; drop `GoogleAuthProvider`/`signInWithPopup`. `shared/components/LanguageSwitcher` reused on login. New minimal `ForbiddenPage` (`/403`) and `NotFoundPage` (`*`) plus their route registrations and the button navigating to `/`. Styles in `LoginPage.styles.ts` + not-activated styles updated to design tokens. |
| Firebase | No schema/index/transaction change. Security Rules: rename claim read `claims().active` → `claims().isActive` (helper `activeUser()`), plus comments. Auth: provider switches to Email/Password (console setting, plus disable sign-up). `scripts/setUserRole.mjs` and `scripts/seedEmulatorAdmin.mjs` set/emit `isActive`. Emulator Rules tests updated to mint `isActive` claims. **Note:** Docker emulator does not hot-reload `firestore.rules`; restart the emulator after the rules change before running Rules tests. |
| Domain | No domain-rule change. Authorization remains claim-derived. |
| Privacy | No real identities: i18n examples and fixtures use `*.test`. The design mockup's `olena@dim.ua` is illustrative only and must not enter code, fixtures, or docs. Remove the token-dumping `console.log`. No admin email hardcoded (the "contact admin" hint is static text). |
| i18n | Add `uk`+`en` keys for: email/password labels, show/hide password, submit button, "no access?" hint, generic invalid-credentials error, other auth errors, the unified "Профіль ще не активовано" screen, and the 403/404 home-button label (numeric codes stay literal). Remove obsolete Google-only keys (`auth.login.googleButton`, and any now-unused `notAuthorized`/`accessDenied` keys after unification). `uk` default, `en` fallback; mismatched keys fail tests. |
| UX | Login gains a real form and a language switcher. Not-activated collapses two screens into one keep-session screen. New `/403` and catch-all `/404` routes; role→home routing unchanged. Admin guard redirects active non-admins to `/403`. No new destructive actions. |
| Compatibility | Additive-then-cutover: after deploy, accounts must be re-provisioned so `isActive` exists; old `active`-only accounts read as not-activated (fail closed, no data exposure). Rollback = revert code + Rules and re-provision under `active`. Deployed clients using Google Sign-In stop working by design; single-household deployment tolerates a coordinated cutover. |
| Quality | Update/extend: `LoginPage` component tests (render, validation, submit success routing, submit failure error, not-activated screen), `AuthContext` tests (keep-session on not-activated, no auto-sign-out, `isActive` reads), route-guard tests, `authAdapter` covered via mocks, Rules emulator tests renamed to `isActive`, `LanguageSwitcher` presence on login. Full `npm run verify` gate. Update both docs. |

## Acceptance criteria

- [ ] `/login` renders an email/password form matching the design (language
      switcher, hero, wordmark, tagline, email, password + show/hide, «Увійти»,
      static "no access?" hint).
- [ ] Submitting valid credentials for a provisioned active account signs in and
      routes by role (`admin` → `/admin`, `user` → `/menu`).
- [ ] Wrong credentials / unknown account show a single generic inline error and
      re-enable the form; no account-existence disclosure.
- [ ] No client code references `GoogleAuthProvider`, `signInWithPopup`, or
      `signInWithGoogle`; there is no account-creation or password-reset path.
- [ ] A successful sign-in with no `role` or `isActive != true` keeps the
      session and shows the unified "Профіль ще не активовано" screen with the
      email and a working «Вийти» button; no automatic sign-out occurs.
- [ ] The activity claim is named `isActive` in Security Rules,
      `scripts/setUserRole.mjs`, `scripts/seedEmulatorAdmin.mjs`, `AuthContext`,
      tests, and documentation; no remaining `active` claim reference.
- [ ] `emailVerified` does not affect access.
- [ ] The `console.log(tokenResult)` token leak is removed.
- [ ] All new strings exist in both `uk` and `en`; obsolete Google-only strings
      are removed; i18n key-parity tests pass.
- [ ] `docs/06-auth-and-security.md` and `docs/design/screens/login.md` describe
      the email/password flow, `isActive`, the keep-session not-activated
      behavior, and the disable-self-signup operational step.
- [ ] Visiting an unknown path renders a `/404` page (numeric "404" + a button
      that navigates to `/` and lands on the role-appropriate home).
- [ ] An active, non-admin visitor to an admin route is redirected to `/403`,
      which shows "403" + the same home button; `AccessDeniedState` no longer
      handles role-mismatch inline.
- [ ] A `usePermissions` hook is the single source of the role/activation route
      check used by the guards.
- [ ] `npm run verify` passes.

## Milestones

1. Auth infrastructure: `authAdapter` email/password + `isActive` reads;
   remove token log.
2. Login UI: form, validation, submit states, language switcher, design styling,
   i18n keys.
3. Not-activated unification: single keep-session screen; update guards and
   `AuthContext`.
4. Permissions & error pages: `usePermissions` hook, `/403` + `/404` pages,
   admin-guard redirect to `/403`.
5. Claim rename across Rules + scripts + tests; restart emulator; Rules tests.
6. Documentation updates.
7. Full `npm run verify`.

## Open questions (non-blocking)

- Exact final copy for the unified not-activated screen and the "no access?"
  hint (English + Ukrainian) will be finalized during implementation from the
  design mockup wording; no behavioral impact.

## References

- Current docs: `docs/06-auth-and-security.md`, `docs/design/screens/login.md`,
  `docs/design/screens/shared-patterns.md`.
- Code: `src/features/auth/LoginPage.tsx`, `.../AuthContext.tsx`,
  `.../authContextValue.ts`, `.../RequireActiveProfile.tsx`,
  `.../components/NotAuthorizedState.tsx`, `.../components/AccessDeniedState.tsx`,
  `src/infrastructure/firebase/authAdapter.ts`,
  `src/shared/components/LanguageSwitcher/`, `firestore.rules`,
  `scripts/setUserRole.mjs`, `scripts/seedEmulatorAdmin.mjs`.
- Historical: `docs/specifications/auth-custom-claims-migration/SPEC.md`.

## Approval

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Owner | Dmytro Tyshchenko | 2026-07-11 | Approved (initial scope) |
| Owner | Dmytro Tyshchenko | 2026-07-11 | Approved (revised scope: 403/404 pages + `usePermissions`) |
