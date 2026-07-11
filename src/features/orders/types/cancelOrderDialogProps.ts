export interface CancelOrderDialogProps {
  open: boolean;
  dishName: string;
  quantity: number;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}
