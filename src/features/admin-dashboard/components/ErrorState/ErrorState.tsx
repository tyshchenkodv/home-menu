import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';

interface ErrorStateProps {
  message: string;
  retryLabel: string;
  onRetry: () => void;
  title?: string;
}

/** Error state for the dashboard. */
export const ErrorState = ({ message, retryLabel, onRetry, title }: ErrorStateProps) => (
  <Box role="alert">
    <Stack spacing={2}>
      <StatePlaceholder variant="confused" message={message} title={title} />
      <Button variant="outlined" color="primary" onClick={onRetry}>
        {retryLabel}
      </Button>
    </Stack>
  </Box>
);
