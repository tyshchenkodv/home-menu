import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { ErrorStateProps } from '../../types/errorStateProps';
import { styles } from './styles';

/** Generic centered error message shown when a subscription or action fails. */
export const ErrorState = ({ message }: ErrorStateProps) => (
  <Stack spacing={2} sx={styles.container} role="alert">
    <Typography color="error">{message}</Typography>
  </Stack>
);
