import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { resolveErrorTranslationKey } from '../../errorMessages';
import type { ReserveDialogProps } from '../../types/reserveDialogProps';
import { styles } from './styles';

/**
 * Reservation confirmation dialog (`docs/design/screens/menu-browse.md`
 * dialog 05e·1): a quantity stepper bounded by `1..availableQuantity`
 * (SPEC rule 3, "additionally bounded by total available prepared portions
 * for ready orders"), confirming via `reserveReadyOrder`.
 */
export const ReserveDialog = ({ open, dishName, availableQuantity, onCancel, onConfirm }: ReserveDialogProps) => {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const atMax = quantity >= availableQuantity;
  const atMin = quantity <= 1;

  const handleConfirm = async () => {
    if (isSubmitting) {
      return;
    }
    setErrorKey(null);
    setIsSubmitting(true);
    try {
      await onConfirm(quantity);
    } catch (error) {
      setErrorKey(resolveErrorTranslationKey(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} aria-labelledby="reserve-dialog-title">
      <DialogTitle id="reserve-dialog-title">{t('menu.reservation.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography color="text.secondary">
            {t('menu.reservation.subtitle', { dish: dishName, date: '', count: availableQuantity })}
          </Typography>

          <Stack spacing={1}>
            <Typography variant="subtitle2">{t('menu.reservation.portionsLabel')}</Typography>
            <Stack direction="row" spacing={2} sx={styles.stepperRow}>
              <IconButton
                aria-label={t('common.cancel')}
                disabled={atMin}
                onClick={() => {
                  setQuantity(current => Math.max(1, current - 1));
                }}
              >
                <RemoveIcon />
              </IconButton>
              <Typography variant="h4" aria-live="polite">
                {quantity}
              </Typography>
              <IconButton
                aria-label={t('menu.reservation.portionsLabel')}
                disabled={atMax}
                onClick={() => {
                  setQuantity(current => Math.min(availableQuantity, current + 1));
                }}
              >
                <AddIcon />
              </IconButton>
            </Stack>
            {atMax && (
              <Typography variant="caption" color="error.main">
                {t('validation.reservationMax', { max: availableQuantity })}
              </Typography>
            )}
          </Stack>

          {errorKey && <Typography color="error.main">{t(errorKey)}</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={() => void handleConfirm()} disabled={isSubmitting}>
          {isSubmitting ? t('menu.reservation.submitting') : t('menu.reservation.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
