import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { EmptyStateProps } from '../../types/emptyStateProps';
import { styles } from './styles';

/** Generic centered empty-state message for a feed with no items. */
export const EmptyState = ({ message }: EmptyStateProps) => (
  <Stack spacing={2} sx={styles.container}>
    <Typography color="text.secondary">{message}</Typography>
  </Stack>
);
