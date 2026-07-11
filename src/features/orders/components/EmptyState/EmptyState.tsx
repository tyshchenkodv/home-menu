import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}

/** No-orders-yet state (docs/design/screens/my-orders.md "empty"). */
export const EmptyState = ({ title, message, actionLabel, onAction }: EmptyStateProps) => (
  <Stack spacing={2}>
    <StatePlaceholder variant="empty" title={title} message={message} />
    <Button variant="contained" color="primary" onClick={onAction}>
      {actionLabel}
    </Button>
  </Stack>
);
