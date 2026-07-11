import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { DashboardData } from '../../hooks/useDashboardData';
import { styles, tileCountSx, tileSx } from './styles';

interface SummaryTilesProps {
  data: DashboardData;
  onTileClick?: (tileKey: string) => void;
}

/**
 * Summary tiles grid: displays pending requests, in-progress, low-stock items,
 * expired batches, and ready portions total. Implements
 * docs/design/screens/admin-dashboard.md "Summary tile" component.
 */
export const SummaryTiles = ({ data, onTileClick }: SummaryTilesProps) => {
  const { t } = useTranslation();

  const tiles = [
    {
      key: 'pendingRequests',
      label: t('dashboard.tiles.pendingRequests'),
      count: data.pendingRequests,
      color: 'primary' as const,
    },
    {
      key: 'inProgress',
      label: t('dashboard.tiles.inProgress'),
      count: data.inProgress,
      color: 'warning' as const,
    },
    {
      key: 'lowStock',
      label: t('dashboard.tiles.lowStock'),
      count: data.lowStockCount,
      color: 'error' as const,
    },
    {
      key: 'expiredBatches',
      label: t('dashboard.tiles.expiredBatch'),
      count: data.expiredBatchCount,
      color: 'error' as const,
    },
  ];

  return (
    <Box sx={styles.grid}>
      {tiles.map(tile => (
        <Paper
          key={tile.key}
          elevation={0}
          component={onTileClick ? 'button' : 'div'}
          type={onTileClick ? 'button' : undefined}
          onClick={() => onTileClick?.(tile.key)}
          sx={tileSx(tile.color, Boolean(onTileClick))}
        >
          <Stack spacing={1}>
            <Typography variant="h3" sx={tileCountSx(tile.color)}>
              {tile.count}
              {tile.key === 'expiredBatches' ? (
                <Box component="span" aria-hidden="true">
                  {' '}
                  ⚠
                </Box>
              ) : null}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {tile.label}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Box>
  );
};
