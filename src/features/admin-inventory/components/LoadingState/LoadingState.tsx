import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { LoadingStateProps } from '../../types/loadingStateProps';
import { styles } from './styles';

/** Generic centered loading indicator with a localized message. */
export const LoadingState = ({ message }: LoadingStateProps) => (
  <Stack spacing={2} sx={styles.container}>
    <CircularProgress aria-hidden="true" />
    <Typography>{message}</Typography>
  </Stack>
);
