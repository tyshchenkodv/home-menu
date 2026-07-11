import type { MovementType } from '../../../domain/inventory/types';

/** The movement-type filter chips accept every `MovementType` plus an "all" option. */
export type MovementTypeFilterValue = 'all' | MovementType;
