# Deployment

## Cost model

The target recurring cost is zero:

- GitHub Pages from a public repository on GitHub Free;
- GitHub Actions for a public repository;
- Firebase Spark;
- Google Sign-In;
- Firestore within no-cost quotas;
- no Cloud Functions, Scheduler, or Storage.

Pricing and quota terms can change. Adopters should verify current official
Firebase and GitHub documentation.

## Repository and identity isolation

Every adopter must use:

- their own fork or clone;
- their own Firebase project;
- their own Google OAuth setup;
- their own `users/{uid}` documents;
- their own GitHub variables and secrets.

The public repository must not ship a working connection to any maintainer's
backend. Production data never belongs in Git.

## Firebase setup

1. Create a Firebase project on Spark.
2. Add a Web App.
3. Enable Authentication with Google.
4. Create Firestore in an appropriate region.
5. Do not use test-mode Rules in production.
6. Add the GitHub Pages hostname to authorized domains.
7. Deploy Rules and indexes.
8. Create `settings/general`.
9. Sign in once with each household account.
10. Create the matching `users/{uid}` profiles manually.
11. Create a minimally privileged deploy service account.

Use placeholders such as `<firebase-project-id>` in documentation and committed
configuration.

## Local configuration

Create an ignored `.env.local`:

```text
VITE_FIREBASE_API_KEY=<your-web-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<your-project>
VITE_FIREBASE_APP_ID=<your-web-app-id>
```

No `.env` or `.env.example` is tracked. Variable names and setup instructions
live in README and this document.

Prefer the Firebase Emulator Suite for development and Rules tests. Do not
commit emulator exports.

## GitHub configuration

Repository settings:

1. Pages → Source → GitHub Actions.
2. Configure Actions variables for `VITE_FIREBASE_*` public web values.
3. Configure the deploy credential only as an Actions Secret.
4. Create the `github-pages` environment.
5. Apply branch protection where available.

The deploy secret is available only to the trusted `main` deployment job. It
must not be exposed to pull requests from forks.

## Vite and routing

For a project Pages URL:

```text
https://<owner>.github.io/<repository>/
```

Configure:

```ts
export default defineConfig({
  base: '/<repository>/',
});
```

The repository name may come from a safe build variable. `HashRouter` removes
the need for a `404.html` workaround. Asset URLs must honor Vite base and avoid
hardcoded `/assets/...` paths.

## Internationalization deployment

Both locale bundles are part of the static build:

```text
src/locales/uk/translation.json
src/locales/en/translation.json
```

Deployment must fail if key sets differ. The application starts in `uk`, reads
a valid saved `uk`/`en` preference, and falls back to `en` for a missing key.
Locale selection does not change Firebase data or URLs.

## Production deployment

1. Merge a reviewed pull request to `main`.
2. Trusted CI repeats every check.
3. Build the production bundle.
4. Deploy Firestore Rules and indexes.
5. Publish `dist` to GitHub Pages.
6. Perform smoke checks:
   - the application loads from its repository base path;
   - Google Sign-In returns to the Pages URL;
   - the administrator sees admin navigation;
   - a regular user cannot access admin routes;
   - real-time reads work;
   - an order can be created and cancelled;
   - `uk` and `en` switching works after reload.

## Monitoring without paid services

- Firebase Console for Auth and Firestore usage;
- GitHub Actions for CI and deployment history;
- GitHub Pages deployment status;
- explicit translated network and permission errors in the UI.

On Spark, quota exhaustion blocks further operations instead of automatically
creating a bill.

## Recovery

### Frontend deployment failure

Re-run the workflow or revert and redeploy the previous commit. A Pages
artifact does not mutate Firestore data.

### Rules deployment failure

Do not publish the frontend. Restore the last compatible Rules commit and run
emulator tests before redeployment.

### Firestore quota exhaustion

Show a temporary error and avoid unbounded retries. Inspect real-time queries
for unnecessary breadth.

### Credential exposure

Immediately revoke the service-account key, create a replacement, update the
GitHub Secret, inspect audit logs, and remove the leaked value from history.
Rotating public Firebase Web App configuration does not replace credential
revocation.

## Production checklist

- [ ] The repository contains no maintainer Firebase values or identity data.
- [ ] `.env*`, credentials, exports, logs, and IDE state are ignored.
- [ ] Spark is active and no billing account is linked.
- [ ] Google Sign-In is enabled.
- [ ] The Pages domain is authorized.
- [ ] Production Rules deny by default.
- [ ] Rules and locale parity tests pass.
- [ ] Household UIDs exist only in Firebase.
- [ ] The deploy service account has minimal permissions.
- [ ] No secret appears in Git history or the build artifact.
- [ ] Vite base matches the repository name.
- [ ] `HashRouter` direct hash routes work.
- [ ] Both languages pass smoke testing.
