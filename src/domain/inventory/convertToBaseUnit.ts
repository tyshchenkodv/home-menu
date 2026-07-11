import { InventoryDomainError } from './errors';
import type { BaseUnit, InputUnit } from './types';

export interface ConvertedQuantity {
  baseUnit: BaseUnit;
  quantity: number;
}

const CONVERSION_FACTORS: Partial<Record<InputUnit, { baseUnit: BaseUnit; factor: number }>> = {
  g: { baseUnit: 'gram', factor: 1 },
  kg: { baseUnit: 'gram', factor: 1000 },
  ml: { baseUnit: 'milliliter', factor: 1 },
  l: { baseUnit: 'milliliter', factor: 1000 },
  pieces: { baseUnit: 'piece', factor: 1 },
};

/**
 * Converts a user-entered quantity in a friendly input unit to the
 * canonical base unit and value persisted on the ingredient document.
 */
export function convertToBaseUnit(amount: number, inputUnit: InputUnit): ConvertedQuantity {
  const conversion = CONVERSION_FACTORS[inputUnit];

  if (!conversion) {
    throw new InventoryDomainError('INVALID_UNIT', `Unknown input unit: ${inputUnit}`);
  }

  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
    throw new InventoryDomainError('INVALID_AMOUNT', `Invalid quantity amount: ${String(amount)}`);
  }

  return {
    baseUnit: conversion.baseUnit,
    quantity: amount * conversion.factor,
  };
}
