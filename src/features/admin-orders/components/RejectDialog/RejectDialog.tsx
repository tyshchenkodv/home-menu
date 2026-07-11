import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useBottomSheetDialogPaperProps } from '../../../../shared/components/ResponsiveDialog/bottomSheetDialogPaperProps';
import { resolveErrorTranslationKey } from '../../errorMessages';
import type { RejectDialogProps } from '../../types/rejectDialogProps';
import { styles } from './styles';

/**
 * Rejection dialog with an optional reason
 * (`docs/design/screens/admin-orders.md` dialog 3): the reason, if given, is
 * visible to the requester on their own order card.
 */
export const RejectDialog = ({
  open,
  dishName,
  requesterName,
  quantity,
  dateLabel,
  onCancel,
  onConfirm,
}: RejectDialogProps) => {
  const { t } = useTranslation();
  const paperProps = useBottomSheetDialogPaperProps();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (isSubmitting) {
      return;
    }
    setErrorKey(null);
    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim().length > 0 ? reason.trim() : null);
    } catch (error) {
      setErrorKey(resolveErrorTranslationKey(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="reject-dialog-title"
      fullWidth
      slotProps={{ paper: paperProps }}
    >
      <DialogTitle id="reject-dialog-title">{t('orders.admin.rejection.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('orders.admin.rejection.context', {
            dish: dishName,
            requester: requesterName,
            count: quantity,
            date: dateLabel,
          })}
        </DialogContentText>
        <TextField
          multiline
          fullWidth
          minRows={2}
          sx={styles.reasonField}
          label={t('orders.admin.rejection.reasonLabel')}
          helperText={t('orders.admin.rejection.helper')}
          value={reason}
          onChange={event => {
            setReason(event.target.value);
          }}
          disabled={isSubmitting}
        />
        {errorKey && (
          <Typography color="error.main" sx={styles.errorText}>
            {t(errorKey)}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
          {t('common.back')}
        </Button>
        <Button variant="contained" color="error" onClick={() => void handleConfirm()} disabled={isSubmitting}>
          {t('orders.admin.actions.reject')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
