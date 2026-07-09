import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { CatArt } from '../CatArt/CatArt';
import { styles } from './StatePlaceholder.styles';

interface StatePlaceholderProps {
  variant: 'sleeping' | 'empty' | 'confused';
  message: string;
}

/** Centered mascot illustration paired with a localized state message. */
export const StatePlaceholder = ({ variant, message }: StatePlaceholderProps) => (
  <Stack spacing={2} sx={styles.container}>
    <CatArt variant={variant} size={120} />
    <Typography>{message}</Typography>
  </Stack>
);

export type { StatePlaceholderProps };
