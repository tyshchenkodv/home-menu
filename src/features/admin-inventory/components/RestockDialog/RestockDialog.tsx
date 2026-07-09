import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { KeyboardEvent } from 'react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { convertToBaseUnit } from '../../../../domain/inventory/convertToBaseUnit';
import { InventoryDomainError } from '../../../../domain/inventory/errors';
import { inputUnitsForBaseUnit } from '../../../../domain/inventory/inputUnitsForBaseUnit';
import type { InputUnit } from '../../../../domain/inventory/types';
import { UNIT_LABEL_KEY } from '../../constants/unitLabelKey';
import { resolveErrorTranslationKey } from '../../errorMessages';
import type { RestockDialogProps } from '../../types/restockDialogProps';
import { styles } from './styles';

/** Restock dialog: an amount + unit consistent with the ingredient's base unit family, converted to a canonical positive delta. */
export const RestockDialog = ({ open, ingredientName, baseUnit, onCancel, onSubmit }: RestockDialogProps) => {
  const { t } = useTranslation();
  const units = inputUnitsForBaseUnit(baseUnit);
  const [amountText, setAmountText] = useState('');
  const [inputUnit, setInputUnit] = useState<InputUnit>(units[0] ?? 'g');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const handleSubmit = async () => {
    if (isSubmittingRef.current) {
      return;
    }

    setErrorKey(null);

    let deltaQuantity: number;
    try {
      const converted = convertToBaseUnit(Number(amountText.trim()), inputUnit);
      if (converted.quantity <= 0) {
        throw new InventoryDomainError('INVALID_QUANTITY');
      }
      deltaQuantity = converted.quantity;
    } catch (error) {
      setErrorKey(resolveErrorTranslationKey(error));
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      await onSubmit(deltaQuantity);
    } catch (error) {
      setErrorKey(resolveErrorTranslationKey(error));
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs" aria-labelledby="restock-dialog-title">
      <DialogTitle id="restock-dialog-title">
        {t('inventory.restockDialog.title', { name: ingredientName })}
      </DialogTitle>
      <DialogContent>
        <Stack direction="row" spacing={2} sx={styles.fieldsRow} onKeyDown={handleKeyDown}>
          <TextField
            label={t('inventory.form.amountLabel')}
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
        {errorKey && (
          <Typography color="error" sx={styles.error}>
            {t(errorKey)}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isSubmitting}>
          {t('inventory.actions.cancel')}
        </Button>
        <Button onClick={() => void handleSubmit()} variant="contained" disabled={isSubmitting}>
          {t('inventory.restockDialog.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
