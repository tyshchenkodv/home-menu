import { describe, expect, it } from 'vitest';

import { nextBatchNumber } from '../nextBatchNumber';

describe('nextBatchNumber', () => {
  it('returns 1 when the counter document does not exist yet', () => {
    expect(nextBatchNumber(null)).toBe(1);
  });

  it('returns value + 1 when the counter document already has a value', () => {
    expect(nextBatchNumber({ value: 41 })).toBe(42);
  });

  it('keeps incrementing across gaps left by discarded batches (numbers are never reused)', () => {
    expect(nextBatchNumber({ value: 7 })).toBe(8);
  });
});
