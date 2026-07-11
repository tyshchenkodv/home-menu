import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { PreparedBatchWithId } from '../../../../shared/types/preparedBatch';
import { cellSx, labelSx, numberSx, styles, type CounterTint } from './styles';

interface BatchCountersProps {
  batch: PreparedBatchWithId;
}

/**
 * Displays the four quantity counters for a batch in an equal-width grid:
 * AVAILABLE, RESERVED, CONSUMED, DISCARDED. Each cell shows a label and number,
 * tinted per the 05d BatchCard counters matrix (available = success, reserved
 * = primary/secondary when fully reserved, consumed/discarded = neutral grey).
 *
 * Used by BatchCard to provide a consistent, scannable view of batch inventory.
 */
export const BatchCounters = ({ batch }: BatchCountersProps) => {
  const { t } = useTranslation();

  const isFullyReserved = batch.availableQuantity === 0 && batch.reservedQuantity > 0;

  const counters: { key: string; label: string; value: number; tint: CounterTint }[] = [
    { key: 'available', label: t('batches.counters.available'), value: batch.availableQuantity, tint: 'success' },
    {
      key: 'reserved',
      label: t('batches.counters.reserved'),
      value: batch.reservedQuantity,
      tint: isFullyReserved ? 'secondary' : 'primary',
    },
    { key: 'consumed', label: t('batches.counters.consumed'), value: batch.consumedQuantity, tint: 'neutral' },
    { key: 'discarded', label: t('batches.counters.discarded'), value: batch.discardedQuantity, tint: 'neutral' },
  ];

  return (
    <Box component={Paper} variant="outlined" sx={styles.container}>
      <Stack direction="row" spacing={0} sx={styles.row}>
        {counters.map(counter => (
          <Stack key={counter.key} sx={cellSx(counter.key === 'discarded', counter.tint)}>
            <Typography variant="h5" sx={numberSx(counter.tint)}>
              {counter.value}
            </Typography>
            <Typography variant="caption" sx={labelSx(counter.tint)}>
              {counter.label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};
