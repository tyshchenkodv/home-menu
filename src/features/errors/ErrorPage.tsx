import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { styles } from './ErrorPage.styles';

interface ErrorPageProps {
  /** i18n key resolving to the localized numeric code heading, e.g. `error.forbiddenTitle`. */
  titleKey: string;
}

/**
 * Reusable minimal centered layout for conventional error routes (403, 404):
 * a large numeric code heading and a single button that returns the visitor
 * to a home available to their role (via the root redirect).
 */
export const ErrorPage = ({ titleKey }: ErrorPageProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Stack spacing={2} sx={styles.container}>
      <Typography variant="h1" sx={styles.code}>
        {t(titleKey)}
      </Typography>
      <Button
        variant="contained"
        onClick={() => {
          void navigate('/');
        }}
      >
        {t('error.backHome')}
      </Button>
    </Stack>
  );
};

export type { ErrorPageProps };
