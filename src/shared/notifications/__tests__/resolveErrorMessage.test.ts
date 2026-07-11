import { FirebaseError } from 'firebase/app';
import { describe, expect, it } from 'vitest';

import { resolveErrorMessageKey } from '../resolveErrorMessage';

describe('resolveErrorMessageKey', () => {
  it.each([
    ['permission-denied', 'error.toast.permission'],
    ['unauthenticated', 'error.toast.permission'],
    ['auth/insufficient-permission', 'error.toast.permission'],
    ['failed-precondition', 'error.toast.notReady'],
    ['unavailable', 'error.toast.network'],
    ['auth/network-request-failed', 'error.toast.network'],
    ['resource-exhausted', 'error.toast.quota'],
  ])('maps Firebase code %s to %s', (code, expected) => {
    expect(resolveErrorMessageKey(new FirebaseError(code, 'raw internal detail'))).toBe(expected);
  });

  it('falls back to the generic key for an unmapped Firebase code', () => {
    expect(resolveErrorMessageKey(new FirebaseError('internal', 'boom'))).toBe('error.toast.generic');
  });

  it('falls back to the generic key for a plain Error', () => {
    expect(resolveErrorMessageKey(new Error('plain'))).toBe('error.toast.generic');
  });

  it('falls back to the generic key for non-error values', () => {
    expect(resolveErrorMessageKey('a string')).toBe('error.toast.generic');
    expect(resolveErrorMessageKey(null)).toBe('error.toast.generic');
    expect(resolveErrorMessageKey(undefined)).toBe('error.toast.generic');
  });

  it('never returns the raw error message text', () => {
    const key = resolveErrorMessageKey(new FirebaseError('failed-precondition', '{"query":"needs index"}'));

    expect(key).toBe('error.toast.notReady');
    expect(key).not.toContain('query');
  });
});
