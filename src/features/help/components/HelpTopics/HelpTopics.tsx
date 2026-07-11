import ExpandMore from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { HelpTopicSection } from '../../types/helpContent';
import { styles } from './HelpTopics.styles';

export interface HelpTopicsProps {
  topics: HelpTopicSection[];
}

/**
 * Renders the Help page's topic sections as an expandable accordion list,
 * already filtered and ordered by the caller (see `selectHelpTopics`). Each
 * topic reuses the icon already assigned to its matching nav destination.
 */
export const HelpTopics = ({ topics }: HelpTopicsProps) => {
  const { t } = useTranslation();

  return (
    <Stack spacing={1}>
      {topics.map(topic => {
        const { Icon } = topic;
        return (
          <Accordion key={topic.key} disableGutters>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Icon sx={styles.icon} />
                <Typography component="span">{t(topic.titleKey)}</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2">{t(topic.descriptionKey)}</Typography>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Stack>
  );
};
