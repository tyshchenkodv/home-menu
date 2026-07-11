import type { MovementTypeFilterValue } from './movementTypeFilterValue';

export interface MovementTypeFilterProps {
  value: MovementTypeFilterValue;
  onChange: (value: MovementTypeFilterValue) => void;
}
