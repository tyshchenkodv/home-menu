import type { BaseUnit } from '../../../domain/inventory/types';

export interface RestockDialogProps {
  open: boolean;
  ingredientName: string;
  baseUnit: BaseUnit;
  onCancel: () => void;
  onSubmit: (deltaQuantity: number) => Promise<void>;
}
