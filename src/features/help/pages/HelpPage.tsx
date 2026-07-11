import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../auth/useAuth';
import { HelpTopics } from '../components/HelpTopics/HelpTopics';
import { QuickStartSteps } from '../components/QuickStartSteps/QuickStartSteps';
import { selectHelpTopics, selectQuickStartSteps } from '../utils/selectHelpContent';
import { styles } from './HelpPage.styles';

/**
 * Static, role-filtered Help screen. The intro is identical for every role;
 * the quick-start steps and topic sections are filtered by the signed-in
 * `role` using the same catalog-and-filter pattern as `navigationDestinations`.
 * No data fetching: this is the page's only state.
 */
export const HelpPage = () => {
  const { t } = useTranslation();
  const { role } = useAuth();

  const steps = role ? selectQuickStartSteps(role) : [];
  const topics = role ? selectHelpTopics(role) : [];

  return (
    <Stack spacing={3} sx={styles.page}>
      <Typography variant="h1">{t('help.title')}</Typography>
      <Typography variant="body1">{t('help.intro.body')}</Typography>

      <Stack spacing={1}>
        <Typography variant="h2" sx={styles.sectionTitle}>
          {t('help.quickStart.title')}
        </Typography>
        <QuickStartSteps steps={steps} />
      </Stack>

      <HelpTopics topics={topics} />
    </Stack>
  );
};
