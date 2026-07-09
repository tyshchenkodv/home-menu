import type { SxProps, Theme } from '@mui/material/styles';

export const styles: Record<string, SxProps<Theme>> = {
  page: { p: 2 },
  header: { alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 },
  content: { pb: 10 },
  fab: { position: 'fixed', bottom: 24, right: 24 },
};
