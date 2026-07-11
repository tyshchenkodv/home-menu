import { FirebaseError } from 'firebase/app';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { subscribeToNotifications, type AppNotification } from '../notificationBus';
import { notify, notifyError } from '../notify';

describe('notification bus', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delivers published notifications to a subscriber', () => {
    const received: AppNotification[] = [];
    const unsubscribe = subscribeToNotifications(notification => received.push(notification));

    notify('some.key', 'success');

    expect(received).toEqual([{ messageKey: 'some.key', severity: 'success' }]);
    unsubscribe();
  });

  it('stops delivering after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToNotifications(listener);

    unsubscribe();
    notify('some.key');

    expect(listener).not.toHaveBeenCalled();
  });

  it('defaults notify severity to info', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToNotifications(listener);

    notify('some.key');

    expect(listener).toHaveBeenCalledWith({ messageKey: 'some.key', severity: 'info' });
    unsubscribe();
  });

  it('notifyError publishes the normalized key with error severity', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToNotifications(listener);

    notifyError(new FirebaseError('failed-precondition', 'raw internal detail'));

    expect(listener).toHaveBeenCalledWith({ messageKey: 'error.toast.notReady', severity: 'error' });
    unsubscribe();
  });

  it('notifyError normalizes unknown errors to the generic key', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToNotifications(listener);

    notifyError(new Error('plain'));

    expect(listener).toHaveBeenCalledWith({ messageKey: 'error.toast.generic', severity: 'error' });
    unsubscribe();
  });
});
