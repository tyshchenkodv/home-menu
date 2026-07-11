import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore';

import type { UserProfile } from '../../../shared/types/userProfile';

/** Typed read/write mapping for `users/{uid}` documents. */
export const userConverter: FirestoreDataConverter<UserProfile> = {
  toFirestore(profile: UserProfile) {
    return profile;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): UserProfile {
    const data = snapshot.data(options);

    return {
      displayName: data.displayName as string,
      email: data.email as string,
      role: data.role as UserProfile['role'],
      active: data.active as boolean,
      createdAt: data.createdAt as Timestamp,
      updatedAt: data.updatedAt as Timestamp,
    };
  },
};
