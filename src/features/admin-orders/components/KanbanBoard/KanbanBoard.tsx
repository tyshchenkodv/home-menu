import Stack from '@mui/material/Stack';

import type { OrderWithId } from '../../../../shared/types/order';
import { KanbanColumn } from '../KanbanColumn/KanbanColumn';
import type { KanbanBoardProps } from '../../types/kanbanBoardProps';
import { styles } from './styles';

const ACTIVE_STATUSES = ['pending', 'approved', 'cooking', 'prepared'] as const;

/**
 * The 4-column active board (`docs/design/screens/admin-orders.md`
 * "Layout"): horizontal column scroll on mobile, all 4 columns visible on
 * desktop (`overflow-x: auto` handles both — a narrow viewport scrolls, a
 * wide one shows every column without needing a breakpoint switch).
 */
export const KanbanBoard = ({
  orders,
  onApprove,
  onReject,
  onStartCooking,
  onMarkPrepared,
  onCorrect,
}: KanbanBoardProps) => {
  const ordersByStatus = new Map<(typeof ACTIVE_STATUSES)[number], OrderWithId[]>(
    ACTIVE_STATUSES.map(status => [status, orders.filter(order => order.status === status)]),
  );

  return (
    <Stack spacing={2} sx={styles.board}>
      {ACTIVE_STATUSES.map(status => (
        <KanbanColumn
          key={status}
          status={status}
          orders={ordersByStatus.get(status) ?? []}
          onApprove={onApprove}
          onReject={onReject}
          onStartCooking={onStartCooking}
          onMarkPrepared={onMarkPrepared}
          onCorrect={onCorrect}
        />
      ))}
    </Stack>
  );
};
