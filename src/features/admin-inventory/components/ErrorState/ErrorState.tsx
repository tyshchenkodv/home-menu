import Box from '@mui/material/Box';

import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';
import type { ErrorStateProps } from '../../types/errorStateProps';

/** Centered error message with a retry CTA, shown when a subscription fails. */
export const ErrorState = ({ message, body, retryLabel, onRetry }: ErrorStateProps) => (
  <Box role="alert">
    <StatePlaceholder
      variant="confused"
      title={message}
      message={body}
      action={{ label: retryLabel, onClick: onRetry }}
    />
  </Box>
);
