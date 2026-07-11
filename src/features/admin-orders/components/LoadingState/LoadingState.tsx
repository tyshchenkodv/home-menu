import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';

const COLUMN_COUNT = 4;

interface LoadingStateProps {
  message: string;
}

/**
 * Centered loading mascot + caption, followed by 4 column skeletons matching
 * the board's fixed-width layout (docs/design/screens/admin-orders.md
 * "Loading": "CatArt sleep + column skeletons").
 */
export const LoadingState = ({ message }: LoadingStateProps) => (
  <Stack spacing={2}>
    <StatePlaceholder variant="sleeping" message={message} />
    <Stack direction="row" spacing={2} sx={{ overflowX: 'auto' }}>
      {Array.from({ length: COLUMN_COUNT }, (_unused, index) => (
        <Stack key={index} spacing={1} data-testid="admin-orders-loading-skeleton-column" sx={{ minWidth: 280 }}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="rounded" height={96} />
          <Skeleton variant="rounded" height={96} />
        </Stack>
      ))}
    </Stack>
  </Stack>
);
