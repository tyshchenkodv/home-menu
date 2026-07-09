import { ThemeProvider } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it } from 'vitest';

import { i18n } from '../../../../app/i18n';
import { theme } from '../../../../app/theme';
import { ColorSchemeToggle } from '../ColorSchemeToggle';

const renderToggle = () => {
  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme} defaultMode="light">
        <ColorSchemeToggle />
      </ThemeProvider>
    </I18nextProvider>,
  );
};

describe('ColorSchemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-light');
    document.documentElement.removeAttribute('data-dark');
  });

  it('renders with the accessible name from translations', () => {
    renderToggle();

    expect(screen.getByRole('button', { name: i18n.t('common.toggleDarkMode') })).toBeInTheDocument();
  });

  it('flips the color scheme to dark on click and back to light on a second click', async () => {
    const user = userEvent.setup();
    renderToggle();

    const button = screen.getByRole('button', { name: i18n.t('common.toggleDarkMode') });

    await waitFor(() => {
      expect(document.documentElement.hasAttribute('data-light')).toBe(true);
      expect(document.documentElement.hasAttribute('data-dark')).toBe(false);
    });

    await user.click(button);
    await waitFor(() => {
      expect(document.documentElement.hasAttribute('data-dark')).toBe(true);
      expect(document.documentElement.hasAttribute('data-light')).toBe(false);
    });

    await user.click(button);
    await waitFor(() => {
      expect(document.documentElement.hasAttribute('data-light')).toBe(true);
      expect(document.documentElement.hasAttribute('data-dark')).toBe(false);
    });
  });
});
