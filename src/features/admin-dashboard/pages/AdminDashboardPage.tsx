import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';
import { LoadingState } from '../components/LoadingState/LoadingState';
import { SummaryTiles } from '../components/SummaryTiles/SummaryTiles';
import { useDashboardData } from '../hooks/useDashboardData';

/**
 * Admin dashboard (`/admin`): displays summary tiles for pending requests,
 * in-progress cooking, low-stock items, expired batches, and ready portions.
 * Implements docs/design/screens/admin-dashboard.md.
 */
export const AdminDashboardPage = () => {
  const { t } = useTranslation();
  const [retryToken, setRetryToken] = useState(0);

  const result = useDashboardData(retryToken);

  const isAllCalm =
    result.status === 'ready' &&
    result.data.pendingRequests === 0 &&
    result.data.inProgress === 0 &&
    result.data.lowStockCount === 0 &&
    result.data.expiredBatchCount === 0;

  const renderContent = () => {
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

    return <SummaryTiles data={result.data} />;
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h1">{t('dashboard.title')}</Typography>

      {renderContent()}
    </Stack>
  );
};
