import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import type { HistoryListProps, HistoryStatusFilter } from '../../types/historyListProps';
import { AdminOrderCard } from '../AdminOrderCard/AdminOrderCard';
import { styles } from './styles';

const FILTER_OPTIONS: HistoryStatusFilter[] = ['all', 'reserved', 'consumed', 'rejected', 'cancelled'];

/**
 * The History tab (`docs/design/screens/admin-orders.md` "Resolved
 * decisions"): a status-filterable list of terminal orders (`reserved`,
 * `consumed`, `rejected`, `cancelled`), rendered read-only — every
 * `AdminOrderCard` action prop is omitted here.
 */
export const HistoryList = ({ orders, filter, onFilterChange }: HistoryListProps) => {
  const { t } = useTranslation();

  const filteredOrders = filter === 'all' ? orders : orders.filter(order => order.status === filter);

  return (
    <Stack spacing={2}>
      <TextField
        select
        label={t('orders.admin.historyFilterLabel')}
        value={filter}
        onChange={event => {
          onFilterChange(event.target.value as HistoryStatusFilter);
        }}
        sx={styles.filterField}
      >
        {FILTER_OPTIONS.map(option => (
          <MenuItem key={option} value={option}>
            {option === 'all' ? t('common.all') : t(`status.order.${option}`)}
          </MenuItem>
        ))}
      </TextField>

      <Stack spacing={1.5}>
        {filteredOrders.map(order => (
          <AdminOrderCard key={order.id} order={order} />
        ))}
      </Stack>
    </Stack>
  );
};
