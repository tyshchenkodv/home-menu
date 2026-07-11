import type { SxProps, Theme } from '@mui/material/styles';

export const styles: Record<string, SxProps<Theme>> = {
  page: {
    minHeight: '100dvh',
    alignItems: 'center',
    justifyContent: 'center',
    px: 3,
    py: 8,
    background: (theme: Theme) =>
      `linear-gradient(180deg, ${theme.palette.primary.light} 0%, ${theme.palette.background.default} 45%, ${theme.palette.secondary.light} 100%)`,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    textAlign: 'center',
  },
  mascot: { color: 'primary.main' },
  brandRow: { alignItems: 'center', justifyContent: 'center' },
  mark: { display: 'flex', color: 'primary.main' },
  wordmark: { fontWeight: 900, color: 'primary.dark' },
  tagline: { color: 'text.secondary' },
  title: { fontSize: '1rem', fontWeight: 700, color: 'text.secondary' },
  actions: { width: '100%', alignItems: 'center' },
};
