export interface CompleteCookingResult {
  actualYield: number;
  preparedAtMillis: number;
  expiresAtMillis: number | null;
}

export interface CompleteCookingDialogProps {
  open: boolean;
  dishName: string;
  requesterName: string;
  requestedQuantity: number;
  onCancel: () => void;
  onConfirm: (result: CompleteCookingResult) => Promise<void>;
}
