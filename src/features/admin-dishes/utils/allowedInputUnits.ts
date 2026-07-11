import type { BaseUnit, InputUnit } from '../../../domain/inventory/types';

/**
 * The friendly input units a recipe row may offer for a given ingredient's
 * canonical base unit — the same families `convertToBaseUnit` understands.
 * `presence`-tracked ingredients have no numeric unit at all (empty list);
 * the row shows the "requires presence" state instead.
 */
export function allowedInputUnitsForBaseUnit(baseUnit: BaseUnit): InputUnit[] {
  switch (baseUnit) {
    case 'gram':
      return ['g', 'kg'];
    case 'milliliter':
      return ['ml', 'l'];
    case 'piece':
      return ['pieces'];
    case 'presence':
      return [];
    default:
      return [];
  }
}
