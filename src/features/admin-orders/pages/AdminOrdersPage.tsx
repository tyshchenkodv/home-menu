import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { OrderStatus } from '../../../domain/orders/types';
import type { OrderWithId } from '../../../shared/types/order';
import { CompleteCookingDialog } from '../components/CompleteCookingDialog/CompleteCookingDialog';
import { CorrectionDialog } from '../components/CorrectionDialog/CorrectionDialog';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';
import { HistoryList } from '../components/HistoryList/HistoryList';
import { KanbanBoard } from '../components/KanbanBoard/KanbanBoard';
import { LoadingState } from '../components/LoadingState/LoadingState';
import { RejectDialog } from '../components/RejectDialog/RejectDialog';
import { useAdminOrderCommands } from '../hooks/useAdminOrderCommands';
import { useAdminOrders } from '../hooks/useAdminOrders';
import { useHistoryNormalization } from '../hooks/useHistoryNormalization';
import type { AdminOrdersTab } from '../types/adminOrdersTab';
import type { HistoryStatusFilter } from '../types/historyListProps';
import { formatAdminOrderDate } from '../utils/formatAdminOrderMeta';

const HISTORY_STATUSES: OrderStatus[] = ['reserved', 'consumed', 'rejected', 'cancelled'];

/**
 * Admin orders (`/admin/orders`, `docs/design/screens/admin-orders.md`): the
 * 4-column active Kanban board plus a History tab, wired to every
 * `orderTransactions` admin mutation from Task 6 (approve, reject, start
 * cooking, complete cooking, and the audited correction).
 */
export const AdminOrdersPage = () => {
  const { t, i18n } = useTranslation();

  const [tab, setTab] = useState<AdminOrdersTab>('board');
  const [historyFilter, setHistoryFilter] = useState<HistoryStatusFilter>('all');
  const [retryToken, setRetryToken] = useState(0);

  const [rejectTarget, setRejectTarget] = useState<OrderWithId | null>(null);
  const [correctTarget, setCorrectTarget] = useState<OrderWithId | null>(null);
  const [completeCookingTarget, setCompleteCookingTarget] = useState<OrderWithId | null>(null);

  const result = useAdminOrders(tab, HISTORY_STATUSES, retryToken);
  const commands = useAdminOrderCommands();

  useHistoryNormalization(tab === 'history');

  const renderContent = () => {
    if (result.status === 'loading') {
      return <LoadingState message={t('orders.admin.loading')} />;
    }

    if (result.status === 'error') {
      return (
        <ErrorState
          message={t('orders.admin.error.body')}
          retryLabel={t('common.retry')}
          onRetry={() => {
            setRetryToken(current => current + 1);
          }}
        />
      );
    }

    if (tab === 'board') {
      if (result.orders.length === 0) {
        return <EmptyState message={t('orders.admin.empty.body')} />;
      }

      return (
        <KanbanBoard
          orders={result.orders}
          onApprove={order => void commands.approve(order.id)}
          onReject={setRejectTarget}
          onStartCooking={order => void commands.startCooking(order.id)}
          onMarkPrepared={setCompleteCookingTarget}
          onCorrect={setCorrectTarget}
        />
      );
    }

    return <HistoryList orders={result.orders} filter={historyFilter} onFilterChange={setHistoryFilter} />;
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h1">{t('orders.admin.title')}</Typography>

      <Tabs
        value={tab}
        onChange={(_event, next: AdminOrdersTab) => {
          setTab(next);
        }}
        aria-label={t('orders.admin.title')}
      >
        <Tab value="board" label={t('orders.admin.tabs.board')} />
        <Tab value="history" label={t('orders.admin.tabs.history')} />
      </Tabs>

      {renderContent()}

      {rejectTarget && (
        <RejectDialog
          open
          dishName={rejectTarget.dishName}
          requesterName={rejectTarget.userDisplayName}
          quantity={rejectTarget.quantity}
          dateLabel={formatAdminOrderDate(rejectTarget.scheduledFor.toMillis(), i18n.language)}
          onCancel={() => {
            setRejectTarget(null);
          }}
          onConfirm={async reason => {
            await commands.reject(rejectTarget.id, reason);
            setRejectTarget(null);
          }}
        />
      )}

      {correctTarget && (
        <CorrectionDialog
          open
          dishName={correctTarget.dishName}
          requesterName={correctTarget.userDisplayName}
          quantity={correctTarget.quantity}
          dateLabel={formatAdminOrderDate(correctTarget.scheduledFor.toMillis(), i18n.language)}
          onCancel={() => {
            setCorrectTarget(null);
          }}
          onConfirm={async reason => {
            await commands.correct(correctTarget.id, reason);
            setCorrectTarget(null);
          }}
        />
      )}

      {completeCookingTarget && (
        <CompleteCookingDialog
          open
          dishName={completeCookingTarget.dishName}
          requesterName={completeCookingTarget.userDisplayName}
          requestedQuantity={completeCookingTarget.quantity}
          onCancel={() => {
            setCompleteCookingTarget(null);
          }}
          onConfirm={async result => {
            await commands.completeCooking({ orderId: completeCookingTarget.id, ...result });
            setCompleteCookingTarget(null);
          }}
        />
      )}
    </Stack>
  );
};
