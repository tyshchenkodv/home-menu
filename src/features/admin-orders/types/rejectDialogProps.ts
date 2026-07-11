export interface RejectDialogProps {
  open: boolean;
  dishName: string;
  requesterName: string;
  quantity: number;
  dateLabel: string;
  onCancel: () => void;
  onConfirm: (reason: string | null) => Promise<void>;
}
