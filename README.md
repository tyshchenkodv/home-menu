# Home Menu

Home Menu is an open-source household food inventory and meal-request
application. It answers two practical questions:

- What prepared food is available at home right now?
- What meals can be cooked with the ingredients currently in stock?

An administrator manages dishes, recipes, ingredient inventory, cooking
requests, and prepared batches. Household members browse available dishes and
request portions for breakfast, lunch, or dinner.

The application is designed to run at no recurring cost: a React single-page
application is hosted on GitHub Pages, while Firebase Authentication and Cloud
Firestore provide the backend on the Firebase Spark plan.

## Status

The React single-page application is scaffolded, and the admin inventory
workflow (authentication guard, ingredient CRUD, restock/correction/presence
transactions, and movement history) is implemented. Firestore security-rule
tests are written but not yet run in this environment; see
[Local development](#local-development) for the Java prerequisite.

## Planned stack

- React, TypeScript, and Vite
- Material UI
- React Router with `HashRouter`
- `i18next` and `react-i18next`
- Ukrainian (`uk`) and English (`en`) UI; Ukrainian is the default
- Firebase Authentication with Google Sign-In
- Cloud Firestore
- Vitest, React Testing Library, Firebase Emulator Suite, and Playwright
- GitHub Actions and GitHub Pages

## Documentation

1. [Product scope](docs/01-overview.md)
2. [Architecture](docs/02-architecture.md)
3. [Firestore data model](docs/03-data-model.md)
4. [Business rules](docs/04-business-logic.md)
5. [Components and user flows](docs/05-components-and-flows.md)
6. [Authentication and security](docs/06-auth-and-security.md)
7. [Testing and CI/CD](docs/07-testing-and-cicd.md)
8. [Deployment](docs/08-deployment.md)

## Local development

### Prerequisites

- Node.js version pinned in `.nvmrc` (currently 26; `firebase-tools` officially
  supports Node 20, 22, and 24, so the emulator CLI may warn on 26)
- npm
- Docker, for the containerized Firebase Emulator Suite (no local Java
  needed); alternatively Java 21+ if you prefer running the emulators
  directly via `npm run test:rules`
- A Firebase project for manual cloud testing, or the local Emulator Suite

### Install and run

```bash
npm ci
npm run dev
```

Verified quality commands:

```bash
npm run dev          # start the local dev server
npm run build        # type-check and produce a production build
npm run format:check # Prettier check
npm run format       # Prettier write
npm run lint         # ESLint, zero warnings allowed
npm run typecheck    # tsc -b --noEmit
npm test             # Vitest unit and component tests
npm run test:rules   # Firestore emulator Rules tests, requires local Java 21+
npm run emulators    # start Dockerized Firestore + Auth emulators
npm run test:rules:docker # Rules tests against the Docker emulators
npm run seed:admin   # promote emulator accounts to active admins
npm run emulators:stop    # stop the Docker emulators
```

### Firebase configuration

Do not commit local environment files or Firebase credentials. Create an
ignored `.env.local` on your machine with your own Firebase Web App values:

```text
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-app-id
```

Firebase web configuration identifies a project and is not an administrative
credential, but every contributor must still use their own project. Service
account keys, access tokens, private keys, exported production data, user
emails, and real UIDs must never enter Git history.

For most development and all security-rule tests, prefer the Firebase Emulator
Suite.

### Fully local development with Docker emulators

No real Firebase project is required. Start the containerized emulators and
point the app at them with an ignored `.env.local` (the `demo-` project id
keeps everything offline):

```text
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=localhost
VITE_FIREBASE_PROJECT_ID=demo-home-menu
VITE_FIREBASE_APP_ID=demo-app-id
VITE_USE_EMULATORS=true
```

```bash
npm run emulators   # Firestore :8080, Auth :9099, Emulator UI :4000
npm run dev
```

Sign in with a fake emulator Google account (you will land on the
access-denied screen — expected for an unprovisioned user), then run
`npm run seed:admin` and reload. See `docker/firebase-emulators/README.md`.

### Provisioning an admin user

The application does not self-provision roles. After a user signs in once
with Google, manually create their `users/{uid}` document in the Firebase
Console (or the Emulator UI) with placeholder-shaped values, for example:

```text
users/<uid>
  role: "admin"
  active: true
```

Use your own project's real `uid`; never commit a real `uid` or email to this
repository.

## Create your own deployment

1. Fork this repository.
2. Create a Firebase project on the no-cost Spark plan.
3. Enable Google Sign-In and create Firestore.
4. Configure GitHub Actions variables with your Firebase Web App values.
5. Store the deployment service-account credential only in GitHub Secrets.
6. Enable GitHub Pages with GitHub Actions as the source.
7. Deploy the Firestore rules and indexes.
8. Sign in once, then create your own `users/{uid}` documents in Firebase
   Console with `admin` and `user` roles.

Never reuse the original author's Firebase project or identity data. Detailed
instructions are in the [deployment guide](docs/08-deployment.md).

## Repository privacy policy

This public repository contains only source code, generic documentation,
schemas, synthetic examples, and reusable agent instructions.

Before every commit:

- inspect `git diff` and `git status`;
- scan for `.env`, keys, tokens, email addresses, UIDs, project IDs, exported
  Firestore data, and personal paths;
- use placeholders such as `<firebase-project-id>`;
- keep runtime data in Firestore, not in fixtures;
- use synthetic test identities such as `admin@example.test`.

The project-level rules are also defined in [AGENTS.md](AGENTS.md) and the
[Home Menu project skill](.agents/skills/home-menu-project/SKILL.md).

## Agent tooling

The repository vendors project-local
[Superpowers skills](.agents/skills/superpowers/README.md) and a small
Home Menu policy skill. Restart Codex after cloning so project-local skills are
discovered. These tools are local to this repository and do not modify a
user-wide Codex installation.

## Contributing

Use English for code, identifiers, comments, tests, commit messages, and
documentation. User-facing text must live in translation resources and be
provided in both `uk` and `en`.

Do not commit generated credentials, local IDE state, environment files, build
output, emulator data, or production exports.

## License

This project is licensed under the [MIT License](LICENSE).
