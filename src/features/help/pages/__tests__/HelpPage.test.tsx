import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import type { User } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserProfile, UserRole } from '../../../../shared/types/userProfile';
import { i18n } from '../../../../app/i18n';
import { theme } from '../../../../app/theme';
import { HelpPage } from '../HelpPage';

vi.mock('../../../auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../../auth/useAuth';

const mockedUseAuth = vi.mocked(useAuth);

const renderPage = () => {
  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme} defaultMode="light">
        <HelpPage />
      </ThemeProvider>
    </I18nextProvider>,
  );
};

const mockRole = (role: UserRole) => {
  mockedUseAuth.mockReturnValue({
    user: { uid: 'test-user-uid' } as unknown as User,
    profile: { role, active: true } as unknown as UserProfile,
    role,
    isActive: true,
    status: 'authenticated',
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  void i18n.changeLanguage('uk');
});

describe('HelpPage', () => {
  it('shows the page title, all quick-start steps in order, and all topics for an admin', () => {
    mockRole('admin');
    renderPage();

    expect(screen.getByRole('heading', { name: i18n.t('help.title'), level: 1 })).toBeInTheDocument();

    const stepTitles = [
      i18n.t('help.quickStart.steps.browseMenu.title'),
      i18n.t('help.quickStart.steps.reserveOrRequest.title'),
      i18n.t('help.quickStart.steps.trackOrder.title'),
      i18n.t('help.quickStart.steps.processRequests.title'),
    ];
    const stepElements = stepTitles.map(title => screen.getByText(title));
    for (let index = 0; index < stepElements.length - 1; index += 1) {
      const current = stepElements[index];
      const next = stepElements[index + 1];
      expect(current.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }

    const topicKeys = [
      'menuBrowse',
      'myOrders',
      'languageAndTheme',
      'cookingRequests',
      'dishesAndRecipes',
      'inventoryAndStock',
      'preparedBatches',
      'mealTimeSettings',
    ];
    topicKeys.forEach(key => {
      expect(screen.getByRole('button', { name: i18n.t(`help.topics.${key}.title`) })).toBeInTheDocument();
    });
  });

  it('shows only the shared quick-start steps and topics for a user, hiding admin-only content', () => {
    mockRole('user');
    renderPage();

    const sharedStepTitles = [
      i18n.t('help.quickStart.steps.browseMenu.title'),
      i18n.t('help.quickStart.steps.reserveOrRequest.title'),
      i18n.t('help.quickStart.steps.trackOrder.title'),
    ];
    sharedStepTitles.forEach(title => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
    expect(screen.queryByText(i18n.t('help.quickStart.steps.processRequests.title'))).not.toBeInTheDocument();

    const sharedTopicKeys = ['menuBrowse', 'myOrders', 'languageAndTheme'];
    sharedTopicKeys.forEach(key => {
      expect(screen.getByRole('button', { name: i18n.t(`help.topics.${key}.title`) })).toBeInTheDocument();
    });

    expect(screen.queryByText(i18n.t('help.topics.cookingRequests.title'))).not.toBeInTheDocument();
  });
});
