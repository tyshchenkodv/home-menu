import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';

interface EmptyStateProps {
  message: string;
  actionLabel: string;
  onAction: () => void;
}

/** No-dishes-for-this-slot state (docs/design/screens/menu-browse.md "empty"). */
export const EmptyState = ({ message, actionLabel, onAction }: EmptyStateProps) => (
  <Stack spacing={2}>
    <StatePlaceholder variant="empty" message={message} />
    <Button variant="outlined" color="primary" onClick={onAction}>
      {actionLabel}
    </Button>
  </Stack>
);
