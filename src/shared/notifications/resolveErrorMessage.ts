import { FirebaseError } from 'firebase/app';

/**
 * Maps any thrown value to a safe i18n key for user display. Never returns the
 * raw error text, so Firebase/Firestore internals — error codes, JSON payloads,
 * stack traces — never reach the UI. Unknown errors fall back to a generic
 * message. The notification provider translates the returned key.
 */
export const resolveErrorMessageKey = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
      case 'unauthenticated':
      case 'auth/insufficient-permission':
        return 'error.toast.permission';
      case 'failed-precondition':
        return 'error.toast.notReady';
      case 'unavailable':
      case 'auth/network-request-failed':
        return 'error.toast.network';
      case 'resource-exhausted':
        return 'error.toast.quota';
      default:
        return 'error.toast.generic';
    }
  }

  return 'error.toast.generic';
};
