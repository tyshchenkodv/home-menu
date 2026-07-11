import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { UNIT_KEY_BY_BASE_UNIT } from '../../../../constants/unitKeyByBaseUnit';
import type { MovementListItemProps } from '../../../../types/movementListItemProps';
import { styles } from './styles';

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

  const deltaColor = movement.deltaQuantity === null ? undefined : movement.deltaQuantity > 0 ? 'success' : 'error';

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
          <Stack direction="row" spacing={1} sx={styles.header}>
            <Typography variant="h2" sx={styles.title}>
              {movement.ingredientName}
            </Typography>
            <Typography color="text.secondary">{t(`inventory.history.type.${movement.type}`)}</Typography>
          </Stack>
          <Typography color={deltaColor}>{changeText}</Typography>
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
