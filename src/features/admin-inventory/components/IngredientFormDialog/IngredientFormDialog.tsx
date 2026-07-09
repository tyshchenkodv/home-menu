import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { KeyboardEvent } from 'react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { convertToBaseUnit } from '../../../../domain/inventory/convertToBaseUnit';
import { InventoryDomainError } from '../../../../domain/inventory/errors';
import type { InputUnit, TrackingMode } from '../../../../domain/inventory/types';
import { resolveErrorTranslationKey } from '../../errorMessages';
import type { IngredientFormDialogProps } from '../../types/ingredientFormDialogProps';
import type { IngredientFormSubmitPayload } from '../../types/ingredientFormSubmitPayload';
import { styles } from './styles';

function parseLowStockThreshold(text: string): number | null {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const value = Number(trimmed);

  if (!Number.isFinite(value) || value < 0) {
    throw new InventoryDomainError('INVALID_LOW_STOCK_THRESHOLD');
  }

  return value;
}

/**
 * Create-and-edit ingredient dialog. In edit mode the tracking mode is fixed
 * (disabled) and quantity/unit inputs are hidden entirely, matching
 * `UpdateIngredientInput`'s name/lowStockThreshold-only contract. Validation
 * reuses the domain `convertToBaseUnit`/error codes so client-side rejection
 * matches the infrastructure layer's own re-validation.
 */
export const IngredientFormDialog = ({ open, mode, initialValues, onCancel, onSubmit }: IngredientFormDialogProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialValues.name);
  const [trackingMode, setTrackingMode] = useState<TrackingMode>(initialValues.trackingMode);
  const [inputUnit, setInputUnit] = useState<InputUnit>('g');
  const [amountText, setAmountText] = useState('');
  const [isPresentInitially, setIsPresentInitially] = useState(true);
  const [lowStockThresholdText, setLowStockThresholdText] = useState(
    initialValues.lowStockThreshold !== null ? String(initialValues.lowStockThreshold) : '',
  );
  const [formErrorKey, setFormErrorKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const isQuantityMode = trackingMode === 'quantity';
  const showAmountFields = mode === 'create' && isQuantityMode;
  const showPresenceInitialToggle = mode === 'create' && trackingMode === 'presence';
  const showLowStockField = isQuantityMode;

  const buildPayload = (): IngredientFormSubmitPayload => {
    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      throw new InventoryDomainError('INVALID_NAME');
    }

    if (mode === 'edit') {
      return {
        mode: 'edit',
        input: {
          name: trimmedName,
          lowStockThreshold: isQuantityMode ? parseLowStockThreshold(lowStockThresholdText) : null,
        },
      };
    }

    if (trackingMode === 'presence') {
      return {
        mode: 'create',
        input: {
          name: trimmedName,
          trackingMode: 'presence',
          baseUnit: 'presence',
          quantity: null,
          isPresent: isPresentInitially,
          lowStockThreshold: null,
        },
      };
    }

    const converted = convertToBaseUnit(Number(amountText.trim()), inputUnit);
    const lowStockThreshold = parseLowStockThreshold(lowStockThresholdText);

    return {
      mode: 'create',
      input: {
        name: trimmedName,
        trackingMode: 'quantity',
        baseUnit: converted.baseUnit,
        quantity: converted.quantity,
        isPresent: null,
        lowStockThreshold,
      },
    };
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) {
      return;
    }

    setFormErrorKey(null);

    let payload: IngredientFormSubmitPayload;
    try {
      payload = buildPayload();
    } catch (error) {
      setFormErrorKey(resolveErrorTranslationKey(error));
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      await onSubmit(payload);
    } catch (error) {
      setFormErrorKey(resolveErrorTranslationKey(error));
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
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs" aria-labelledby="ingredient-form-title">
      <DialogTitle id="ingredient-form-title">
        {t(mode === 'create' ? 'inventory.form.createTitle' : 'inventory.form.editTitle')}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={styles.content} onKeyDown={handleKeyDown}>
          <TextField
            label={t('inventory.form.nameLabel')}
            value={name}
            onChange={event => {
              setName(event.target.value);
            }}
            fullWidth
          />
          <TextField
            select
            label={t('inventory.form.trackingModeLabel')}
            value={trackingMode}
            onChange={event => {
              setTrackingMode(event.target.value as TrackingMode);
            }}
            disabled={mode === 'edit'}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
            fullWidth
          >
            <option value="quantity">{t('inventory.form.trackingModeQuantity')}</option>
            <option value="presence">{t('inventory.form.trackingModePresence')}</option>
          </TextField>
          {showAmountFields && (
            <Stack direction="row" spacing={2}>
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
                <option value="g">{t('inventory.form.unitG')}</option>
                <option value="kg">{t('inventory.form.unitKg')}</option>
                <option value="ml">{t('inventory.form.unitMl')}</option>
                <option value="l">{t('inventory.form.unitL')}</option>
                <option value="pieces">{t('inventory.form.unitPieces')}</option>
              </TextField>
            </Stack>
          )}
          {showLowStockField && (
            <TextField
              label={t('inventory.form.lowStockThresholdLabel')}
              value={lowStockThresholdText}
              onChange={event => {
                setLowStockThresholdText(event.target.value);
              }}
              fullWidth
            />
          )}
          {showPresenceInitialToggle && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={isPresentInitially}
                  onChange={event => {
                    setIsPresentInitially(event.target.checked);
                  }}
                />
              }
              label={t('inventory.form.presentInitiallyLabel')}
            />
          )}
          {formErrorKey && <Typography color="error">{t(formErrorKey)}</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isSubmitting}>
          {t('inventory.actions.cancel')}
        </Button>
        <Button onClick={() => void handleSubmit()} variant="contained" disabled={isSubmitting}>
          {t(mode === 'create' ? 'inventory.form.submitCreate' : 'inventory.form.submitEdit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
