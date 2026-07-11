import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';

import { getFirebaseApp } from './firebaseApp';

const getFirebaseAuth = () => getAuth(getFirebaseApp());

/**
 * Signs the current visitor in with an email and password and returns the
 * resulting Firebase Auth user. The account must already exist in Firebase
 * Auth — the client never creates accounts or resets passwords.
 */
export const signInWithEmailAndPassword = async (email: string, password: string): Promise<User> => {
  const credential = await firebaseSignInWithEmailAndPassword(getFirebaseAuth(), email, password);

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
