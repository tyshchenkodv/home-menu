import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { resolveErrorTranslationKey } from '../../errorMessages';
import type { CookingRequestDialogProps } from '../../types/cookingRequestDialogProps';
import { formatCalendarDateLabel } from '../../utils/formatCalendarDate';
import { styles } from './styles';

const MAX_QUANTITY = 99;

/**
 * Cooking-request creation dialog (`docs/design/screens/cooking-request.md`
 * dialog 05e·2). The dish, date, and meal are pre-selected from the Menu
 * card that opened it (docs/04 "Cooking request lifecycle" — creates a
 * `pending` order with `kind: 'cook'`); only the portion count is entered
 * here, per the resolved "dialog is dish-bound" decision. The date and meal
 * are rendered read-only (QA MAJOR #6) using the same locale formatting as
 * `DateMealSelector`, via the shared `formatCalendarDateLabel` util.
 */
export const CookingRequestDialog = ({
  open,
  dishName,
  date,
  mealType,
  onCancel,
  onConfirm,
}: CookingRequestDialogProps) => {
  const { t, i18n } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const atMax = quantity >= MAX_QUANTITY;
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
    <Dialog open={open} onClose={onCancel} aria-labelledby="cooking-request-dialog-title">
      <DialogTitle id="cooking-request-dialog-title">{t('requests.dialog.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography color="text.secondary">{dishName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {`${formatCalendarDateLabel(date, i18n.language)} · ${t(`common.meals.${mealType}`)}`}
          </Typography>

          <Stack spacing={1}>
            <Typography variant="subtitle2">{t('requests.form.portionsLabel')}</Typography>
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
                aria-label={t('requests.form.portionsLabel')}
                disabled={atMax}
                onClick={() => {
                  setQuantity(current => Math.min(MAX_QUANTITY, current + 1));
                }}
              >
                <AddIcon />
              </IconButton>
            </Stack>
          </Stack>

          {errorKey && <Typography color="error.main">{t(errorKey)}</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={() => void handleConfirm()} disabled={isSubmitting}>
          {isSubmitting ? t('requests.form.submitting') : t('requests.form.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
