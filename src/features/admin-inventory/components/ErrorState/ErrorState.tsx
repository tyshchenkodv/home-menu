import Box from '@mui/material/Box';

import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';
import type { ErrorStateProps } from '../../types/errorStateProps';

/** Generic centered error message shown when a subscription or action fails. */
export const ErrorState = ({ message }: ErrorStateProps) => (
  <Box role="alert">
    <StatePlaceholder variant="confused" message={message} />
  </Box>
);
