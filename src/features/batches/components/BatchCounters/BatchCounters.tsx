import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { PreparedBatchWithId } from '../../../../shared/types/preparedBatch';
import { cellSx, styles } from './styles';

interface BatchCountersProps {
  batch: PreparedBatchWithId;
}

/**
 * Displays the four quantity counters for a batch in an equal-width grid:
 * AVAILABLE, RESERVED, CONSUMED, DISCARDED. Each cell shows a label and number.
 *
 * Used by BatchCard to provide a consistent, scannable view of batch inventory.
 */
export const BatchCounters = ({ batch }: BatchCountersProps) => {
  const { t } = useTranslation();

  const counters = [
    { key: 'available', label: t('batches.counters.available'), value: batch.availableQuantity },
    { key: 'reserved', label: t('batches.counters.reserved'), value: batch.reservedQuantity },
    { key: 'consumed', label: t('batches.counters.consumed'), value: batch.consumedQuantity },
    { key: 'discarded', label: t('batches.counters.discarded'), value: batch.discardedQuantity },
  ];

  return (
    <Box component={Paper} variant="outlined" sx={styles.container}>
      <Stack direction="row" spacing={0} sx={styles.row}>
        {counters.map(counter => (
          <Stack key={counter.key} sx={cellSx(counter.key === 'discarded')}>
            <Typography variant="h5" sx={styles.number}>
              {counter.value}
            </Typography>
            <Typography variant="caption" sx={styles.label}>
              {counter.label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};
