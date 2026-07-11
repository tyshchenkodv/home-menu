import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import type { OrderWithId } from '../../../../shared/types/order';
import { KanbanColumn } from '../KanbanColumn/KanbanColumn';
import type { KanbanBoardProps } from '../../types/kanbanBoardProps';
import { styles } from './styles';

const ACTIVE_STATUSES = ['pending', 'approved', 'cooking', 'prepared'] as const;

/**
 * The 4-column active board (`docs/design/screens/admin-orders.md` "Layout").
 * Desktop (`md`+): the four columns share the available width in a row,
 * separated by vertical dividers. Mobile (< `md`): the statuses stack into a
 * single vertical column of collapsible sections separated by horizontal
 * dividers, so the board scrolls with the page instead of scrolling
 * horizontally.
 */
export const KanbanBoard = ({
  orders,
  onApprove,
  onReject,
  onStartCooking,
  onMarkPrepared,
  onCorrect,
}: KanbanBoardProps) => {
  const theme = useTheme();
  const collapsible = useMediaQuery(theme.breakpoints.down('md'));

  const ordersByStatus = new Map<(typeof ACTIVE_STATUSES)[number], OrderWithId[]>(
    ACTIVE_STATUSES.map(status => [status, orders.filter(order => order.status === status)]),
  );

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      divider={<Divider flexItem sx={styles.divider} />}
      sx={styles.board}
    >
      {ACTIVE_STATUSES.map(status => (
        <KanbanColumn
          key={status}
          status={status}
          orders={ordersByStatus.get(status) ?? []}
          collapsible={collapsible}
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
