import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { convertToBaseUnit } from '../../../domain/inventory/convertToBaseUnit';
import { InventoryDomainError } from '../../../domain/inventory/errors';
import { inputUnitsForBaseUnit } from '../../../domain/inventory/inputUnitsForBaseUnit';
import type { BaseUnit, InputUnit } from '../../../domain/inventory/types';
import { resolveErrorTranslationKey } from '../errorMessages';

const UNIT_LABEL_KEY: Record<InputUnit, string> = {
  g: 'inventory.form.unitG',
  kg: 'inventory.form.unitKg',
  ml: 'inventory.form.unitMl',
  l: 'inventory.form.unitL',
  pieces: 'inventory.form.unitPieces',
};

interface CorrectionDialogProps {
  open: boolean;
  ingredientName: string;
  baseUnit: BaseUnit;
  onCancel: () => void;
  onSubmit: (exactBalance: number, reason: string) => Promise<void>;
}

/**
 * Correction dialog: an exact observed balance (amount + unit, same family
 * as the ingredient's base unit) plus a required reason. The reason is
 * validated client-side before the service is ever called, reusing the
 * domain `INVALID_REASON` code so the message matches the infrastructure
 * layer's own re-validation.
 */
export const CorrectionDialog = ({ open, ingredientName, baseUnit, onCancel, onSubmit }: CorrectionDialogProps) => {
  const { t } = useTranslation();
  const units = inputUnitsForBaseUnit(baseUnit);
  const [amountText, setAmountText] = useState('');
  const [inputUnit, setInputUnit] = useState<InputUnit>(units[0] ?? 'g');
  const [reason, setReason] = useState('');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const handleSubmit = async () => {
    if (isSubmittingRef.current) {
      return;
    }

    setErrorKey(null);

    let exactBalance: number;
    let trimmedReason: string;
    try {
      exactBalance = convertToBaseUnit(Number(amountText.trim()), inputUnit).quantity;
      trimmedReason = reason.trim();
      if (trimmedReason.length === 0) {
        throw new InventoryDomainError('INVALID_REASON');
      }
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
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs" aria-labelledby="correction-dialog-title">
      <DialogTitle id="correction-dialog-title">
        {t('inventory.correctionDialog.title', { name: ingredientName })}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Stack direction="row" spacing={2}>
            <TextField
              label={t('inventory.correctionDialog.amountLabel')}
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
              sx={{ minWidth: 96 }}
            >
              {units.map(unit => (
                <option key={unit} value={unit}>
                  {t(UNIT_LABEL_KEY[unit])}
                </option>
              ))}
            </TextField>
          </Stack>
          <TextField
            label={t('inventory.correctionDialog.reasonLabel')}
            value={reason}
            onChange={event => {
              setReason(event.target.value);
            }}
            fullWidth
            multiline
          />
          {errorKey && <Typography color="error">{t(errorKey)}</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isSubmitting}>
          {t('inventory.actions.cancel')}
        </Button>
        <Button onClick={() => void handleSubmit()} variant="contained" disabled={isSubmitting}>
          {t('inventory.correctionDialog.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
