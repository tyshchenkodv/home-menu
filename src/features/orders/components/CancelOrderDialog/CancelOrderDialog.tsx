import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { resolveErrorTranslationKey } from '../../errorMessages';
import type { CancelOrderDialogProps } from '../../types/cancelOrderDialogProps';
import { styles } from './styles';

/**
 * Destructive confirmation before cancelling an order
 * (`docs/design/screens/shared-patterns.md` dialog 05e·8): released
 * portions return to the shared batch (the transaction the confirm button
 * triggers is `orderTransactions.cancelOrder`).
 */
export const CancelOrderDialog = ({ open, dishName, quantity, onCancel, onConfirm }: CancelOrderDialogProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (isSubmitting) {
      return;
    }
    setErrorKey(null);
    setIsSubmitting(true);
    try {
      await onConfirm();
    } catch (error) {
      setErrorKey(resolveErrorTranslationKey(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} aria-labelledby="cancel-order-dialog-title">
      <DialogTitle id="cancel-order-dialog-title">{t('orders.cancelDialog.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('orders.cancelDialog.body', { count: quantity, dish: dishName })}</DialogContentText>
        {errorKey && (
          <Typography color="error.main" sx={styles.errorText}>
            {t(errorKey)}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
          {t('orders.cancelDialog.keep')}
        </Button>
        <Button variant="contained" color="error" onClick={() => void handleConfirm()} disabled={isSubmitting}>
          {t('orders.cancelDialog.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
