import { describe, expect, it } from 'vitest';

import { formatBatchNumber } from '../formatBatchNumber';

describe('formatBatchNumber', () => {
  it('pads a single-digit number to 3 digits', () => {
    expect(formatBatchNumber(1)).toBe('001');
  });

  it('pads a two-digit number to 3 digits', () => {
    expect(formatBatchNumber(42)).toBe('042');
  });

  it('does not truncate a number wider than 3 digits', () => {
    expect(formatBatchNumber(1234)).toBe('1234');
  });
});
