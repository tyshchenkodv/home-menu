import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useBottomSheetDialogPaperProps } from '../../../../shared/components/ResponsiveDialog/bottomSheetDialogPaperProps';
import { styles } from './styles';

interface RegisterBatchDialogProps {
  open: boolean;
  dishName: string;
  requesterName: string;
  plannedQuantity: number;
  onCancel: () => void;
  onConfirm: (actualYield: number, preparedAtMillis: number, expiresAtMillis: number | null) => Promise<void>;
}

const currentDatetimeLocal = () => new Date().toISOString().slice(0, 16);

/**
 * Dialog to register a prepared batch with actual yield, prepared date/time,
 * and optional expiration. Implements docs/design/screens/admin-batches.md dialog 5.
 */
export const RegisterBatchDialog = ({
  open,
  dishName,
  requesterName,
  plannedQuantity,
  onCancel,
  onConfirm,
}: RegisterBatchDialogProps) => {
  const { t } = useTranslation();
  const paperProps = useBottomSheetDialogPaperProps();
  const [actualYield, setActualYield] = useState<string>(() => String(plannedQuantity));
  const [preparedAt, setPreparedAt] = useState<string>(currentDatetimeLocal);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset the form fields whenever the dialog transitions from closed to
  // open, following React's "adjusting state when a prop changes" pattern
  // (https://react.dev/learn/you-might-not-need-an-effect) instead of an
  // effect, so this stays a pure render-time computation.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setActualYield(String(plannedQuantity));
      setPreparedAt(currentDatetimeLocal());
      setExpiresAt('');
      setErrors({});
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!actualYield || parseInt(actualYield, 10) <= 0) {
      newErrors.actualYield = t('validation.number');
    }

    if (!expiresAt) {
      newErrors.expiresAt = t('validation.required');
    } else {
      const expiresAtMs = new Date(expiresAt).getTime();
      const nowMs = new Date().getTime();
      if (expiresAtMs < nowMs) {
        newErrors.expiresAt = t('validation.expiryNotInPast');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const preparedAtMs = new Date(preparedAt).getTime();
      const expiresAtMs = expiresAt ? new Date(expiresAt).getTime() : null;
      await onConfirm(parseInt(actualYield, 10), preparedAtMs, expiresAtMs);
    } finally {
      setIsSubmitting(false);
    }
  };

  const actualNum = parseInt(actualYield, 10) || 0;
  const showActualBelowPlan = actualNum > 0 && actualNum < plannedQuantity;

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth slotProps={{ paper: paperProps }}>
      <DialogTitle>{t('batches.registration.title')}</DialogTitle>

      <DialogContent sx={styles.content}>
        <Stack spacing={2}>
          <Typography variant="body2" color="textSecondary">
            {t('batches.registration.context', { dish: dishName, requester: requesterName })}
          </Typography>

          <TextField
            label={t('batches.registration.plannedLabel')}
            value={plannedQuantity}
            disabled
            type="number"
            fullWidth
          />

          <TextField
            label={t('batches.registration.actualLabel')}
            value={actualYield}
            onChange={e => {
              setActualYield(e.target.value);
            }}
            type="number"
            fullWidth
            required
            error={!!errors.actualYield}
            helperText={errors.actualYield}
            onBlur={() => {
              if (!actualYield || parseInt(actualYield, 10) <= 0) {
                setErrors(prev => ({ ...prev, actualYield: t('validation.number') }));
              }
            }}
          />

          {showActualBelowPlan && (
            <Typography variant="caption" color="warning.dark">
              {t('batches.registration.actualBelowPlan')}
            </Typography>
          )}

          <TextField
            label={t('batches.registration.bestBeforeLabel')}
            type="datetime-local"
            value={expiresAt}
            onChange={e => {
              setExpiresAt(e.target.value);
            }}
            fullWidth
            required
            error={!!errors.expiresAt}
            helperText={errors.expiresAt}
            slotProps={{
              inputLabel: { shrink: true },
            }}
            onBlur={() => {
              if (!expiresAt) {
                setErrors(prev => ({ ...prev, expiresAt: t('validation.required') }));
              }
            }}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button onClick={() => void handleSubmit()} variant="contained" color="success" disabled={isSubmitting}>
          {isSubmitting ? t('common.saving') : t('batches.registration.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
