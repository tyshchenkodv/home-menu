# Specification: Role migration to custom claims + no self-signup

| Field | Value |
| --- | --- |
| Slug | `auth-custom-claims-migration` |
| Status | Approved |
| Request | Original owner request from the MVP audit ("логін має розрізняти юзерів по authentication і роль виставляти по Custom claims … юзери можуть логінитись тільки якщо я сам додав їх у authentication") |
| Created | 2026-07-11 |
| Related | Extends `mvp-completion`; revises the model documented in `docs/06-auth-and-security.md`. Architecture decision: adds a local `firebase-admin` provisioning script (no Cloud Functions). |

## Problem statement

Two coupled requirements from the owner are unmet:

1. **Roles should live in Firebase Auth custom claims**, not in a Firestore
   `users/{uid}` document. Today the role (`admin` | `user`) and `active` flag
   are stored in a Firestore profile document, read by the client
   (`loadUserProfile`) and by every Security Rule via a `get()` lookup
   (`profile()` helper). This means: every rule evaluation costs a document
   read; the client must load a second document after auth; and the
   authorization signal is not carried in the ID token.

2. **No self-signup.** Any Google account can currently complete
   `signInWithPopup` and become a Firebase Auth user. The app only *reads*
   `users/{uid}` and shows "access denied" when it is missing — but the account
   still exists in Authentication and is authenticated. The owner wants only
   accounts they explicitly provisioned to be able to enter the system; a
   brand-new Google account signing in must be denied and must not linger as a
   usable authenticated identity.

Both are addressed together because provisioning (creating the allowed account
+ assigning its claims) is the single act that makes an account legitimate.

## Constraints driving the design (decided)

- **Claims are set from a local admin script**, not Cloud Functions. The
  project architecture forbids Cloud Functions without an explicit decision;
  the owner chose a local Node script using `firebase-admin` with a
  service-account key kept outside Git. This is the recorded architecture
  decision.
- **"No self-signup" is enforced at the app level**, not by upgrading to Google
  Identity Platform (GCIP). The base Firebase Auth plan is kept (no billing/
  stack change). The app treats an account without a provisioned claim as not
  allowed: it signs the account out immediately and shows an access-denied
  screen; Security Rules deny all data access to any token lacking the claim.

## Goals

1. Carry `role` (`'admin' | 'user'`) and `active` (boolean) as **Firebase Auth
   custom claims** on the ID token.
2. Read authorization state on the client from the ID token
   (`getIdTokenResult()`), not from a Firestore profile document.
3. Enforce authorization in Firestore Security Rules from
   `request.auth.token.role` / `request.auth.token.active`, removing the
   per-request `get()` profile lookup.
4. Deny entry to any signed-in account that has **no `role` claim** (i.e. not
   provisioned): sign it out and show access-denied; grant no data access.
5. Provide a **local `firebase-admin` provisioning script** the owner runs to
   set/update/revoke a user's claims by UID (and against the emulator for local
   dev), replacing the emulator-only `seedEmulatorAdmin.mjs` Firestore-doc
   seeding.
6. Update the rules test harness to inject claims via the auth token payload
   instead of seeding profile documents.
7. Keep `uk`/`en` parity for any new/changed auth copy.
8. Document the new provisioning workflow and revised security model in
   `docs/06-auth-and-security.md`.

## Non-goals

- Upgrading to Identity Platform / GCIP or using its project-level
  `disableSignups` flag. (Explicitly rejected in favor of app-level denial.)
- Adding Cloud Functions, an admin web UI for role management, or any hosted
  callable. Provisioning is a local script the owner runs.
- Self-service registration, invitations, email/password auth, or any new
  sign-in method. Google popup remains the only method.
- Automatic backfill beyond a one-time provisioning of the currently intended
  accounts (the owner runs the script for each real account once).
- Changing domain, inventory, batch, or reservation behavior.

## Workflow, domain, and data model

### Claims as source of truth

Authorization state moves from `users/{uid}` document → ID token claims:

- `role: 'admin' | 'user'` — absence means **not provisioned / not allowed**.
- `active: boolean` — a provisioned-but-disabled account.

The Firestore `users/{uid}` document is no longer the authorization source. The
SPEC/PLAN must decide its fate (see open question): either (a) keep it as a
non-authoritative profile record for display fields like `displayName`/`email`
(written only by the provisioning script / rules `if false` for clients), or
(b) remove it. Recommendation: **keep it for display only**, authoritative for
nothing, so the menu/orders UI can still show a requester's display name.

### Provisioning script (`firebase-admin`)

New: `scripts/setUserRole.mjs` (or `.ts`) using `firebase-admin`.

- Inputs: target `uid` (or email → looked up), `role`, `active`.
- Actions: `getAuth().setCustomUserClaims(uid, { role, active })`; optionally
  upsert the non-authoritative `users/{uid}` display record.
- Modes: production (service-account key from an env var / local ignored file,
  never committed) and emulator (via `FIREBASE_AUTH_EMULATOR_HOST`), so local
  dev and rules tests can provision claims without real credentials.
- Revocation: `active: false` (soft) or clearing the `role` claim (hard, blocks
  entry entirely).
- `firebase-admin` is added as a **devDependency** (used only by the local
  script and tests, never bundled into the client app).

Because claims propagate on the next token refresh, the script (or its docs)
must note that an already-signed-in user picks up new claims after token
refresh / re-login; the client should call `getIdToken(true)` where immediate
effect matters.

### Client auth flow changes

- `AuthContext` replaces `loadUserProfile(uid)` with reading
  `user.getIdTokenResult()` and extracting `role`/`active` claims into the
  context value.
- **No-signup enforcement:** if a signed-in user's token has **no `role`
  claim**, the context treats them as not allowed — trigger `signOut()` and
  surface an access-denied state (distinct copy: "this account is not
  authorized; ask the owner to add you"). This ensures an un-provisioned Google
  account cannot sit authenticated in the app.
- `LoginPage` redirect logic keeps its shape (admin → `/admin`, active user →
  `/menu`) but reads role/active from claims.
- `RequireAdmin` / `RequireActiveProfile` read claims instead of the profile
  doc.

### Security Rules changes (`firestore.rules`)

The four centralized helpers change; call sites (ingredients, dishes, batches,
movements, orders, settings) stay the same:

```
function signedIn()   { return request.auth != null; }
function claims()     { return request.auth.token; }
function activeUser() { return signedIn()
    && claims().active == true
    && ('role' in claims()); }
function isAdmin()     { return activeUser() && claims().role == 'admin'; }
```

- No more `get()`/`exists()` on `users/{uid}` for authorization → fewer
  document reads per request and no dependency on a profile doc existing.
- `users/{uid}` rules: reads limited to self/admin as today; `create, update,
  delete: if false` for clients remains (only the admin script, using
  privileged admin SDK that bypasses rules, writes the display record).
- The existing "cannot escalate own role" test intent is preserved: a client
  cannot grant itself a claim (claims are only settable via admin SDK), and
  cannot write its `users` doc.

### Rules test harness

`tests/rules/firestore.rules.test.ts` currently seeds profile docs via
`withSecurityRulesDisabled`. After migration, identities are created with
claims directly: `testEnv.authenticatedContext(UID, { role: 'admin', active:
true })` etc., and an **un-provisioned** context `authenticatedContext(UID, {})`
(no claims) must be denied everywhere — the direct rules-level analog of
"no self-signup".

## UX and accessibility

- **Un-provisioned account** signs in with Google, is immediately signed out,
  and sees an access-denied screen with copy explaining the account is not
  authorized and to contact the owner. (New/adjusted `auth.notAuthorized.*`
  copy, both locales.)
- **Inactive account** (`active: false`): access-denied as today.
- **Active user/admin**: unchanged redirect and access.
- No new route; roles/permissions semantics unchanged from the user's
  perspective, only their source.
- Accessibility: text-based states, no color-only signals; reuses existing
  `AccessDeniedState` patterns.

## Deep impact analysis

| Area | Assessment |
| --- | --- |
| Architecture | New: local `firebase-admin` provisioning script (recorded architecture decision — no Cloud Functions). Client `features/auth` reads claims; `infrastructure` loses the profile-as-authz reader. Rules helpers rewritten. |
| Firebase | Custom claims become the authz carrier. Rules stop `get()`-ing `users`. `users/{uid}` demoted to non-authoritative display record (or removed — open question). `firebase-admin` devDependency added. No Cloud Functions, no GCIP upgrade. |
| Domain | Role/active semantics unchanged; only their storage/read path changes. |
| Privacy | Service-account key is a hard secret — never committed, kept in a local ignored file / GitHub Secret; documented by name only in README. No real UIDs/emails/project ids in repo; script examples use `example.test` and placeholder UIDs. Claims contain no extra personal data. |
| i18n | New `auth.notAuthorized.*` (and any revised `auth.accessDenied.*`) keys in `uk` + `en`; parity enforced. |
| UX | Un-provisioned sign-out + access-denied is the visible new behavior; provisioned users unaffected. |
| Compatibility | Migration window: until each real account is provisioned via the script, it is treated as un-provisioned and denied. Owner must run the script for all intended accounts as part of rollout. Rollback = restore profile-doc rules helpers + client reader (kept in git history). |
| Quality | Rules tests (claim-gated access; un-provisioned denied; no self-escalation); client tests (AuthContext reads claims; un-provisioned triggers signOut + access-denied; redirects by claim); script smoke test against emulator. |

## Acceptance criteria

- [ ] Firestore Rules authorize from `request.auth.token` claims with no
      `users/{uid}` `get()`; all existing access tests pass against
      claim-based identities.
- [ ] A signed-in identity with no `role` claim is denied all data access in
      rules, and in the client is signed out and shown an access-denied
      ("not authorized") screen.
- [ ] `AuthContext`/guards derive role/active from `getIdTokenResult()`, not
      from a Firestore profile read.
- [ ] `scripts/setUserRole.*` sets/updates/revokes claims by uid against both
      production (service-account key, not committed) and the emulator, and is
      documented in the README + `docs/06-auth-and-security.md`.
- [ ] Rules test harness provisions claims via token payload and includes an
      un-provisioned-denied case; `npm run test:rules:docker` passes.
- [ ] `firebase-admin` added as a devDependency only; not bundled into the
      client build.
- [ ] New/changed auth copy present in both locales; parity test passes.
- [ ] No secrets, real UIDs, emails, or project ids added to the repo.
- [ ] `npm run verify` passes.

## Milestones

1. Rules helpers → claims + rules-test harness (claims + un-provisioned denied).
2. `firebase-admin` provisioning script (prod + emulator) + README/security-doc.
3. Client: `AuthContext`/guards read claims; un-provisioned sign-out +
   access-denied copy; tests.
4. Decommission emulator profile-seeding (`seedEmulatorAdmin.mjs`) in favor of
   the claims script; docs sync + full gate.

## Open questions (non-blocking, recommend an answer)

- **Fate of `users/{uid}`.** Recommend keeping it as a non-authoritative
  display record (displayName/email) written only by the provisioning script,
  so requester names still render; remove authorization semantics from it.
  Decide in PLAN.
- **Claim propagation UX.** After the owner changes a claim, the affected user
  sees it on next token refresh/login. Recommend documenting "re-login to apply
  role changes" rather than forcing a live token refresh, to keep the client
  simple. Decide in PLAN.
- **Bootstrapping the first admin.** The very first admin claim must be set by
  the owner running the script with the service-account key (chicken-and-egg is
  avoided because the script uses admin SDK, not the app). Document in the
  rollout section.

## References

- `docs/06-auth-and-security.md` (initial provisioning, client-only
  limitations, permission matrix — to be revised)
- `src/features/auth/*` (`AuthContext`, `authContextValue`, `LoginPage`,
  `RequireAdmin`, `RequireActiveProfile`, `useAuth`)
- `src/infrastructure/firebase/authAdapter.ts`,
  `src/infrastructure/firebase/services/userService.ts`,
  `src/infrastructure/firebase/converters/userConverter.ts`
- `src/shared/types/userProfile.ts`
- `firestore.rules` (helpers `signedIn`/`profile`/`activeUser`/`isAdmin`;
  `users/{uid}` block)
- `tests/rules/firestore.rules.test.ts`, `scripts/seedEmulatorAdmin.mjs`,
  `package.json`
- `src/locales/{uk,en}/translation.json` (`auth.*`)

## Approval

| Role | Decision | Date |
| --- | --- | --- |
| User | Approved | 2026-07-11 |
