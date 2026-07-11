import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { i18n } from '../../../../app/i18n';
import { LanguageSwitcher } from '../LanguageSwitcher';

const renderSwitcher = () => {
  return render(
    <I18nextProvider i18n={i18n}>
      <LanguageSwitcher />
    </I18nextProvider>,
  );
};

describe('LanguageSwitcher', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await i18n.changeLanguage('uk');
  });

  afterEach(async () => {
    await i18n.changeLanguage('uk');
  });

  it('renders the UK and EN controls with UK pressed initially', () => {
    renderSwitcher();

    const ukButton = screen.getByRole('button', { name: i18n.t('common.languageUk') });
    const enButton = screen.getByRole('button', { name: i18n.t('common.languageEn') });

    expect(ukButton).toBeInTheDocument();
    expect(enButton).toBeInTheDocument();
    expect(ukButton).toHaveAttribute('aria-pressed', 'true');
    expect(enButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches language to en and persists it on click', async () => {
    const user = userEvent.setup();
    renderSwitcher();

    const enButton = screen.getByRole('button', { name: i18n.t('common.languageEn') });
    await user.click(enButton);

    expect(i18n.language).toBe('en');
    expect(window.localStorage.getItem('home-menu-language')).toBe('en');
  });
});
