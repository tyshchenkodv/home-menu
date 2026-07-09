import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { IconButton } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

export const ColorSchemeToggle = () => {
  const { t } = useTranslation();
  const { mode, setMode } = useColorScheme();

  const handleClick = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  return (
    <IconButton onClick={handleClick} aria-label={t('common.toggleDarkMode')} color="inherit">
      {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
};
