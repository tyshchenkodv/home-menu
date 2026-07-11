import { describe, expect, it } from 'vitest';
import { isBatchExpired } from '../expiration';

describe('isBatchExpired', () => {
  it('is false when expiresAt is null', () => {
    expect(isBatchExpired(null, { toMillis: () => 1000 })).toBe(false);
  });

  it('is false when expiresAt is in the future', () => {
    expect(isBatchExpired({ toMillis: () => 2000 }, { toMillis: () => 1000 })).toBe(false);
  });

  it('is false when expiresAt equals now', () => {
    expect(isBatchExpired({ toMillis: () => 1000 }, { toMillis: () => 1000 })).toBe(false);
  });

  it('is true when expiresAt is in the past', () => {
    expect(isBatchExpired({ toMillis: () => 500 }, { toMillis: () => 1000 })).toBe(true);
  });
});
