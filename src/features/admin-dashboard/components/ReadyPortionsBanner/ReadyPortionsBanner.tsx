import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CatArt } from '../../../../shared/components/CatArt/CatArt';
import { bannerSx, countSx, labelSx } from './styles';

interface ReadyPortionsBannerProps {
  count: number;
  onClick?: () => void;
}

/**
 * Full-width "Portions ready to reserve" banner from
 * docs/design/screens/admin-dashboard.md: success-tinted background, a large
 * count, the label, and the idle CatArt mascot at the right. Tapping it
 * navigates to the menu where portions can be reserved.
 */
export const ReadyPortionsBanner = ({ count, onClick }: ReadyPortionsBannerProps) => {
  const { t } = useTranslation();

  return (
    <Paper
      elevation={0}
      component={onClick ? 'button' : 'div'}
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      sx={bannerSx(Boolean(onClick))}
    >
      <Stack>
        <Typography variant="h1" component="p" sx={countSx}>
          {count}
        </Typography>
        <Typography variant="body1" sx={labelSx}>
          {t('dashboard.readyPortions')}
        </Typography>
      </Stack>
      <Box aria-hidden="true" sx={{ flexShrink: 0 }}>
        <CatArt variant="idle" size={64} />
      </Box>
    </Paper>
  );
};
