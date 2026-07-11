import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { i18n } from '../../../../../app/i18n';
import { theme } from '../../../../../app/theme';
import type { PreparedBatchWithId } from '../../../../../shared/types/preparedBatch';
import { BatchCard } from '../BatchCard';

const HOUR = 60 * 60 * 1000;
const NOW = new Date('2026-07-11T10:00:00Z');
const timestamp = (date: Date) => ({ toDate: () => date, toMillis: () => date.getTime() }) as never;

const buildBatch = (overrides: Partial<PreparedBatchWithId> = {}): PreparedBatchWithId =>
  ({
    id: 'batch-1',
    dishId: 'dish-1',
    dishName: 'Baked salmon',
    producedQuantity: 5,
    availableQuantity: 3,
    reservedQuantity: 0,
    consumedQuantity: 0,
    discardedQuantity: 0,
    preparedAt: timestamp(new Date(NOW.getTime() - 2 * HOUR)),
    expiresAt: timestamp(new Date(NOW.getTime() + 48 * HOUR)),
    status: 'available',
    sourceCookingRequestId: null,
    createdAt: timestamp(NOW),
    createdBy: 'admin-uid',
    updatedAt: timestamp(NOW),
    updatedBy: 'admin-uid',
    ...overrides,
  }) as unknown as PreparedBatchWithId;

const renderCard = (batch: PreparedBatchWithId) =>
  render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme} defaultMode="light">
        <BatchCard batch={batch} now={NOW} onDiscard={() => undefined} />
      </ThemeProvider>
    </I18nextProvider>,
  );

/**
 * 05d BatchCard status matrix discard-button mapping
 * (`docs/design/screens/shared-patterns.md`): fresh/expiring get the
 * "Discard…" label, expired gets the count label with a contained error
 * button, fully reserved is disabled with the explanatory label.
 */
describe('BatchCard discard action', () => {
  it('fresh: shows an outlined neutral "Discard…" button', () => {
    renderCard(buildBatch());

    const button = screen.getByRole('button', { name: 'Утилізувати…' });
    expect(button).toBeEnabled();
    expect(button).toHaveClass('MuiButton-outlined');
    expect(button).not.toHaveClass('MuiButton-colorWarning');
    expect(button).not.toHaveClass('MuiButton-colorError');
  });

  it('expiring soon: shows an outlined warning "Discard…" button', () => {
    renderCard(buildBatch({ expiresAt: timestamp(new Date(NOW.getTime() + 2 * HOUR)) }));

    const button = screen.getByRole('button', { name: 'Утилізувати…' });
    expect(button).toBeEnabled();
    expect(button).toHaveClass('MuiButton-outlined');
    expect(button).toHaveClass('MuiButton-colorWarning');
  });

  it('expired: shows a contained error button with the portion count', () => {
    renderCard(buildBatch({ expiresAt: timestamp(new Date(NOW.getTime() - HOUR)), availableQuantity: 3 }));

    const button = screen.getByRole('button', { name: 'Утилізувати 3 порції' });
    expect(button).toBeEnabled();
    expect(button).toHaveClass('MuiButton-contained');
    expect(button).toHaveClass('MuiButton-colorError');
  });

  it('fully reserved: shows a disabled button with the explanatory label', () => {
    renderCard(buildBatch({ availableQuantity: 0, reservedQuantity: 4 }));

    const button = screen.getByRole('button', { name: 'Утилізувати — усі порції зарезервовані' });
    expect(button).toBeDisabled();
  });

  it('discarded: renders the status chip outlined', () => {
    renderCard(
      buildBatch({
        status: 'discarded',
        availableQuantity: 0,
        discardedQuantity: 3,
      }),
    );

    const chip = screen.getByText('Утилізована').closest('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-outlined');
  });
});

describe('BatchCard expired meta line', () => {
  it('interpolates the prepared date and relative-date values (uk)', () => {
    renderCard(buildBatch({ expiresAt: timestamp(new Date(NOW.getTime() - HOUR)) }));

    expect(screen.getByText(/термін минув Вчора/)).toBeInTheDocument();
  });
});
