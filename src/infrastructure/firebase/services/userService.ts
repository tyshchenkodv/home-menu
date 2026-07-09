import { doc, getDoc, getFirestore } from 'firebase/firestore';

import { userConverter } from '../converters/userConverter';
import { getFirebaseApp } from '../firebaseApp';
import type { UserProfile } from '../../../shared/types/userProfile';

/**
 * Loads the `users/{uid}` profile document. Returns `null` when the
 * document does not exist (unprovisioned account).
 */
export const loadUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const firestore = getFirestore(getFirebaseApp());
  const userDocRef = doc(firestore, 'users', uid).withConverter(userConverter);
  const snapshot = await getDoc(userDocRef);

  return snapshot.exists() ? snapshot.data() : null;
};
