import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface EmptyStateProps {
  message: string;
}

/** Generic centered empty-state message for a feed with no items. */
export const EmptyState = ({ message }: EmptyStateProps) => (
  <Stack spacing={2} sx={{ py: 6, alignItems: 'center', justifyContent: 'center' }}>
    <Typography color="text.secondary">{message}</Typography>
  </Stack>
);
