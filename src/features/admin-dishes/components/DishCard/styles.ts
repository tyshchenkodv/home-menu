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
  mealTagRow: { flexWrap: 'wrap' },
  mealTag: { bgcolor: 'action.hover' },
  actionButton: { flex: 1 },
  notConfiguredCard: { borderStyle: 'dashed' },
};
