import HistoryIcon from '@mui/icons-material/History';
import InventoryIcon from '@mui/icons-material/Inventory2';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

/**
 * Minimal administrator shell: a title plus navigation cards to the
 * inventory feature. Deliberately does not imply dishes, orders, or any
 * other admin capability beyond this slice.
 */
export const AdminHomePage = () => {
  const { t } = useTranslation();

  return (
    <Stack spacing={2} sx={{ p: 2, maxWidth: 480 }}>
      <Typography variant="h1">{t('nav.admin')}</Typography>
      <Typography color="text.secondary">{t('adminHome.description')}</Typography>

      <Card variant="outlined">
        <CardActionArea component={RouterLink} to="/admin/inventory">
          <CardContent>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <InventoryIcon color="primary" />
              <Stack>
                <Typography variant="h2" sx={{ fontSize: '1.125rem' }}>
                  {t('adminHome.inventoryCardTitle')}
                </Typography>
                <Typography color="text.secondary">{t('adminHome.inventoryCardDescription')}</Typography>
              </Stack>
            </Stack>
          </CardContent>
        </CardActionArea>
      </Card>

      <Card variant="outlined">
        <CardActionArea component={RouterLink} to="/admin/inventory/history">
          <CardContent>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <HistoryIcon color="primary" />
              <Stack>
                <Typography variant="h2" sx={{ fontSize: '1.125rem' }}>
                  {t('adminHome.historyCardTitle')}
                </Typography>
                <Typography color="text.secondary">{t('adminHome.historyCardDescription')}</Typography>
              </Stack>
            </Stack>
          </CardContent>
        </CardActionArea>
      </Card>
    </Stack>
  );
};
