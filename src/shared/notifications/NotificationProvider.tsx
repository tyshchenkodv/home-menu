import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useEffect, useState, type ReactNode, type SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { subscribeToNotifications, type AppNotification } from './notificationBus';
import { notifyError } from './notify';

const AUTO_HIDE_MS = 6000;

interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * Renders a single app-wide toast (MUI Snackbar) anchored to the bottom so it
 * stays visible on phones. Listens to the notification bus for published
 * messages and also catches otherwise-invisible uncaught runtime errors and
 * unhandled promise rejections, which in production would only reach the
 * (stripped) console.
 */
export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { t } = useTranslation();
  const [current, setCurrent] = useState<AppNotification | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return subscribeToNotifications(notification => {
      setCurrent(notification);
      setOpen(true);
    });
  }, []);

  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      notifyError(event.error ?? event.message);
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      notifyError(event.reason);
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const handleClose = (_event: Event | SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  return (
    <>
      {children}
      {current ? (
        <Snackbar
          open={open}
          autoHideDuration={AUTO_HIDE_MS}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleClose} severity={current.severity} variant="filled" sx={{ width: '100%' }}>
            {t(current.messageKey)}
          </Alert>
        </Snackbar>
      ) : null}
    </>
  );
};
