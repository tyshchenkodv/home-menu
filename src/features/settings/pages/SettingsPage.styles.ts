import type { SxProps, Theme } from '@mui/material/styles';

export const styles: Record<string, SxProps<Theme>> = {
  page: { p: 2, maxWidth: 480 },
  sectionTitle: { fontSize: '1.125rem' },
  loadingCard: { borderRadius: 2, p: 2 },
  loadingStack: { alignItems: 'center', justifyContent: 'center', py: 3 },
};
