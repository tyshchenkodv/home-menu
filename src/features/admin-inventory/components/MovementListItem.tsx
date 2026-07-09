import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { BaseUnit } from '../../../domain/inventory/types';
import type { InventoryMovementWithId } from '../../../shared/types/inventoryMovement';
import type { IngredientDisplayUnit } from '../types/ingredientDisplay';

interface MovementListItemProps {
  movement: InventoryMovementWithId;
  /** The ingredient's current base unit, looked up by `movement.ingredientId`, or `null` when unresolvable. */
  baseUnit: BaseUnit | null;
}

const UNIT_KEY_BY_BASE_UNIT: Partial<Record<BaseUnit, IngredientDisplayUnit>> = {
  gram: 'gram',
  milliliter: 'milliliter',
  piece: 'piece',
};

const signedAmountFormatter = new Intl.NumberFormat(undefined, { signDisplay: 'exceptZero' });

/**
 * One inventory movement row: the ingredient name snapshot, localized
 * movement type, the quantity delta (signed) or presence transition, the
 * resulting balance for quantity movements, an optional note, and the
 * creation time.
 */
export const MovementListItem = ({ movement, baseUnit }: MovementListItemProps) => {
  const { t, i18n } = useTranslation();

  const unitKey = baseUnit ? UNIT_KEY_BY_BASE_UNIT[baseUnit] : undefined;
  const unitLabel = unitKey ? t(`inventory.units.${unitKey}`) : '';

  const changeText =
    movement.deltaQuantity !== null
      ? t('inventory.quantityWithUnit', {
          amount: signedAmountFormatter.format(movement.deltaQuantity),
          unit: unitLabel,
        })
      : t('inventory.history.transition', {
          from: t(movement.presenceBefore ? 'inventory.presence.present' : 'inventory.presence.absent'),
          to: t(movement.presenceAfter ? 'inventory.presence.present' : 'inventory.presence.absent'),
        });

  const balanceText =
    movement.balanceAfter !== null
      ? t('inventory.quantityWithUnit', { amount: movement.balanceAfter, unit: unitLabel })
      : null;

  const createdAtText = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(movement.createdAt.toMillis()),
  );

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={0.5}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}
          >
            <Typography variant="h2" sx={{ fontSize: '1rem' }}>
              {movement.ingredientName}
            </Typography>
            <Typography color="text.secondary">{t(`inventory.history.type.${movement.type}`)}</Typography>
          </Stack>
          <Typography>{changeText}</Typography>
          {balanceText && <Typography color="text.secondary">{balanceText}</Typography>}
          {movement.note && (
            <Typography color="text.secondary">{t('inventory.history.noteLabel', { note: movement.note })}</Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            {createdAtText}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};
