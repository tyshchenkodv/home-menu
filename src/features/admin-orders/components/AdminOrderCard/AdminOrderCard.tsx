import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { OrderStatus } from '../../../../domain/orders/types';
import { StatusChip, type StatusChipProps } from '../../../../shared/components/StatusChip/StatusChip';
import type { AdminOrderCardProps } from '../../types/adminOrderCardProps';
import { formatAdminOrderDate } from '../../utils/formatAdminOrderMeta';
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
 * One cooking-request/order card as the admin sees it
 * (`docs/design/screens/admin-orders.md` "OrderCard (admin view)"): status
 * chip, requester/portions/date meta, and the contextual action(s) for the
 * card's status. Action props are only supplied by the Kanban board (the 4
 * active statuses); History renders the same card with every action prop
 * omitted, producing the read-only row the design calls for.
 */
export const AdminOrderCard = ({
  order,
  onApprove,
  onReject,
  onStartCooking,
  onMarkPrepared,
  onCorrect,
}: AdminOrderCardProps) => {
  const { t, i18n } = useTranslation();

  const dateLabel = formatAdminOrderDate(order.scheduledFor.toMillis(), i18n.language);
  const metaLine = t('orders.admin.meta.requester', {
    requester: order.userDisplayName,
    count: order.quantity,
    date: dateLabel,
  });
  const batchMetaLine =
    order.preparedBatchId &&
    t('orders.admin.meta.batch', {
      requester: order.userDisplayName,
      batchNumber: order.preparedBatchId.slice(0, 6),
    });

  return (
    <Card
      variant={order.status === 'cancelled' ? 'outlined' : 'elevation'}
      sx={
        order.status === 'cancelled' ? styles.cancelledCard : order.status === 'consumed' ? styles.mutedCard : undefined
      }
      data-testid="admin-order-card"
    >
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" sx={styles.headerRow}>
            <Typography variant="h4" component="h3" sx={styles.title}>
              {order.dishName}
            </Typography>
            <StatusChip
              label={t(`status.order.${order.status}`)}
              color={CHIP_COLOR[order.status]}
              variant={CHIP_VARIANT[order.status]}
            />
          </Stack>

          <Typography color="text.secondary">
            {order.status === 'prepared' && batchMetaLine ? batchMetaLine : metaLine}
          </Typography>

          {order.status === 'rejected' && order.rejectionReason && (
            <Typography sx={styles.reasonBox} variant="body2">
              {t('orders.reason', { reason: order.rejectionReason })}
            </Typography>
          )}

          {order.status === 'pending' && onApprove && onReject && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                color="primary"
                sx={styles.actionButton}
                onClick={() => {
                  onApprove(order);
                }}
              >
                {t('orders.admin.actions.approve')}
              </Button>
              <Button
                variant="outlined"
                color="error"
                sx={styles.actionButton}
                onClick={() => {
                  onReject(order);
                }}
              >
                {t('orders.admin.actions.reject')}
              </Button>
            </Stack>
          )}

          {order.status === 'approved' && onStartCooking && onReject && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                color="primary"
                sx={styles.actionButton}
                onClick={() => {
                  onStartCooking(order);
                }}
              >
                {t('orders.admin.actions.startCooking')}
              </Button>
              <Button
                variant="outlined"
                color="error"
                sx={styles.actionButton}
                onClick={() => {
                  onReject(order);
                }}
              >
                {t('orders.admin.actions.reject')}
              </Button>
            </Stack>
          )}

          {order.status === 'cooking' && onMarkPrepared && (
            <Button
              variant="contained"
              color="success"
              fullWidth
              sx={styles.actionButton}
              onClick={() => {
                onMarkPrepared(order);
              }}
            >
              {t('orders.admin.actions.markPrepared')}
            </Button>
          )}

          {onCorrect &&
            (order.status === 'pending' ||
              order.status === 'approved' ||
              order.status === 'cooking' ||
              order.status === 'prepared') && (
              <Button
                variant="text"
                color="inherit"
                size="small"
                onClick={() => {
                  onCorrect(order);
                }}
              >
                {t('orders.admin.actions.correct')}
              </Button>
            )}
        </Stack>
      </CardContent>
    </Card>
  );
};
