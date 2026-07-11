import type { SxProps, Theme } from '@mui/material/styles';

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
  actionButton: { minHeight: 44 },
  reasonBox: { bgcolor: 'error.light', color: 'error.dark', borderRadius: 1.5, p: 1.5 },
};
