export interface ReserveDialogProps {
  open: boolean;
  dishName: string;
  availableQuantity: number;
  onCancel: () => void;
  onConfirm: (quantity: number) => Promise<void>;
}
