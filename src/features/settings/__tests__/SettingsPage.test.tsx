import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import type { User } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserProfile } from '../../../shared/types/userProfile';
import { i18n } from '../../../app/i18n';
import { theme } from '../../../app/theme';
import { SettingsPage } from '../pages/SettingsPage';

vi.mock('../../auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../infrastructure/firebase/services/settingsService', () => ({
  getGeneralSettings: vi.fn().mockResolvedValue({
    settings: {
      timezone: 'Europe/Kyiv',
      defaultMealTimes: { breakfast: '08:00', lunch: '13:00', dinner: '19:00' },
    },
    exists: true,
  }),
  updateGeneralSettings: vi.fn().mockResolvedValue(undefined),
  DEFAULT_GENERAL_SETTINGS: {
    timezone: 'Europe/Kyiv',
    defaultMealTimes: { breakfast: '08:00', lunch: '13:00', dinner: '19:00' },
  },
}));

import { useAuth } from '../../auth/useAuth';
import { getGeneralSettings } from '../../../infrastructure/firebase/services/settingsService';

const mockedUseAuth = vi.mocked(useAuth);
const mockedGetGeneralSettings = vi.mocked(getGeneralSettings);

const renderPage = () => {
  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme} defaultMode="light">
        <SettingsPage />
      </ThemeProvider>
    </I18nextProvider>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  void i18n.changeLanguage('uk');
  mockedUseAuth.mockReturnValue({
    user: { uid: 'test-user-uid' } as unknown as User,
    profile: { role: 'admin', active: true } as unknown as UserProfile,
    role: 'admin',
    isActive: true,
    status: 'authenticated',
  });
});

describe('SettingsPage', () => {
  it('renders the page title', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: i18n.t('settings.title'), level: 1 })).toBeInTheDocument();
  });

  it('does not render language or theme controls (those live in the nav drawer)', () => {
    renderPage();

    expect(screen.queryByRole('group', { name: i18n.t('common.language') })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: i18n.t('common.darkMode') })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: i18n.t('common.lightMode') })).not.toBeInTheDocument();
  });

  it('renders the meal-times form', async () => {
    renderPage();

    // Wait for the form to load
    expect(await screen.findByText(i18n.t('settings.mealTimes.title'))).toBeInTheDocument();
    expect(screen.getByLabelText(i18n.t('common.meals.breakfast'))).toBeInTheDocument();
  });

  it('shows the persisted meal times once they load, not the defaults', async () => {
    // The form first mounts during loading with the defaults; when the read
    // resolves with different persisted times the form must reflect them.
    mockedGetGeneralSettings.mockResolvedValueOnce({
      settings: {
        timezone: 'Europe/Kyiv',
        defaultMealTimes: { breakfast: '09:45', lunch: '12:30', dinner: '20:15' },
      },
      exists: true,
    });

    renderPage();

    expect(await screen.findByDisplayValue('09:45')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12:30')).toBeInTheDocument();
    expect(screen.getByDisplayValue('20:15')).toBeInTheDocument();
  });
});
