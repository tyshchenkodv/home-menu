import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';

const SKELETON_CARD_COUNT = 2;

interface LoadingStateProps {
  message: string;
}

/**
 * Centered loading mascot + caption, followed by skeleton dish cards
 * (docs/design/screens/menu-browse.md "loading": "2 skeleton cards (grey
 * blocks for photo + two text lines)").
 */
export const LoadingState = ({ message }: LoadingStateProps) => (
  <Stack spacing={2}>
    <StatePlaceholder variant="sleeping" message={message} />
    {Array.from({ length: SKELETON_CARD_COUNT }, (_unused, index) => (
      <Stack key={index} spacing={1} data-testid="menu-loading-skeleton-card">
        <Skeleton variant="rounded" height={72} />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </Stack>
    ))}
  </Stack>
);
