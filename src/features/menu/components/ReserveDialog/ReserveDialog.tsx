import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
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

import { useBottomSheetDialogPaperProps } from '../../../../shared/components/ResponsiveDialog/bottomSheetDialogPaperProps';
import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';
import { resolveErrorTranslationKey } from '../../errorMessages';
import type { ReserveDialogProps } from '../../types/reserveDialogProps';
import { styles } from './styles';

interface ReservationFailure {
  translationKey: string;
  available: number;
  requested: number;
}

/**
 * Reservation confirmation dialog (`docs/design/screens/menu-browse.md`
 * dialog 05e·1): a quantity stepper bounded by `1..availableQuantity`
 * (SPEC rule 3, "additionally bounded by total available prepared portions
 * for ready orders"), confirming via `reserveReadyOrder`.
 */
export const ReserveDialog = ({
  open,
  dishName,
  availableQuantity,
  mealType,
  dateLabel,
  onCancel,
  onConfirm,
}: ReserveDialogProps) => {
  const { t } = useTranslation();
  const paperProps = useBottomSheetDialogPaperProps();
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failure, setFailure] = useState<ReservationFailure | null>(null);

  const atMax = quantity >= availableQuantity;
  const atMin = quantity <= 1;

  const handleConfirm = async () => {
    if (isSubmitting) {
      return;
    }
    setFailure(null);
    setIsSubmitting(true);
    try {
      await onConfirm(quantity);
    } catch (error) {
      // Best-known local values at the moment of the race (the actual live
      // remaining count is not returned by the transaction error; see
      // menu-browse.md "reservation flow states · error").
      setFailure({
        translationKey: resolveErrorTranslationKey(error),
        available: availableQuantity,
        requested: quantity,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (failure) {
    return (
      <Dialog open={open} onClose={onCancel} aria-labelledby="reserve-dialog-title" slotProps={{ paper: paperProps }}>
        <DialogTitle id="reserve-dialog-title">{t('menu.reservation.title')}</DialogTitle>
        <DialogContent>
          <StatePlaceholder
            variant="confused"
            title={t('menu.reservation.error.title')}
            message={t(failure.translationKey, { available: failure.available, requested: failure.requested })}
            action={{ label: t('menu.reservation.error.refresh'), onClick: onCancel }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onCancel} aria-labelledby="reserve-dialog-title" slotProps={{ paper: paperProps }}>
      <DialogTitle id="reserve-dialog-title">
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <span>{t('menu.reservation.title')}</span>
          <Chip size="small" label={t(`common.meals.${mealType}`)} />
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography color="text.secondary">
            {t('menu.reservation.subtitle', {
              dish: dishName,
              date: dateLabel,
              count: availableQuantity,
              portionsWord: t('menu.reservation.portionsWord', { count: availableQuantity }),
            })}
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
            <Typography variant="caption" color="secondary.main" sx={styles.helper}>
              {t('menu.reservation.helper', { count: quantity, total: availableQuantity })}
            </Typography>
            {atMax && (
              <Typography variant="caption" color="error.main">
                {t('validation.reservationMax', { max: availableQuantity })}
              </Typography>
            )}
          </Stack>
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
