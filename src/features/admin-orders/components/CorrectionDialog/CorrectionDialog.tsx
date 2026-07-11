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

import { resolveErrorTranslationKey } from '../../errorMessages';
import type { CorrectionDialogProps } from '../../types/correctionDialogProps';
import { styles } from './styles';

/**
 * Admin-audited correction dialog with a REQUIRED reason
 * (`docs/design/screens/admin-orders.md`/`shared-patterns.md` dialog 4
 * pattern, reused here for `orderTransactions.correctOrder`): cancels the
 * order from any non-terminal status and restores any reserved allocation.
 * Save stays disabled until the reason is non-empty.
 */
export const CorrectionDialog = ({
  open,
  dishName,
  requesterName,
  quantity,
  dateLabel,
  onCancel,
  onConfirm,
}: CorrectionDialogProps) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const trimmedReason = reason.trim();
  const isValid = trimmedReason.length > 0;

  const handleConfirm = async () => {
    if (isSubmitting || !isValid) {
      return;
    }
    setErrorKey(null);
    setIsSubmitting(true);
    try {
      await onConfirm(trimmedReason);
    } catch (error) {
      setErrorKey(resolveErrorTranslationKey(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} aria-labelledby="correction-dialog-title" fullWidth>
      <DialogTitle id="correction-dialog-title">{t('orders.admin.correction.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('orders.admin.correction.context', {
            dish: dishName,
            requester: requesterName,
            count: quantity,
            date: dateLabel,
          })}
        </DialogContentText>
        <TextField
          multiline
          required
          fullWidth
          minRows={2}
          sx={styles.reasonField}
          label={t('orders.admin.correction.reasonLabel')}
          placeholder={t('orders.admin.correction.reasonPlaceholder')}
          helperText={
            reason.length > 0 && !isValid
              ? t('validation.correctionReasonRequired')
              : t('orders.admin.correction.helper')
          }
          error={reason.length > 0 && !isValid}
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
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => void handleConfirm()}
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? t('common.saving') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
