/**
 * Promotes every account in the local Auth emulator to an active admin by
 * upserting its `users/{uid}` document in the Firestore emulator.
 *
 * Development helper only: it talks to the offline `demo-home-menu` emulator
 * project (never a real Firebase project) and requires the Docker emulators
 * to be running (`npm run emulators`).
 *
 * Flow: sign in once in the app with a fake emulator Google account (you will
 * see the access-denied screen — the guard working), run `npm run seed:admin`,
 * then reload the app.
 */

const AUTH_EMULATOR = 'http://localhost:9099';
const FIRESTORE_EMULATOR = 'http://localhost:8080';
const PROJECT_ID = 'demo-home-menu';

const listAccounts = async () => {
  const response = await fetch(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:query`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer owner',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    },
  );

  if (!response.ok) {
    throw new Error(`Auth emulator responded ${String(response.status)}. Is it running?`);
  }

  const body = await response.json();
  return body.userInfo ?? [];
};

const seedAdminProfile = async account => {
  const now = new Date().toISOString();
  const url =
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/` + `users/${account.localId}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer owner',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        displayName: { stringValue: account.displayName ?? 'Emulator Admin' },
        email: { stringValue: account.email ?? 'admin@example.test' },
        role: { stringValue: 'admin' },
        active: { booleanValue: true },
        createdAt: { timestampValue: now },
        updatedAt: { timestampValue: now },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Firestore emulator responded ${String(response.status)} for uid ${account.localId}.`);
  }
};

const main = async () => {
  const accounts = await listAccounts();

  if (accounts.length === 0) {
    console.log(
      'No accounts in the Auth emulator yet. Sign in once in the app ' +
        '(http://localhost:5173) with a fake emulator account, then rerun.',
    );
    return;
  }

  for (const account of accounts) {
    await seedAdminProfile(account);
    console.log(`Seeded active admin profile for ${account.email} (${account.localId}).`);
  }
};

await main();
