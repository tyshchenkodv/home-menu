import type { SxProps, Theme } from '@mui/material/styles';

import { lightSchemeInk } from '../../../../shared/theme/pastelInk';

export const styles: Record<string, SxProps<Theme>> = {
  headerRow: { alignItems: 'flex-start', justifyContent: 'space-between' },
  title: {
    flex: 1,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  mutedCard: { opacity: 0.92, bgcolor: 'action.hover' },
  cancelledCard: { borderStyle: 'dashed', opacity: 0.92 },
  // Balance the card's vertical padding: MUI's CardContent adds an extra
  // bottom pad on `:last-child` (24px vs the 16px top), which reads as a
  // larger gap below the buttons than above the title.
  cardContent: { '&:last-child': { pb: 2 } },
  actionButton: { minHeight: 44 },
  // `error.light` stays a light pink in both schemes; pin the text to the
  // light-scheme `error.dark` so it never flips to a too-light tone in dark mode.
  reasonBox: {
    bgcolor: 'error.light',
    color: (theme: Theme) => lightSchemeInk(theme, palette => palette.error.dark, 'rgb(159, 65, 65)'),
    borderRadius: 1.5,
    p: 1.5,
  },
};
