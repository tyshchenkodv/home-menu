import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useTranslation } from 'react-i18next';

import type { ArchiveConfirmDialogProps } from '../../types/archiveConfirmDialogProps';

/** Confirmation dialog required before archiving an ingredient. */
export const ArchiveConfirmDialog = ({ open, ingredientName, onConfirm, onCancel }: ArchiveConfirmDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onCancel} aria-labelledby="archive-confirm-title">
      <DialogTitle id="archive-confirm-title">{t('inventory.archiveDialog.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('inventory.archiveDialog.message', { name: ingredientName })}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('inventory.archiveDialog.cancel')}</Button>
        <Button onClick={onConfirm} color="warning" variant="contained">
          {t('inventory.archiveDialog.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
