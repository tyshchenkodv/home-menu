import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useColorScheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

/**
 * Full-width navigation-drawer row that toggles the binary light/dark color
 * scheme and persists it (via MUI's `useColorScheme`). The label and leading
 * icon advertise the scheme the click switches to.
 */
export const ColorSchemeMenuItem = () => {
  const { t } = useTranslation();
  const { mode, setMode } = useColorScheme();
  const isDark = mode === 'dark';

  const handleClick = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  return (
    <ListItemButton onClick={handleClick}>
      <ListItemIcon>{isDark ? <LightModeIcon /> : <DarkModeIcon />}</ListItemIcon>
      <ListItemText primary={isDark ? t('common.lightMode') : t('common.darkMode')} />
    </ListItemButton>
  );
};
