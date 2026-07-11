import { publishNotification, type NotificationSeverity } from './notificationBus';
import { resolveErrorMessageKey } from './resolveErrorMessage';

/**
 * Surfaces a user-facing error toast for any thrown value. Safe to call from
 * anywhere (React hooks, Firestore `onError` callbacks, plain functions); the
 * message is normalized to a translated key, never the raw error text.
 */
export const notifyError = (error: unknown): void => {
  publishNotification({ messageKey: resolveErrorMessageKey(error), severity: 'error' });
};

/** Surfaces a toast for an already-known i18n message key. */
export const notify = (messageKey: string, severity: NotificationSeverity = 'info'): void => {
  publishNotification({ messageKey, severity });
};
