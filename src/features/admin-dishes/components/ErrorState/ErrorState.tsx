import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';
import type { ErrorStateProps } from '../../types/errorStateProps';

/** Generic centered error message with a retry action, shown when a subscription fails. */
export const ErrorState = ({ message, retryLabel, onRetry }: ErrorStateProps) => (
  <Box role="alert">
    <Stack spacing={2}>
      <StatePlaceholder variant="confused" message={message} />
      <Button variant="outlined" onClick={onRetry}>
        {retryLabel}
      </Button>
    </Stack>
  </Box>
);
