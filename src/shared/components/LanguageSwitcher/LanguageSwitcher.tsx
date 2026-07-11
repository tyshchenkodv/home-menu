import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useTranslation } from 'react-i18next';

import type { SupportedLanguage } from '../../../app/i18n';

interface LanguageSwitcherProps {
  /** Stretch the group to fill its container, splitting the width across both options. */
  fullWidth?: boolean;
}

export const LanguageSwitcher = ({ fullWidth = false }: LanguageSwitcherProps) => {
  const { t, i18n } = useTranslation();

  const handleChange = (_event: React.MouseEvent<HTMLElement>, value: SupportedLanguage | null) => {
    if (value !== null) {
      void i18n.changeLanguage(value);
    }
  };

  return (
    <ToggleButtonGroup
      value={i18n.language}
      exclusive
      onChange={handleChange}
      aria-label={t('common.language')}
      fullWidth={fullWidth}
    >
      <ToggleButton value="uk" aria-label={t('common.languageUk')}>
        {t('common.languageUk')}
      </ToggleButton>
      <ToggleButton value="en" aria-label={t('common.languageEn')}>
        {t('common.languageEn')}
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
