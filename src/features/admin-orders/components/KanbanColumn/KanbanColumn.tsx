import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { OrderStatus } from '../../../../domain/orders/types';
import { AdminOrderCard } from '../AdminOrderCard/AdminOrderCard';
import type { KanbanColumnProps } from '../../types/kanbanColumnProps';
import { dotSx, styles } from './styles';

/** Column dot colors (`docs/design/screens/admin-orders.md` "Desktop" bullet). */
const COLUMN_DOT_COLOR: Record<KanbanColumnProps['status'], string> = {
  pending: 'primary.main',
  approved: 'info.main',
  cooking: 'warning.main',
  prepared: 'success.main',
};

/**
 * One Kanban column for a single active status
 * (`docs/design/screens/admin-orders.md` "Column header"): a colored dot,
 * the localized status label, and the card count, followed by every order
 * card in that column.
 */
export const KanbanColumn = ({
  status,
  orders,
  onApprove,
  onReject,
  onStartCooking,
  onMarkPrepared,
  onCorrect,
}: KanbanColumnProps) => {
  const { t } = useTranslation();

  return (
    <Stack spacing={1.5} sx={styles.column}>
      <Stack direction="row" spacing={1} sx={styles.headerRow}>
        <Box sx={dotSx(COLUMN_DOT_COLOR[status])} />
        <Typography variant="subtitle1" sx={styles.columnTitle}>
          {t('orders.admin.columnHeading', {
            status: t(`status.order.${status satisfies OrderStatus}`),
            count: orders.length,
          })}
        </Typography>
      </Stack>

      <Stack spacing={1.5}>
        {orders.map(order => (
          <AdminOrderCard
            key={order.id}
            order={order}
            onApprove={onApprove}
            onReject={onReject}
            onStartCooking={onStartCooking}
            onMarkPrepared={onMarkPrepared}
            onCorrect={onCorrect}
          />
        ))}
      </Stack>
    </Stack>
  );
};
