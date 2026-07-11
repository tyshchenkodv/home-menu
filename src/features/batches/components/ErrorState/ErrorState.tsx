import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';

interface ErrorStateProps {
  title?: string;
  message: string;
  retryLabel: string;
  onRetry: () => void;
}

/** Error state (CatArt confused with retry button). */
export const ErrorState = ({ title, message, retryLabel, onRetry }: ErrorStateProps) => (
  <Box role="alert">
    <Stack spacing={2}>
      <StatePlaceholder variant="confused" title={title} message={message} />
      <Button variant="outlined" color="primary" onClick={onRetry}>
        {retryLabel}
      </Button>
    </Stack>
  </Box>
);
