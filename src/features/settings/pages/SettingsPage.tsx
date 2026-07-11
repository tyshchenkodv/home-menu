import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../auth/useAuth';
import { MealTimesForm } from '../components/MealTimesForm/MealTimesForm';
import { useGeneralSettings } from '../hooks/useGeneralSettings';
import { LanguageSwitcher } from '../../../shared/components/LanguageSwitcher/LanguageSwitcher';
import { styles } from './SettingsPage.styles';

/**
 * User settings screen. Language section reuses the shared header control
 * so state stays single-sourced. The theme toggle lives only in AppHeader.
 * Meal-times form is admin-only; regular users see language only.
 */
export const SettingsPage = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { settings, status, error, isSaving, hasNeverBeenSaved, save } = useGeneralSettings();

  const isAdmin = profile?.role === 'admin';

  const handleSave = async (newTimes: typeof settings.defaultMealTimes) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }
    await save({ defaultMealTimes: newTimes }, user.uid);
  };

  return (
    <Stack spacing={3} sx={styles.page}>
      <Typography variant="h1">{t('settings.title')}</Typography>

      {isAdmin && (
        <Stack spacing={1}>
          <Typography variant="h2" sx={styles.sectionTitle}>
            {t('settings.mealTimes.title')}
          </Typography>
          <MealTimesForm
            initialTimes={settings.defaultMealTimes}
            hasNeverBeenSaved={hasNeverBeenSaved}
            isSaving={isSaving}
            error={error}
            isLoading={status === 'loading'}
            onSave={handleSave}
          />
        </Stack>
      )}

      <Stack spacing={1}>
        <Typography variant="h2" sx={styles.sectionTitle}>
          {t('settings.language.title')}
        </Typography>
        <LanguageSwitcher />
      </Stack>
    </Stack>
  );
};
