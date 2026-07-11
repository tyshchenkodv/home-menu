import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { canUserCancelOrder } from '../../../../domain/orders/cancellationRules';
import { isBatchExpired } from '../../../../domain/batches/expiration';
import type { OrderStatus } from '../../../../domain/orders/types';
import { StatusChip, type StatusChipProps } from '../../../../shared/components/StatusChip/StatusChip';
import type { OrderCardProps } from '../../types/orderCardProps';
import { deriveDisplayStatus } from '../../utils/deriveDisplayStatus';
import { formatOrderDate, formatOrderTime } from '../../utils/formatOrderMeta';
import { styles } from './styles';

const CHIP_COLOR: Record<OrderStatus, StatusChipProps['color']> = {
  pending: 'primary',
  approved: 'info',
  cooking: 'warning',
  prepared: 'success',
  reserved: 'secondary',
  consumed: 'default',
  rejected: 'error',
  cancelled: 'default',
};

const CHIP_VARIANT: Partial<Record<OrderStatus, StatusChipProps['variant']>> = {
  cancelled: 'outlined',
};

/**
 * One order or cooking request card in My Orders, rendering the full 8-status
 * matrix from `docs/design/screens/my-orders.md` / `shared-patterns.md`
 * "OrderCard status matrix": chip color+label, the visible/disabled action
 * per status, the derived "consumed" display after `scheduledFor` (SPEC rule
 * 6 — display only, never a mutation here), and a batch-expired/discarded
 * warning on affected reserved cards (SPEC rule 5).
 */
export const OrderCard = ({ order, now, allocatedBatches, onCancel }: OrderCardProps) => {
  const { t, i18n } = useTranslation();

  const displayStatus = deriveDisplayStatus(order, now);
  const scheduledForMillis = order.scheduledFor.toMillis();
  const dateLabel = formatOrderDate(scheduledForMillis, i18n.language);
  const mealLabel = t(`common.meals.${order.mealType}`);

  const metaLine =
    order.kind === 'cook'
      ? t('orders.meta.request', { count: order.quantity, date: dateLabel, meal: mealLabel })
      : t('orders.meta.reservation', { count: order.quantity, date: dateLabel, meal: mealLabel });

  const hasBatchWarning =
    displayStatus === 'reserved' &&
    allocatedBatches.some(batch => batch.status === 'discarded' || isBatchExpired(batch.expiresAt, now));

  const canCancel = displayStatus !== 'consumed' && canUserCancelOrder(order, now);
  const isCoolingDownFromCooking = displayStatus === 'cooking';

  return (
    <Card
      variant={displayStatus === 'cancelled' ? 'outlined' : 'elevation'}
      sx={
        displayStatus === 'cancelled'
          ? styles.cancelledCard
          : displayStatus === 'consumed'
            ? styles.mutedCard
            : undefined
      }
      data-testid="order-card"
    >
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" sx={styles.headerRow}>
            <Typography variant="h4" component="h3" sx={styles.title}>
              {order.dishName}
            </Typography>
            <StatusChip
              label={t(`status.order.${displayStatus}`)}
              color={CHIP_COLOR[displayStatus]}
              variant={CHIP_VARIANT[displayStatus]}
            />
          </Stack>

          <Typography color="text.secondary">{metaLine}</Typography>

          {displayStatus === 'consumed' && (
            <Typography color="text.secondary">
              {t('orders.meta.consumedAt', {
                time: formatOrderTime(
                  order.status === 'consumed' ? order.updatedAt.toMillis() : scheduledForMillis,
                  i18n.language,
                ),
              })}
            </Typography>
          )}

          {displayStatus === 'cancelled' && (
            <Typography color="text.secondary">
              {t('orders.meta.cancelledByUser', { date: formatOrderDate(order.updatedAt.toMillis(), i18n.language) })}
            </Typography>
          )}

          {hasBatchWarning && (
            <Typography sx={styles.warningBox} variant="body2">
              {t('orders.batchWarning')}
            </Typography>
          )}

          {displayStatus === 'rejected' && order.rejectionReason && (
            <Typography sx={styles.reasonBox} variant="body2">
              {t('orders.reason', { reason: order.rejectionReason })}
            </Typography>
          )}

          {(displayStatus === 'pending' || displayStatus === 'approved' || displayStatus === 'reserved') &&
            canCancel && (
              <Button
                variant="outlined"
                color="error"
                fullWidth
                sx={styles.actionButton}
                onClick={() => {
                  onCancel(order);
                }}
              >
                {t('orders.actions.cancel')}
              </Button>
            )}

          {isCoolingDownFromCooking && (
            <Stack spacing={0.5}>
              <Button variant="outlined" color="inherit" fullWidth disabled sx={styles.actionButton}>
                {t('orders.actions.cancelUnavailable')}
              </Button>
              <Typography variant="caption" color="text.secondary">
                {t('orders.actions.cancelUnavailableHelp')}
              </Typography>
            </Stack>
          )}

          {displayStatus === 'prepared' && (
            <Typography variant="caption" color="text.secondary">
              {t('orders.preparedHelp')}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
