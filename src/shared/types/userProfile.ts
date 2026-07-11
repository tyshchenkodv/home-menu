import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'user';

/**
 * Mirrors the `users/{uid}` document shape from `docs/03-data-model.md`.
 * The document is provisioned manually by the `firebase-admin` script and
 * client code never creates or changes it. It is a non-authoritative
 * display record (`displayName`/`email`); `role`/`active` are no longer the
 * client's authorization source — that comes from the ID token custom
 * claims read in `AuthContext`. The fields are kept here because the
 * provisioning script may still persist them on the document for reference.
 */
export interface UserProfile {
  displayName: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
