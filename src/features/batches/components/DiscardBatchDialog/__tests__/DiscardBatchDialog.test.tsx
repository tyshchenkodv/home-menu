import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { i18n } from '../../../../../app/i18n';
import { theme } from '../../../../../app/theme';
import type { PreparedBatchWithId } from '../../../../../shared/types/preparedBatch';
import { DiscardBatchDialog } from '../DiscardBatchDialog';

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
    preparedAt: timestamp(new Date('2026-07-11T10:00:00Z')),
    expiresAt: null,
    status: 'available',
    sourceCookingRequestId: null,
    createdAt: timestamp(new Date('2026-07-11T10:00:00Z')),
    createdBy: 'admin-uid',
    updatedAt: timestamp(new Date('2026-07-11T10:00:00Z')),
    updatedBy: 'admin-uid',
    ...overrides,
  }) as unknown as PreparedBatchWithId;

const renderDialog = (batch: PreparedBatchWithId) =>
  render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme} defaultMode="light">
        <DiscardBatchDialog open batch={batch} onCancel={vi.fn()} onConfirm={vi.fn()} />
      </ThemeProvider>
    </I18nextProvider>,
  );

/**
 * Dialog 6 (`docs/design/screens/shared-patterns.md` 05e·6): a centered
 * round "!" badge on `error.light` sits above the title.
 */
describe('DiscardBatchDialog', () => {
  it('renders the centered "!" badge tinted with the error palette', () => {
    renderDialog(buildBatch());

    const badge = screen.getByTestId('discard-batch-dialog-badge');
    expect(badge).toHaveTextContent('!');
    // `theme.palette.error.light` resolves to the light scheme's literal
    // color here (matching the existing CancelOrderDialog badge pattern),
    // not a CSS custom-property reference.
    expect(getComputedStyle(badge).backgroundColor).toBe('rgb(249, 210, 210)');
  });

  it('renders the singular portion count correctly', () => {
    renderDialog(buildBatch({ availableQuantity: 1 }));

    expect(screen.getByText(/1 вільна порція/)).toBeInTheDocument();
  });

  it('renders the plural portion count correctly', () => {
    renderDialog(buildBatch({ availableQuantity: 5 }));

    expect(screen.getByText(/5 вільних порцій/)).toBeInTheDocument();
  });
});
