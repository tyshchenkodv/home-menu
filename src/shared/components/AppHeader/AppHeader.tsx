import MenuIcon from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CatArt } from '../CatArt/CatArt';
import { styles } from './AppHeader.styles';

interface AppHeaderProps {
  /** When provided, renders a leading hamburger button that opens the mobile nav drawer. */
  onOpenNav?: () => void;
}

export const AppHeader = ({ onOpenNav }: AppHeaderProps) => {
  const { t } = useTranslation();

  return (
    <AppBar position="static" color="default" elevation={0}>
      <Toolbar sx={styles.toolbar}>
        <Box sx={styles.brand}>
          {onOpenNav ? (
            <IconButton
              onClick={onOpenNav}
              aria-label={t('nav.openMenu')}
              aria-expanded={false}
              aria-controls="app-nav-drawer"
              color="inherit"
              sx={styles.menuButton}
            >
              <MenuIcon />
            </IconButton>
          ) : null}
          <Box sx={styles.mark}>
            <CatArt variant="logo" size={32} />
          </Box>
          <Typography variant="h6" component="span" sx={styles.wordmark}>
            {t('app.title')}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
