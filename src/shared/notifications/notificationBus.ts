export type NotificationSeverity = 'error' | 'warning' | 'info' | 'success';

export interface AppNotification {
  /**
   * i18n key resolved to text by the provider at render time. Callers pass a
   * key rather than translated text so user-facing strings stay out of
   * non-component code and both locales stay in sync.
   */
  messageKey: string;
  severity: NotificationSeverity;
}

type Listener = (notification: AppNotification) => void;

const listeners = new Set<Listener>();

/**
 * Subscribes a listener (the provider) to published notifications. Returns an
 * unsubscribe function. A module-level bus lets any code — React hooks or
 * plain infrastructure functions — surface a toast without prop drilling or a
 * context dependency.
 */
export const subscribeToNotifications = (listener: Listener): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

/** Publishes a notification to every current listener. */
export const publishNotification = (notification: AppNotification): void => {
  for (const listener of listeners) {
    listener(notification);
  }
};
