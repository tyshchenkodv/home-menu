import { ThemeProvider } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it } from 'vitest';

import { i18n } from '../../../../app/i18n';
import { theme } from '../../../../app/theme';
import { ColorSchemeMenuItem } from '../ColorSchemeMenuItem';

const renderItem = () => {
  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme} defaultMode="light">
        <ColorSchemeMenuItem />
      </ThemeProvider>
    </I18nextProvider>,
  );
};

describe('ColorSchemeMenuItem', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-light');
    document.documentElement.removeAttribute('data-dark');
  });

  it('advertises switching to dark mode while the light scheme is active', async () => {
    renderItem();

    await waitFor(() => {
      expect(document.documentElement.hasAttribute('data-light')).toBe(true);
    });
    expect(screen.getByRole('button', { name: i18n.t('common.darkMode') })).toBeInTheDocument();
  });

  it('flips the color scheme to dark on click and back to light on a second click', async () => {
    const user = userEvent.setup();
    renderItem();

    await waitFor(() => {
      expect(document.documentElement.hasAttribute('data-light')).toBe(true);
      expect(document.documentElement.hasAttribute('data-dark')).toBe(false);
    });

    await user.click(screen.getByRole('button', { name: i18n.t('common.darkMode') }));
    await waitFor(() => {
      expect(document.documentElement.hasAttribute('data-dark')).toBe(true);
      expect(document.documentElement.hasAttribute('data-light')).toBe(false);
    });
    expect(screen.getByRole('button', { name: i18n.t('common.lightMode') })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: i18n.t('common.lightMode') }));
    await waitFor(() => {
      expect(document.documentElement.hasAttribute('data-light')).toBe(true);
      expect(document.documentElement.hasAttribute('data-dark')).toBe(false);
    });
    expect(screen.getByRole('button', { name: i18n.t('common.darkMode') })).toBeInTheDocument();
  });
});
