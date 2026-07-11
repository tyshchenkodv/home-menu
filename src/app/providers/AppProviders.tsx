import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { AuthProvider } from '../../features/auth/AuthContext';
import { NotificationProvider } from '../../shared/notifications/NotificationProvider';
import { i18n } from '../i18n';
import { theme } from '../theme';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme} defaultMode="light">
        <CssBaseline />
        <NotificationProvider>
          <AuthProvider>{children}</AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
};
