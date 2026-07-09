import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CatArt } from '../CatArt/CatArt';
import { ColorSchemeToggle } from '../ColorSchemeToggle/ColorSchemeToggle';
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher';
import { styles } from './AppHeader.styles';

export const AppHeader = () => {
  const { t } = useTranslation();

  return (
    <AppBar position="static" color="default" elevation={0}>
      <Toolbar sx={styles.toolbar}>
        <Box sx={styles.brand}>
          <Box sx={styles.mark}>
            <CatArt variant="content" size={32} />
          </Box>
          <Typography variant="h6" component="span" sx={styles.wordmark}>
            {t('app.title')}
          </Typography>
        </Box>
        <Box sx={styles.actions}>
          <LanguageSwitcher />
          <ColorSchemeToggle />
        </Box>
      </Toolbar>
    </AppBar>
  );
};
