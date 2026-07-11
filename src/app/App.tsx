import { AppProviders } from './providers/AppProviders';
import { AppRouter } from './router';

export const App = () => {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
};
