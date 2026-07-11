import Stack from '@mui/material/Stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { DashboardHeader } from '../components/DashboardHeader/DashboardHeader';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';
import { LoadingState } from '../components/LoadingState/LoadingState';
import { ReadyPortionsBanner } from '../components/ReadyPortionsBanner/ReadyPortionsBanner';
import { ReviewRequestsCard } from '../components/ReviewRequestsCard/ReviewRequestsCard';
import { SummaryTiles } from '../components/SummaryTiles/SummaryTiles';
import { useDashboardData } from '../hooks/useDashboardData';

/** Maps a summary tile key to the admin destination it should navigate to. */
const TILE_ROUTES: Record<string, string> = {
  pendingRequests: '/admin/orders',
  inProgress: '/admin/orders',
  lowStock: '/admin/inventory',
  expiredBatches: '/admin/batches',
};

/**
 * Admin dashboard (`/admin`): a page header with mascot, a 2×2 grid of summary
 * tiles, the "Portions ready to reserve" banner, and a "Manage" section with
 * onward links. Implements docs/design/screens/admin-dashboard.md.
 */
export const AdminDashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [retryToken, setRetryToken] = useState(0);

  const result = useDashboardData(retryToken);

  const isAllCalm =
    result.status === 'ready' &&
    result.data.pendingRequests === 0 &&
    result.data.inProgress === 0 &&
    result.data.lowStockCount === 0 &&
    result.data.expiredBatchCount === 0;

  const pendingRequests = result.status === 'ready' ? result.data.pendingRequests : 0;

  const renderSummary = () => {
    if (result.status === 'loading') {
      return <LoadingState message={t('dashboard.loading')} />;
    }

    if (result.status === 'error') {
      return (
        <ErrorState
          title={t('dashboard.error.title')}
          message={t('dashboard.error.body')}
          retryLabel={t('common.retry')}
          onRetry={() => {
            setRetryToken(current => current + 1);
          }}
        />
      );
    }

    if (isAllCalm) {
      return <EmptyState title={t('dashboard.empty.title')} message={t('dashboard.empty.body')} />;
    }

    return (
      <Stack spacing={3}>
        <SummaryTiles
          data={result.data}
          onTileClick={tileKey => {
            void navigate(TILE_ROUTES[tileKey] ?? '/admin');
          }}
        />
        <ReadyPortionsBanner
          count={result.data.readyPortionsTotal}
          onClick={() => {
            void navigate('/menu');
          }}
        />
      </Stack>
    );
  };

  return (
    <Stack spacing={3}>
      <DashboardHeader />
      {renderSummary()}
      <ReviewRequestsCard pendingRequests={pendingRequests} />
    </Stack>
  );
};
