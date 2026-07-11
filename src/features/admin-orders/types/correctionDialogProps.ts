export interface CorrectionDialogProps {
  open: boolean;
  dishName: string;
  requesterName: string;
  quantity: number;
  dateLabel: string;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<void>;
}
