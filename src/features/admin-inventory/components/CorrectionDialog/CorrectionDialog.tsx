import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { convertToBaseUnit } from '../../../../domain/inventory/convertToBaseUnit';
import { inputUnitsForBaseUnit } from '../../../../domain/inventory/inputUnitsForBaseUnit';
import type { InputUnit } from '../../../../domain/inventory/types';
import { useBottomSheetDialogPaperProps } from '../../../../shared/components/ResponsiveDialog/bottomSheetDialogPaperProps';
import { UNIT_LABEL_KEY } from '../../constants/unitLabelKey';
import { resolveErrorTranslationKey } from '../../errorMessages';
import type { CorrectionDialogProps } from '../../types/correctionDialogProps';
import { styles } from './styles';

/**
 * Correction dialog: an exact observed balance (amount + unit, same family
 * as the ingredient's base unit) plus a required reason. Save stays disabled
 * until the reason is non-empty, matching the append-only movement-log
 * pattern used by `admin-orders`' own correction dialog.
 */
export const CorrectionDialog = ({
  open,
  ingredientName,
  currentQuantityLabel,
  baseUnit,
  onCancel,
  onSubmit,
}: CorrectionDialogProps) => {
  const { t } = useTranslation();
  const paperProps = useBottomSheetDialogPaperProps();
  const units = inputUnitsForBaseUnit(baseUnit);
  const [amountText, setAmountText] = useState('');
  const [inputUnit, setInputUnit] = useState<InputUnit>(units[0] ?? 'g');
  const [reason, setReason] = useState('');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const trimmedReason = reason.trim();
  const isReasonValid = trimmedReason.length > 0;

  const handleSubmit = async () => {
    if (isSubmittingRef.current || !isReasonValid) {
      return;
    }

    setErrorKey(null);

    let exactBalance: number;
    try {
      exactBalance = convertToBaseUnit(Number(amountText.trim()), inputUnit).quantity;
    } catch (error) {
      setErrorKey(resolveErrorTranslationKey(error));
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      await onSubmit(exactBalance, trimmedReason);
    } catch (error) {
      setErrorKey(resolveErrorTranslationKey(error));
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      fullWidth
      maxWidth="xs"
      aria-labelledby="correction-dialog-title"
      slotProps={{ paper: paperProps }}
    >
      <DialogTitle id="correction-dialog-title">{t('inventory.correction.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={styles.content}>
          <DialogContentText>
            {t('inventory.correction.context', { name: ingredientName, current: currentQuantityLabel })}
          </DialogContentText>
          <Stack direction="row" spacing={2}>
            <TextField
              label={t('inventory.correction.newQuantityLabel')}
              value={amountText}
              onChange={event => {
                setAmountText(event.target.value);
              }}
              fullWidth
            />
            <TextField
              select
              label={t('inventory.form.unitLabel')}
              value={inputUnit}
              onChange={event => {
                setInputUnit(event.target.value as InputUnit);
              }}
              slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
              sx={styles.unitField}
            >
              {units.map(unit => (
                <option key={unit} value={unit}>
                  {t(UNIT_LABEL_KEY[unit])}
                </option>
              ))}
            </TextField>
          </Stack>
          <TextField
            label={t('inventory.correction.reasonLabel')}
            placeholder={t('inventory.correction.reasonPlaceholder')}
            value={reason}
            onChange={event => {
              setReason(event.target.value);
            }}
            helperText={
              reason.length > 0 && !isReasonValid
                ? t('validation.correctionReasonRequired')
                : t('inventory.correction.helper')
            }
            error={reason.length > 0 && !isReasonValid}
            fullWidth
            multiline
          />
          {errorKey && <Typography color="error">{t(errorKey)}</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button onClick={() => void handleSubmit()} variant="contained" disabled={isSubmitting || !isReasonValid}>
          {isSubmitting ? t('common.saving') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
