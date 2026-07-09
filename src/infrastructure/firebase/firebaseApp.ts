import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number];

let cachedApp: FirebaseApp | null = null;

const readFirebaseConfig = (): Record<RequiredEnvVar, string> => {
  const env = import.meta.env;
  const missing: RequiredEnvVar[] = [];
  const values = {} as Record<RequiredEnvVar, string>;

  for (const key of REQUIRED_ENV_VARS) {
    const value = env[key];

    if (!value) {
      missing.push(key);
      continue;
    }

    values[key] = value;
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase environment variable(s): ${missing.join(', ')}. ` +
        'Define them in .env.local (see README for the variable names).',
    );
  }

  return values;
};

/**
 * Lazily initializes (or reuses) the Firebase App instance. Reading
 * environment variables and calling `initializeApp` only happens on first
 * use, so importing this module never touches Firebase or fails tests that
 * do not exercise auth/Firestore behavior.
 */
export const getFirebaseApp = (): FirebaseApp => {
  if (cachedApp) {
    return cachedApp;
  }

  const existingApp = getApps().at(0);

  if (existingApp) {
    cachedApp = existingApp;
    return cachedApp;
  }

  const config = readFirebaseConfig();

  const app = initializeApp({
    apiKey: config.VITE_FIREBASE_API_KEY,
    authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: config.VITE_FIREBASE_PROJECT_ID,
    appId: config.VITE_FIREBASE_APP_ID,
  });

  if (import.meta.env.VITE_USE_EMULATORS === 'true') {
    connectToEmulators(app);
  }

  cachedApp = app;
  return cachedApp;
};

/**
 * Points Auth and Firestore at the local Firebase Emulator Suite (see
 * `docker/firebase-emulators/`). This is a development-only wiring toggled by
 * an explicit `VITE_USE_EMULATORS=true` in the untracked `.env.local`; it is
 * not an authentication bypass — the same sign-in flow and Security Rules run
 * inside the emulators.
 */
const connectToEmulators = (app: FirebaseApp): void => {
  connectAuthEmulator(getAuth(app), 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(getFirestore(app), 'localhost', 8080);
};
