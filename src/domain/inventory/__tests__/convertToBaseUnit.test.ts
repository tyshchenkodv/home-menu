import { describe, expect, it } from 'vitest';
import { convertToBaseUnit } from '../convertToBaseUnit';
import { InventoryDomainError } from '../errors';

function expectCode(fn: () => void, code: string) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(InventoryDomainError);
    expect((error as InventoryDomainError).code).toBe(code);
    return;
  }
  throw new Error(`expected convertToBaseUnit to throw ${code}`);
}

describe('convertToBaseUnit', () => {
  it('converts kilograms to grams', () => {
    expect(convertToBaseUnit(1.5, 'kg')).toEqual({ baseUnit: 'gram', quantity: 1500 });
  });

  it('passes grams through unchanged', () => {
    expect(convertToBaseUnit(250, 'g')).toEqual({ baseUnit: 'gram', quantity: 250 });
  });

  it('converts liters to milliliters', () => {
    expect(convertToBaseUnit(2, 'l')).toEqual({ baseUnit: 'milliliter', quantity: 2000 });
  });

  it('passes milliliters through unchanged', () => {
    expect(convertToBaseUnit(330, 'ml')).toEqual({ baseUnit: 'milliliter', quantity: 330 });
  });

  it('passes pieces through unchanged', () => {
    expect(convertToBaseUnit(4, 'pieces')).toEqual({ baseUnit: 'piece', quantity: 4 });
  });

  it('rejects NaN', () => {
    expectCode(() => convertToBaseUnit(Number.NaN, 'g'), 'INVALID_AMOUNT');
  });

  it('rejects Infinity', () => {
    expectCode(() => convertToBaseUnit(Number.POSITIVE_INFINITY, 'g'), 'INVALID_AMOUNT');
  });

  it('rejects negative amounts', () => {
    expectCode(() => convertToBaseUnit(-1, 'g'), 'INVALID_AMOUNT');
  });

  it('rejects an unknown input unit', () => {
    expectCode(() => convertToBaseUnit(1, 'oz' as unknown as 'g'), 'INVALID_UNIT');
  });
});
