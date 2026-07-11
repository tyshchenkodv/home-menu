import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { CatArt } from '../CatArt/CatArt';
import { styles } from './StatePlaceholder.styles';

type StatePlaceholderVariant = 'sleeping' | 'empty' | 'confused' | 'idle';

/** Mascot size (px) per `docs/design/screens/shared-patterns.md` 05g: the
 *  inline loading cat is smaller (~70px) than the empty/error/idle cats
 *  (~88px), which anchor a full data state rather than sitting above
 *  skeleton rows. */
const SIZE_BY_VARIANT: Record<StatePlaceholderVariant, number> = {
  sleeping: 72,
  empty: 88,
  confused: 88,
  idle: 88,
};

interface StatePlaceholderProps {
  variant: StatePlaceholderVariant;
  message: string;
  /** Optional headline shown above the message (design specs pair a headline
   *  with the body copy for empty/error states). */
  title?: string;
  /** Optional call-to-action rendered below the message, e.g. the empty
   *  state's "Add dish" or the error state's "Retry" action. `variant`
   *  defaults to `'outlined'` so existing error-retry callers keep their
   *  current look; empty-state CTAs pass `'contained'` per
   *  `docs/design/screens/shared-patterns.md`. */
  action?: { label: string; onClick: () => void; variant?: 'contained' | 'outlined' };
}

/** Centered mascot illustration paired with a localized headline and message. */
export const StatePlaceholder = ({ variant, message, title, action }: StatePlaceholderProps) => (
  <Stack spacing={1} sx={styles.container}>
    <CatArt variant={variant} size={SIZE_BY_VARIANT[variant]} />
    {title ? (
      <Typography variant="h5" sx={styles.title}>
        {title}
      </Typography>
    ) : null}
    <Typography color="text.secondary">{message}</Typography>
    {action ? (
      <Button variant={action.variant ?? 'outlined'} onClick={action.onClick}>
        {action.label}
      </Button>
    ) : null}
  </Stack>
);

export type { StatePlaceholderProps, StatePlaceholderVariant };
