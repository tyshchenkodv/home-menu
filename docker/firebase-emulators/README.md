# Firebase emulators in Docker

Runs the Firebase Emulator Suite (Firestore, Auth, Emulator UI) in a container
so the host machine does not need Java.

The project id is `demo-home-menu`. The `demo-` prefix keeps the suite fully
offline: no real Firebase project is contacted and no credentials are needed.

## Usage

From the repository root:

```bash
docker compose up -d firebase-emulators   # start
docker compose logs -f firebase-emulators # watch logs
docker compose down                       # stop (data is discarded)
```

Endpoints on the host:

- Firestore emulator: `localhost:8080`
- Auth emulator: `localhost:9099`
- Emulator UI: <http://localhost:4000>

The container mounts `firebase.json`, `firestore.rules`, and
`firestore.indexes.json` from the repository root, so rules edits apply on
restart (the Firestore emulator also hot-reloads rules file changes).

## Security Rules tests

With the container running:

```bash
npm run test:rules:docker
```

This executes the same `tests/rules/firestore.rules.test.ts` suite against the
containerized emulator via `FIRESTORE_EMULATOR_HOST`.
