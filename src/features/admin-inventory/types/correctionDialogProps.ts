import type { BaseUnit } from '../../../domain/inventory/types';

export interface CorrectionDialogProps {
  open: boolean;
  ingredientName: string;
  /** Formatted current quantity (amount + unit), e.g. "120 г", shown in the dialog subtitle. */
  currentQuantityLabel: string;
  baseUnit: BaseUnit;
  onCancel: () => void;
  onSubmit: (exactBalance: number, reason: string) => Promise<void>;
}
