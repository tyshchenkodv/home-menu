import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { resolveErrorTranslationKey } from '../../errorMessages';
import type { CompleteCookingDialogProps } from '../../types/completeCookingDialogProps';
import { styles } from './styles';

/** Formats a millis instant as the value a `datetime-local` input expects, in the local browser timezone. */
function toDatetimeLocalValue(millis: number): string {
  const date = new Date(millis);
  const pad = (value: number) => String(value).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${year}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Batch-registration dialog for `docs/04-business-logic.md` "Completing
 * cooking": actual portion yield, preparation date/time, and an optional
 * expiration date/time — feeds `orderTransactions.completeCooking`. An
 * actual yield below the requested quantity shows an inline error and
 * disables submit rather than only failing server-side, though the
 * transaction re-checks the same rule atomically.
 */
export const CompleteCookingDialog = ({
  open,
  dishName,
  requesterName,
  requestedQuantity,
  onCancel,
  onConfirm,
}: CompleteCookingDialogProps) => {
  const { t } = useTranslation();
  const [actualYield, setActualYield] = useState(String(requestedQuantity));
  const [preparedAt, setPreparedAt] = useState(() => toDatetimeLocalValue(Date.now()));
  const [expiresAt, setExpiresAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const parsedYield = Number(actualYield);
  const isYieldValid = Number.isInteger(parsedYield) && parsedYield >= requestedQuantity;
  const isPreparedAtValid = preparedAt.trim().length > 0;
  const isValid = isYieldValid && isPreparedAtValid;

  const handleConfirm = async () => {
    if (isSubmitting || !isValid) {
      return;
    }
    setErrorKey(null);
    setIsSubmitting(true);
    try {
      await onConfirm({
        actualYield: parsedYield,
        preparedAtMillis: new Date(preparedAt).getTime(),
        expiresAtMillis: expiresAt.trim().length > 0 ? new Date(expiresAt).getTime() : null,
      });
    } catch (error) {
      setErrorKey(resolveErrorTranslationKey(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} aria-labelledby="complete-cooking-dialog-title" fullWidth>
      <DialogTitle id="complete-cooking-dialog-title">{t('orders.admin.completeCooking.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('orders.admin.completeCooking.context', { dish: dishName, requester: requesterName })}
        </DialogContentText>
        <Stack spacing={2} sx={styles.fieldsStack}>
          <TextField
            label={t('orders.admin.completeCooking.plannedLabel')}
            value={requestedQuantity}
            disabled
            fullWidth
          />
          <TextField
            required
            type="number"
            label={t('orders.admin.completeCooking.actualLabel')}
            value={actualYield}
            onChange={event => {
              setActualYield(event.target.value);
            }}
            error={actualYield.length > 0 && !isYieldValid}
            helperText={
              actualYield.length > 0 && !isYieldValid
                ? t('orders.admin.completeCooking.yieldBelowRequested', { requested: requestedQuantity })
                : undefined
            }
            disabled={isSubmitting}
            fullWidth
          />
          <TextField
            required
            type="datetime-local"
            label={t('orders.admin.completeCooking.preparedAtLabel')}
            value={preparedAt}
            onChange={event => {
              setPreparedAt(event.target.value);
            }}
            disabled={isSubmitting}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="datetime-local"
            label={t('orders.admin.completeCooking.bestBeforeLabel')}
            value={expiresAt}
            onChange={event => {
              setExpiresAt(event.target.value);
            }}
            disabled={isSubmitting}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
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
          color="success"
          onClick={() => void handleConfirm()}
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? t('orders.admin.completeCooking.submitting') : t('orders.admin.completeCooking.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
