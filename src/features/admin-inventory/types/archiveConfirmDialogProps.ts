export interface ArchiveConfirmDialogProps {
  open: boolean;
  ingredientName: string;
  onConfirm: () => void;
  onCancel: () => void;
}
