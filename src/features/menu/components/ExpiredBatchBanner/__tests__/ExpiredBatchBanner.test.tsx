import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { i18n } from '../../../../../app/i18n';
import { theme } from '../../../../../app/theme';
import type { PreparedBatchWithId } from '../../../../../shared/types/preparedBatch';
import { ExpiredBatchBanner } from '../ExpiredBatchBanner';

const ADMIN_UID = 'admin-uid';
const timestamp = (millis: number) => ({ toMillis: () => millis }) as never;

const buildBatch = (overrides: Partial<PreparedBatchWithId> = {}): PreparedBatchWithId => ({
  id: 'batch-1',
  dishId: 'dish-risotto',
  dishName: 'Грибне різото',
  batchNumber: 1,
  producedQuantity: 4,
  availableQuantity: 3,
  reservedQuantity: 0,
  consumedQuantity: 1,
  discardedQuantity: 0,
  preparedAt: timestamp(Date.UTC(2026, 0, 5, 10, 0)),
  expiresAt: timestamp(Date.UTC(2026, 0, 6, 10, 0)),
  status: 'available',
  sourceCookingRequestId: null,
  createdAt: timestamp(0),
  createdBy: ADMIN_UID,
  updatedAt: timestamp(0),
  updatedBy: ADMIN_UID,
  ...overrides,
});

const renderBanner = (batches: PreparedBatchWithId[]) =>
  render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <ExpiredBatchBanner batches={batches} />
        </MemoryRouter>
      </ThemeProvider>
    </I18nextProvider>,
  );

beforeEach(() => {
  void i18n.changeLanguage('uk');
});

describe('ExpiredBatchBanner', () => {
  it('renders the expired chip, title, date-aware body, and a CTA to the admin batches route', () => {
    renderBanner([buildBatch()]);

    expect(screen.getByText('⚠ Прострочено')).toBeInTheDocument();
    expect(screen.getByText(i18n.t('menu.expiredBanner.title'))).toBeInTheDocument();
    expect(screen.getByText(/5 січ/i)).toBeInTheDocument();

    const cta = screen.getByRole('link', { name: 'До доступних порцій →' });
    expect(cta).toHaveAttribute('href', '/admin/batches');
  });

  it('uses the earliest preparedAt when several backing batches are expired', () => {
    renderBanner([
      buildBatch({ id: 'batch-2', preparedAt: timestamp(Date.UTC(2026, 0, 8, 10, 0)) }),
      buildBatch({ id: 'batch-1', preparedAt: timestamp(Date.UTC(2026, 0, 5, 10, 0)) }),
    ]);

    expect(screen.getByText(/5 січ/i)).toBeInTheDocument();
    expect(screen.queryByText(/8 січ/i)).not.toBeInTheDocument();
  });
});
