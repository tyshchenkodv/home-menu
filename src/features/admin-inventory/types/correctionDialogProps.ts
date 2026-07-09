import type { BaseUnit } from '../../../domain/inventory/types';

export interface CorrectionDialogProps {
  open: boolean;
  ingredientName: string;
  baseUnit: BaseUnit;
  onCancel: () => void;
  onSubmit: (exactBalance: number, reason: string) => Promise<void>;
}
