import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { CatArt } from '../CatArt/CatArt';
import { styles } from './StatePlaceholder.styles';

interface StatePlaceholderProps {
  variant: 'sleeping' | 'empty' | 'confused';
  message: string;
  /** Optional headline shown above the message (design specs pair a headline
   *  with the body copy for empty/error states). */
  title?: string;
}

/** Centered mascot illustration paired with a localized headline and message. */
export const StatePlaceholder = ({ variant, message, title }: StatePlaceholderProps) => (
  <Stack spacing={1} sx={styles.container}>
    <CatArt variant={variant} size={120} />
    {title ? (
      <Typography variant="h5" sx={styles.title}>
        {title}
      </Typography>
    ) : null}
    <Typography color="text.secondary">{message}</Typography>
  </Stack>
);

export type { StatePlaceholderProps };
