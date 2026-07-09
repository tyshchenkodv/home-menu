import type { BaseUnit, InputUnit } from './types';

const UNITS_BY_BASE_UNIT: Record<BaseUnit, InputUnit[]> = {
  gram: ['g', 'kg'],
  milliliter: ['ml', 'l'],
  piece: ['pieces'],
  presence: [],
};

/**
 * The friendly input units an amount field should offer for a given
 * canonical base unit family, e.g. a `gram` ingredient offers g/kg. Shared by
 * the create form and the restock/correction dialogs so the same family is
 * offered everywhere a quantity is entered.
 */
export function inputUnitsForBaseUnit(baseUnit: BaseUnit): InputUnit[] {
  return UNITS_BY_BASE_UNIT[baseUnit];
}
