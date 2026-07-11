import { describe, expect, it } from 'vitest';
import { OrderDomainError } from '../errors';
import { buildScheduledForMillis, isDateWithinOrderableWindow, isValidOrderQuantity } from '../scheduledFor';

function expectCode(fn: () => void, code: string) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(OrderDomainError);
    expect((error as OrderDomainError).code).toBe(code);
    return;
  }
  throw new Error(`expected to throw ${code}`);
}

describe('buildScheduledForMillis', () => {
  it('builds a UTC instant for a Europe/Kyiv winter date and time (EET, UTC+2)', () => {
    const millis = buildScheduledForMillis({ year: 2026, month: 1, day: 15 }, '08:00');

    expect(new Date(millis).toISOString()).toBe('2026-01-15T06:00:00.000Z');
  });

  it('builds a UTC instant for a Europe/Kyiv summer date and time (EEST, UTC+3)', () => {
    const millis = buildScheduledForMillis({ year: 2026, month: 7, day: 15 }, '19:00');

    expect(new Date(millis).toISOString()).toBe('2026-07-15T16:00:00.000Z');
  });

  it('rejects a malformed meal time', () => {
    expectCode(() => buildScheduledForMillis({ year: 2026, month: 7, day: 15 }, '9:00'), 'order/invalid-meal-time');
    expectCode(() => buildScheduledForMillis({ year: 2026, month: 7, day: 15 }, '25:00'), 'order/invalid-meal-time');
    expectCode(() => buildScheduledForMillis({ year: 2026, month: 7, day: 15 }, '08:60'), 'order/invalid-meal-time');
    expectCode(() => buildScheduledForMillis({ year: 2026, month: 7, day: 15 }, 'bogus'), 'order/invalid-meal-time');
  });
});

describe('isDateWithinOrderableWindow', () => {
  const today = { year: 2026, month: 7, day: 11 };

  it('accepts today', () => {
    expect(isDateWithinOrderableWindow(today, today)).toBe(true);
  });

  it('accepts today + 7 days', () => {
    expect(isDateWithinOrderableWindow({ year: 2026, month: 7, day: 18 }, today)).toBe(true);
  });

  it('rejects today + 8 days', () => {
    expect(isDateWithinOrderableWindow({ year: 2026, month: 7, day: 19 }, today)).toBe(false);
  });

  it('rejects a date before today', () => {
    expect(isDateWithinOrderableWindow({ year: 2026, month: 7, day: 10 }, today)).toBe(false);
  });

  it('handles a month boundary correctly', () => {
    const endOfMonth = { year: 2026, month: 7, day: 30 };
    expect(isDateWithinOrderableWindow({ year: 2026, month: 8, day: 6 }, endOfMonth)).toBe(true);
    expect(isDateWithinOrderableWindow({ year: 2026, month: 8, day: 7 }, endOfMonth)).toBe(false);
  });
});

describe('isValidOrderQuantity', () => {
  it('accepts integers from 1 to 99', () => {
    expect(isValidOrderQuantity(1)).toBe(true);
    expect(isValidOrderQuantity(99)).toBe(true);
    expect(isValidOrderQuantity(50)).toBe(true);
  });

  it('rejects 0 and negative numbers', () => {
    expect(isValidOrderQuantity(0)).toBe(false);
    expect(isValidOrderQuantity(-1)).toBe(false);
  });

  it('rejects values above 99', () => {
    expect(isValidOrderQuantity(100)).toBe(false);
  });

  it('rejects non-integers', () => {
    expect(isValidOrderQuantity(1.5)).toBe(false);
  });
});
