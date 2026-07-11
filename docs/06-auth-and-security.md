# Authentication and security

## Sign-in flow

The application uses Firebase Authentication with **email and password**
sign-in only. There is no Google Sign-In, no self-service account creation,
no in-app password reset, and no email-verification flow — the client calls
only `signInWithEmailAndPassword` (`src/infrastructure/firebase/authAdapter.ts`).
A person who was never provisioned in Firebase Auth simply cannot sign in.

Authorization state — `role` (`admin` | `user`) and `isActive` (boolean) —
lives in **Firebase Auth custom claims** carried on the ID token; it is the
single source of truth for both the client and Security Rules. There is no
Firestore `users/{uid}` authorization lookup. `emailVerified` is set
operationally by the owner but does **not** gate access — it stays
informational only.

1. A person enters their email and password on `/login` and submits.
2. The client calls `signInWithEmailAndPassword(email, password)`. A failure
   (wrong credentials, unknown account, disabled account, network, throttling)
   shows a single generic inline error and re-enables the form for retry; the
   app never discloses whether an account exists.
3. On success, the client reads the ID token's custom claims
   (`getIdTokenResult()`).
4. A token with `role` ∈ {`admin`, `user`} **and** `isActive === true` grants
   access; `role` selects the route (`admin` → `/admin`, `user` → `/menu`).
5. Otherwise — **no `role` claim**, an unknown `role`, or `isActive !== true`
   — the account is not yet activated. The client **keeps the session** (no
   automatic sign-out) and renders a single unified "Profile not activated
   yet" screen (`NotActivatedState`) showing the signed-in email and a
   Sign out button. Security Rules deny all data access to any such request
   regardless of what the client renders.

Claims only take effect on the next ID token refresh: an already signed-in
user must sign out and back in (or the client must call `getIdToken(true)`)
to pick up a role change made while they were signed in.

## Initial provisioning

There is no public self-registration and no client-facing account-creation
path. Every account is created and activated entirely by hand:

1. Each adopter creates their own Firebase project and switches the
   Authentication sign-in provider to **Email/Password**.
2. **Self-signup must be disabled** in the Firebase console (Authentication →
   Settings → disable "Enable create (sign-up)"), so the public
   `accounts:signUp` endpoint cannot be used to create an un-provisioned
   account. A password policy can optionally be configured in the same
   settings screen.
3. The owner creates each household member's account directly in Firebase
   Auth (email + password), optionally marking `emailVerified`.
4. The owner resolves the UID from the Firebase Console (or `getUserByEmail`
   via the Admin SDK).
5. The owner sets the account's custom claims,
   `getAuth().setCustomUserClaims(uid, { role, isActive })`, using the
   `firebase-admin` SDK — there is currently no bundled CLI for this; a
   dedicated `scripts/setUserRole.mjs` wrapper is planned (see
   `docs/specifications/auth-custom-claims-migration/PLAN.md`, task T2.2) but
   not yet implemented. In production this uses a service-account key file
   (path from `GOOGLE_APPLICATION_CREDENTIALS`, never committed); against the
   local Emulator Suite it runs in emulator mode
   (`FIREBASE_AUTH_EMULATOR_HOST`), which needs no real credentials.
6. The member signs in with the email and password the owner set. Until this
   point they cannot authenticate at all, since the client never calls an
   account-creation API.

**Bootstrapping the first admin:** the owner sets custom claims in production
mode with their own service-account key before any account has a role claim.
Because the Admin SDK bypasses Security Rules, this has no chicken-and-egg
problem.

**Revocation:** set `isActive: false` (soft revoke — account still exists but
is denied) or clear the `role` claim entirely (hard revoke — account is
treated as never provisioned). Password storage and hashing (scrypt) is
handled entirely server-side by Firebase Auth; the app itself stores no
passwords and needs no hashing secret. Password resets happen only in the
Firebase console — there is no in-app "forgot password" flow.

**Migration note:** any account provisioned under the previous `active` claim
name must be re-provisioned with `isActive` set via the Admin SDK. Until then
it fails closed — Security Rules deny access without `isActive == true` — and
the account lands on the not-activated screen after sign-in, with no data
exposure.

**The `users/{uid}` document is kept, but only as a non-authoritative display
record** (`displayName`, `email`), so requester names still render in the
menu/orders UI. It carries no authorization meaning: clients can never
create, update, or delete it (`if false` in Security Rules); only the
provisioning script writes it, using the privileged Admin SDK, which bypasses
Rules.

Real email addresses and UIDs belong in Firebase only. Documentation, tests, and
fixtures use values such as `admin@example.test` and `test-admin-uid`.

## Permission matrix

| Resource | User read | User write | Administrator |
| --- | --- | --- | --- |
| own `users/{uid}` | yes | no | read |
| other users | no | no | read |
| dishes | yes | no | read/write |
| ingredients | yes | no | read/write |
| inventory movements | no | no | read/create |
| prepared batches | yes | only through order transaction | read/write |
| own orders | yes | create/cancel under rules | read/write |
| other orders | no | no | read/write |
| general settings | yes | no | read/write |

## Security Rules concepts

Conceptual helpers, reading authorization directly from the ID token's custom
claims (`request.auth.token`) instead of a Firestore profile document — no
per-request `get()`/`exists()` lookup on `users/{uid}`:

```text
signedIn()
claims() = request.auth.token
activeUser() = signedIn() && claims().isActive == true && ('role' in claims())
isAdmin() = activeUser() && claims().role == "admin"
owns(resource) = activeUser() && resource.userId == request.auth.uid
```

A token with no `role` claim fails `activeUser()` (and therefore `isAdmin()`)
and is denied everywhere — the rules-level counterpart of "no self-signup".

Rules must:

- deny by default;
- prevent clients from creating users or changing roles;
- require `userId == request.auth.uid` on order creation;
- validate field allowlists and enum values;
- keep ownership and creation fields immutable;
- allow user cancellation only for an owned order;
- prohibit physical deletion of domain and audit records;
- restrict inventory, recipe, settings, and cooking writes to administrators;
- validate related post-transaction counters with `getAfter()` where practical;
- anchor every client-set audit timestamp (`createdAt` on create, `updatedAt`
  on update) to `request.time`, so a client cannot backdate or forward-date
  its own audit trail; the corresponding `src/infrastructure/firebase/**`
  writes use `serverTimestamp()` so the value the server receives always
  equals `request.time`. Fields that legitimately differ from "now" —
  `scheduledFor`, `preparedAt`, `expiresAt` — are deliberately **not**
  anchored, since they represent a user-chosen future or past instant, not an
  audit stamp;
- require a prepared batch's user-issued reservation move
  (`isUserReservationMove`) to strictly decrease `availableQuantity`; a
  zero-delta "move" is not a real reservation and is rejected;
- accept any non-empty, syntactically plausible IANA zone name for
  `settings/general.timezone` rather than pinning one literal value, since
  this repository is reused by any household and must not hardcode a single
  deployment's timezone (see also "Public Firebase configuration" below).

## Client-only limitations

Firestore Rules are not a full domain server and cannot conveniently aggregate
an arbitrary number of batches or recipe items. Therefore:

- TypeScript validates full domain behavior.
- Rules duplicate ownership, field, transition, and counter constraints as far
  as the language allows.
- Only explicitly provisioned household accounts access the data.
- If untrusted or public users are introduced, reservation and cooking commands
  must move to a trusted backend.

### Accepted limitation: batch counter-move rules

The prepared-batch reservation and cancellation flows move counters across a
variable number of batch documents in one transaction. Firestore Rules cannot
aggregate those cross-document deltas, so the `preparedBatches` rules validate
only each single document's own counter shift (`isUserReservationMove` /
`isUserCancellationMove`): the exact delta, all other fields frozen, and the
actor stamping their own uid. They do **not** correlate the batch write to a
specific order the caller owns.

Consequence: any active (provisioned) household member could, by crafting a
direct Firestore write, move a batch's `available`↔`reserved` counters without a
matching order. In the intended single-household, fully-trusted deployment this
is an accepted MVP limitation, consistent with the client-only model above. The
TypeScript transaction layer is the real enforcer — `reserveReadyOrder` /
`cancelOrder` verify order ownership and assert the conservation invariant
before writing. If the app is ever opened to untrusted users, these two
operations must move to a trusted backend (Cloud Function), which is out of MVP
scope and would require a new architecture specification.

## Public Firebase configuration

Firebase Web App values identify a project but do not grant administrative
access. They are still deployment-specific and must not be hardcoded to the
maintainer's project in this reusable repository.

Local values belong in ignored `.env.local`. GitHub deployment values belong in
GitHub Actions variables.

Secrets include:

- service-account credentials;
- access and refresh tokens;
- private keys;
- production exports.

Secrets belong only in GitHub Secrets or secure local storage and must never be
available to untrusted pull-request jobs.

## Public-repository controls

- Ignore all `.env*` files.
- Ignore common key and certificate extensions.
- Ignore Firebase emulator exports and debug logs.
- Use synthetic fixture identities and inventory.
- Scan changes for emails, UIDs, project IDs, tokens, and personal paths before
  commit.
- Keep the service account minimally privileged and rotate it if exposed.
- Enable GitHub secret scanning and Dependabot alerts.

## Rules tests

Firebase Emulator tests must cover:

- unauthenticated denial;
- authenticated but unprovisioned denial;
- inactive-user denial;
- allowed catalog reads;
- user denial for inventory, dishes, and settings writes;
- own-order creation only;
- denial of another user's orders;
- denial of role escalation;
- administrator operations and archiving;
- deletion denial for audit and historical records.
