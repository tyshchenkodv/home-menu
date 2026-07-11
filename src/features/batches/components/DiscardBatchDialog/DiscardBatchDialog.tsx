import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { PreparedBatchWithId } from '../../../../shared/types/preparedBatch';
import { styles } from './styles';

interface DiscardBatchDialogProps {
  open: boolean;
  batch: PreparedBatchWithId | null;
  onCancel: () => void;
  onConfirm: (batchId: string) => Promise<void>;
}

/**
 * Destructive confirmation dialog to discard a batch's available remainder.
 * Implements docs/design/screens/admin-batches.md dialog 6.
 */
export const DiscardBatchDialog = ({ open, batch, onCancel, onConfirm }: DiscardBatchDialogProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!batch) return;

    setIsSubmitting(true);
    try {
      await onConfirm(batch.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!batch) return null;

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm">
      <DialogTitle>{t('batches.discardDialog.title')}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={styles.body}>
          <Typography variant="body2" color="textSecondary">
            {t('batches.discardDialog.body', { dish: batch.dishName, count: batch.availableQuantity })}
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} disabled={isSubmitting}>
          {t('common.keep')}
        </Button>
        <Button onClick={() => void handleConfirm()} variant="contained" color="error" disabled={isSubmitting}>
          {isSubmitting ? t('common.saving') : t('batches.discardDialog.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
