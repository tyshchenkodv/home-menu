import { doc, getDoc, getFirestore } from 'firebase/firestore';

import { userConverter } from '../converters/userConverter';
import { getFirebaseApp } from '../firebaseApp';
import type { UserProfile } from '../../../shared/types/userProfile';

/**
 * Loads the `users/{uid}` display record (displayName/email). This document
 * is non-authoritative: it is never used to authorize access. Role/active
 * gating comes from the ID token custom claims (see `AuthContext`). Returns
 * `null` when the document does not exist.
 */
export const loadUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const firestore = getFirestore(getFirebaseApp());
  const userDocRef = doc(firestore, 'users', uid).withConverter(userConverter);
  const snapshot = await getDoc(userDocRef);

  return snapshot.exists() ? snapshot.data() : null;
};
