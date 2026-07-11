import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { QuickStartStep } from '../../types/helpContent';
import { styles } from './QuickStartSteps.styles';

export interface QuickStartStepsProps {
  steps: QuickStartStep[];
}

/**
 * Renders the Help page's quick-start steps as a semantic ordered list,
 * already filtered and ordered by the caller (see `selectQuickStartSteps`).
 */
export const QuickStartSteps = ({ steps }: QuickStartStepsProps) => {
  const { t } = useTranslation();

  return (
    <Box component="ol" sx={styles.list}>
      {steps.map(step => (
        <Box component="li" key={step.key} sx={styles.item}>
          <Typography variant="subtitle1" sx={styles.title}>
            {t(step.titleKey)}
          </Typography>
          <Typography variant="body2">{t(step.bodyKey)}</Typography>
        </Box>
      ))}
    </Box>
  );
};
