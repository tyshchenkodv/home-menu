import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../auth/useAuth';
import { MealTimesForm } from '../components/MealTimesForm/MealTimesForm';
import { useGeneralSettings } from '../hooks/useGeneralSettings';
import { styles } from './SettingsPage.styles';

/**
 * Admin-only settings screen, reached exclusively through the `RequireAdmin`
 * route guard. Regular users never see this destination; language and theme
 * controls live in the app navigation drawer for everyone.
 */
export const SettingsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { settings, status, error, isSaving, hasNeverBeenSaved, save } = useGeneralSettings();

  const handleSave = async (newTimes: typeof settings.defaultMealTimes) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }
    await save({ defaultMealTimes: newTimes }, user.uid);
  };

  return (
    <Stack spacing={3} sx={styles.page}>
      <Typography variant="h1">{t('settings.title')}</Typography>

      <Stack spacing={1}>
        <Typography variant="h2" sx={styles.sectionTitle}>
          {t('settings.mealTimes.title')}
        </Typography>
        {status === 'loading' ? (
          <Paper sx={styles.loadingCard}>
            <Stack spacing={1} sx={styles.loadingStack}>
              <CircularProgress size={40} />
              <Typography>{t('settings.loading')}</Typography>
            </Stack>
          </Paper>
        ) : (
          // Mounted only once the load has settled, so MealTimesForm seeds its
          // field state from the real persisted times (not the loading-state
          // defaults) — no remount key or post-mount sync needed.
          <MealTimesForm
            initialTimes={settings.defaultMealTimes}
            hasNeverBeenSaved={hasNeverBeenSaved}
            isSaving={isSaving}
            error={error}
            onSave={handleSave}
          />
        )}
      </Stack>
    </Stack>
  );
};
