import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { StatusChip, type StatusChipProps } from '../../../../shared/components/StatusChip/StatusChip';
import type { DishAvailabilityCardProps } from '../../types/dishAvailabilityCardProps';
import { styles } from './styles';

type AvailabilityState = 'readyNow' | 'canBeCooked' | 'unavailable' | 'notConfigured';

function resolveState(configured: boolean, readyQuantity: number, canCook: boolean): AvailabilityState {
  if (!configured) {
    return 'notConfigured';
  }
  if (readyQuantity > 0) {
    return 'readyNow';
  }
  if (canCook) {
    return 'canBeCooked';
  }
  return 'unavailable';
}

const CHIP_COLOR: Record<AvailabilityState, StatusChipProps['color']> = {
  readyNow: 'success',
  canBeCooked: 'warning',
  unavailable: 'default',
  notConfigured: 'secondary',
};

const CHIP_LABEL_KEY: Record<AvailabilityState, string> = {
  readyNow: 'status.dishAvailability.readyNow',
  canBeCooked: 'status.dishAvailability.canBeCooked',
  unavailable: 'status.dishAvailability.unavailable',
  notConfigured: 'status.dishAvailability.notConfigured',
};

/**
 * One dish's menu card (`docs/design/screens/menu-browse.md` "DishCard"):
 * name, optional description, an availability chip (one of the four
 * `status.dishAvailability.*` states), the ready-portion counter, and the
 * matching primary action — Reserve for a ready dish, Request for a
 * cookable-only dish, disabled otherwise.
 */
export const DishAvailabilityCard = ({
  view,
  onReserve,
  onRequestCooking,
  reservedQuantity = 0,
  requestedQuantity = 0,
}: DishAvailabilityCardProps) => {
  const { t } = useTranslation();
  const { dish, availability } = view;
  const state = resolveState(availability.configured, availability.readyQuantity, availability.canCook);

  const counterLabel =
    state === 'readyNow'
      ? t('menu.card.readyCount', { count: availability.readyQuantity })
      : state === 'canBeCooked'
        ? t('menu.card.zeroReady')
        : t('menu.card.noCount');

  return (
    <Stack sx={styles.card} spacing={1} data-testid="dish-availability-card">
      <Stack direction="row" sx={styles.titleRow}>
        <Typography variant="h4" component="h3" sx={styles.title}>
          {dish.name}
        </Typography>
        <Box sx={styles.chip}>
          <StatusChip label={t(CHIP_LABEL_KEY[state])} color={CHIP_COLOR[state]} />
        </Box>
      </Stack>

      {dish.description && (
        <Typography variant="body2" color="text.secondary">
          {dish.description}
        </Typography>
      )}

      <Stack direction="row" sx={styles.footer}>
        <Stack spacing={0.25}>
          <Typography variant="body2" color={state === 'readyNow' ? 'primary.dark' : 'text.secondary'}>
            {counterLabel}
          </Typography>

          {reservedQuantity > 0 && (
            <Typography variant="body2" color="text.secondary">
              {t('menu.card.alreadyReserved', { count: reservedQuantity })}
            </Typography>
          )}

          {requestedQuantity > 0 && (
            <Typography variant="body2" color="text.secondary">
              {t('menu.card.alreadyRequested', { count: requestedQuantity })}
            </Typography>
          )}
        </Stack>

        {state === 'readyNow' && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              onReserve(view);
            }}
          >
            {t('menu.actions.reserve')}
          </Button>
        )}

        {state === 'canBeCooked' && (
          <Button
            variant="contained"
            color="secondary"
            onClick={() => {
              onRequestCooking(view);
            }}
          >
            {t('menu.actions.request')}
          </Button>
        )}

        {(state === 'unavailable' || state === 'notConfigured') && (
          <Button variant="contained" disabled>
            {t('menu.actions.request')}
          </Button>
        )}
      </Stack>
    </Stack>
  );
};
