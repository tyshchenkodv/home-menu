import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import type { DomainTimestamp } from '../../../domain/orders/types';
import type { OrderWithId } from '../../../shared/types/order';
import { useAuth } from '../../auth/useAuth';
import { CancelOrderDialog } from '../components/CancelOrderDialog/CancelOrderDialog';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';
import { LoadingState } from '../components/LoadingState/LoadingState';
import { OrderCard } from '../components/OrderCard/OrderCard';
import { OrderTabs } from '../components/OrderTabs/OrderTabs';
import { useMyOrders } from '../hooks/useMyOrders';
import { useOrderCommands } from '../hooks/useOrderCommands';
import type { OrdersTab } from '../types/orderTabsProps';
import { NON_TERMINAL_STATUSES, TERMINAL_STATUSES, deriveDisplayStatus } from '../utils/deriveDisplayStatus';

const EARLIER_LIMIT = 3;

/**
 * My Orders (`/orders`, `docs/design/screens/my-orders.md`): Active/History
 * tabs over the signed-in user's own orders and cooking requests, the full
 * `OrderCard` status matrix, and the cancellation confirmation flow.
 */
export const OrdersPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.uid ?? '';

  const [tab, setTab] = useState<OrdersTab>('active');
  const [cancelTarget, setCancelTarget] = useState<OrderWithId | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  // Lazy initializer: read once on mount, not on every render (React's
  // purity rule forbids calling the impure `Date.now()` directly in the
  // render body), mirroring `MenuPage`'s clock snapshot.
  const [nowMillis] = useState(() => Date.now());
  const now: DomainTimestamp = useMemo(() => ({ toMillis: () => nowMillis }), [nowMillis]);

  const result = useMyOrders(userId, retryToken);
  const commands = useOrderCommands();

  const activeOrders = result.orders.filter(order => NON_TERMINAL_STATUSES.includes(deriveDisplayStatus(order, now)));
  const terminalOrders = result.orders.filter(order => TERMINAL_STATUSES.includes(deriveDisplayStatus(order, now)));
  const earlierOrders = terminalOrders.slice(0, EARLIER_LIMIT);

  const renderCard = (order: OrderWithId) => (
    <OrderCard
      key={order.id}
      order={order}
      now={now}
      allocatedBatches={order.allocations
        .map(allocation => result.batchesById.get(allocation.batchId))
        .filter(batch => batch !== undefined)}
      onCancel={setCancelTarget}
    />
  );

  const renderContent = () => {
    if (result.status === 'loading') {
      return <LoadingState message={t('orders.loading')} />;
    }

    if (result.status === 'error') {
      return (
        <ErrorState
          title={t('orders.error.title')}
          message={t('orders.error.body')}
          retryLabel={t('common.retry')}
          onRetry={() => {
            setRetryToken(current => current + 1);
          }}
        />
      );
    }

    if (result.orders.length === 0) {
      return (
        <EmptyState
          title={t('orders.empty.title')}
          message={t('orders.empty.body')}
          actionLabel={t('orders.empty.action')}
          onAction={() => {
            void navigate('/menu');
          }}
        />
      );
    }

    if (tab === 'active') {
      return (
        <Stack spacing={2}>
          <Stack spacing={1.5}>{activeOrders.map(renderCard)}</Stack>

          {earlierOrders.length > 0 && (
            <Stack spacing={1.5}>
              <Typography variant="overline" color="text.secondary">
                {t('orders.earlier')}
              </Typography>
              {earlierOrders.map(renderCard)}
            </Stack>
          )}
        </Stack>
      );
    }

    return <Stack spacing={1.5}>{terminalOrders.map(renderCard)}</Stack>;
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h1">{t('orders.title')}</Typography>

      <OrderTabs value={tab} onChange={setTab} />

      {renderContent()}

      {cancelTarget && (
        <CancelOrderDialog
          open
          dishName={cancelTarget.dishName}
          quantity={cancelTarget.quantity}
          onCancel={() => {
            setCancelTarget(null);
          }}
          onConfirm={async () => {
            await commands.cancel(cancelTarget.id);
            setCancelTarget(null);
          }}
        />
      )}
    </Stack>
  );
};
