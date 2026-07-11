import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ArchiveDishDialogProps } from '../../types/archiveDishDialogProps';

/** Confirmation dialog required before archiving a dish (05e·7). */
export const ArchiveDishDialog = ({ open, dishName, onConfirm, onCancel }: ArchiveDishDialogProps) => {
  const { t } = useTranslation();

  // Retain the last non-empty dish name so the body text does not flash an
  // empty «» while the dialog plays its close transition (the caller clears
  // the target to null on close). Adjust state during render on prop change.
  const [displayName, setDisplayName] = useState(dishName);
  if (dishName !== '' && dishName !== displayName) {
    setDisplayName(dishName);
  }

  return (
    <Dialog open={open} onClose={onCancel} aria-labelledby="archive-dish-title">
      <DialogTitle id="archive-dish-title">{t('dishes.archiveDialog.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('dishes.archiveDialog.body', { dish: displayName })}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('dishes.archiveDialog.keep')}</Button>
        <Button onClick={onConfirm} color="warning" variant="contained">
          {t('dishes.archiveDialog.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
