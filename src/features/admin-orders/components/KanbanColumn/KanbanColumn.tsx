import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
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
 * card in that column. On mobile (`collapsible`) the header becomes a
 * tappable toggle that expands or collapses the column's cards.
 */
export const KanbanColumn = ({
  status,
  orders,
  collapsible,
  onApprove,
  onReject,
  onStartCooking,
  onMarkPrepared,
  onCorrect,
}: KanbanColumnProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  const heading = (
    <Stack direction="row" spacing={1} sx={styles.headerRow}>
      <Box sx={dotSx(COLUMN_DOT_COLOR[status])} />
      <Typography variant="subtitle1" sx={styles.columnTitle}>
        {t('orders.admin.columnHeading', {
          status: t(`status.order.${status satisfies OrderStatus}`),
          count: orders.length,
        })}
      </Typography>
    </Stack>
  );

  const cards = (
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
  );

  if (!collapsible) {
    return (
      <Stack spacing={1.5} sx={styles.column}>
        {heading}
        {cards}
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5} sx={styles.column}>
      <ButtonBase
        onClick={() => {
          setExpanded(current => !current);
        }}
        aria-expanded={expanded}
        sx={styles.toggle}
      >
        {heading}
        <ExpandMoreIcon sx={styles.chevron} style={{ transform: expanded ? 'rotate(180deg)' : undefined }} />
      </ButtonBase>
      <Collapse in={expanded}>{cards}</Collapse>
    </Stack>
  );
};
