# Authentication and security

## Sign-in flow

The application uses Firebase Authentication with Google Sign-In:

1. A person signs in with Google.
2. Firebase creates or locates the Auth account.
3. The client reads `users/{uid}`.
4. A missing document or `active == false` produces `unauthorized`.
5. An active profile defines role and route access.

## Initial provisioning

There is no public self-registration:

1. Each adopter creates their own Firebase project.
2. Each household member signs in once.
3. The project owner finds the UID in Firebase Console.
4. The owner manually creates `users/{uid}` with `admin` or `user`.
5. The next application load grants access.

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

Conceptual helpers:

```text
signedIn()
profile() = get(/databases/$(database)/documents/users/$(request.auth.uid))
activeUser() = signedIn && profile.active
isAdmin() = activeUser && profile.role == "admin"
owns(resource) = activeUser && resource.userId == request.auth.uid
```

Rules must:

- deny by default;
- prevent clients from creating users or changing roles;
- require `userId == request.auth.uid` on order creation;
- validate field allowlists and enum values;
- keep ownership and creation fields immutable;
- allow user cancellation only for an owned order;
- prohibit physical deletion of domain and audit records;
- restrict inventory, recipe, settings, and cooking writes to administrators;
- validate related post-transaction counters with `getAfter()` where practical.

## Client-only limitations

Firestore Rules are not a full domain server and cannot conveniently aggregate
an arbitrary number of batches or recipe items. Therefore:

- TypeScript validates full domain behavior.
- Rules duplicate ownership, field, transition, and counter constraints as far
  as the language allows.
- Only explicitly provisioned household accounts access the data.
- If untrusted or public users are introduced, reservation and cooking commands
  must move to a trusted backend.

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
