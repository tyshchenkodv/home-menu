import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { PreparedBatchWithId } from '../../../shared/types/preparedBatch';
import { BatchCard } from '../components/BatchCard/BatchCard';
import { DiscardBatchDialog } from '../components/DiscardBatchDialog/DiscardBatchDialog';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';
import { LoadingState } from '../components/LoadingState/LoadingState';
import { useBatchCommands } from '../hooks/useBatchCommands';
import { useBatches } from '../hooks/useBatches';

/**
 * Admin prepared batches page (`/admin/batches`): displays all batches with
 * status indicators, counters, and discard actions. Implements
 * docs/design/screens/admin-batches.md.
 */
export const BatchesPage = () => {
  const { t } = useTranslation();
  const [retryToken, setRetryToken] = useState(0);
  const [discardTarget, setDiscardTarget] = useState<PreparedBatchWithId | null>(null);

  const result = useBatches(retryToken);
  const commands = useBatchCommands();

  const handleDiscard = async (batchId: string) => {
    await commands.discard(batchId);
    setDiscardTarget(null);
    // Refresh will happen automatically via subscription
  };

  const renderContent = () => {
    if (result.status === 'loading') {
      return <LoadingState message={t('batches.loading')} />;
    }

    if (result.status === 'error') {
      return (
        <ErrorState
          message={t('batches.error.body')}
          retryLabel={t('common.retry')}
          onRetry={() => {
            setRetryToken(current => current + 1);
          }}
        />
      );
    }

    if (result.batches.length === 0) {
      return <EmptyState message={t('batches.empty.body')} />;
    }

    const now = new Date();

    return (
      <Stack spacing={2}>
        {result.batches.map(batch => (
          <BatchCard key={batch.id} batch={batch} now={now} onDiscard={setDiscardTarget} />
        ))}
      </Stack>
    );
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h1">{t('batches.title')}</Typography>

      {renderContent()}

      {discardTarget && (
        <DiscardBatchDialog
          open
          batch={discardTarget}
          onCancel={() => {
            setDiscardTarget(null);
          }}
          onConfirm={handleDiscard}
        />
      )}
    </Stack>
  );
};
