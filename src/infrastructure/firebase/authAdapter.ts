import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';

import { getFirebaseApp } from './firebaseApp';

const getFirebaseAuth = () => getAuth(getFirebaseApp());

/**
 * Signs the current visitor in with a Google popup and returns the
 * resulting Firebase Auth user.
 */
export const signInWithGoogle = async (): Promise<User> => {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(getFirebaseAuth(), provider);

  return credential.user;
};

/** Signs the current visitor out of Firebase Auth. */
export const signOut = (): Promise<void> => {
  return firebaseSignOut(getFirebaseAuth());
};

/**
 * Wraps `onAuthStateChanged`, invoking `onChange` with the current user (or
 * `null`) whenever the Firebase Auth state changes. Returns an unsubscribe
 * function for effect cleanup.
 */
export const subscribeToAuthState = (onChange: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(getFirebaseAuth(), onChange);
};
