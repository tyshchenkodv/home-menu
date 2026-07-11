export interface ArchiveDishDialogProps {
  open: boolean;
  dishName: string;
  onConfirm: () => void;
  onCancel: () => void;
}
