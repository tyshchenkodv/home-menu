import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'user';

/**
 * Mirrors the `users/{uid}` document shape from `docs/03-data-model.md`.
 * The document is provisioned manually; client code never creates it or
 * changes its role.
 */
export interface UserProfile {
  displayName: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
