import { ThemeProvider } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { i18n } from '../../../../../app/i18n';
import { theme } from '../../../../../app/theme';
import type { OrderWithId } from '../../../../../shared/types/order';
import { AdminOrderCard } from '../AdminOrderCard';

const scheduledFor = { toMillis: () => 1_700_000_000_000 };

const buildOrder = (overrides: Record<string, unknown> = {}): OrderWithId =>
  ({
    id: 'order-1',
    userId: 'user-1',
    userDisplayName: 'Olena',
    dishId: 'dish-1',
    dishName: 'Mushroom risotto',
    kind: 'ready',
    status: 'reserved',
    quantity: 2,
    mealType: 'lunch',
    scheduledFor,
    allocations: [{ batchId: 'batch-abcd1234', quantity: 2 }],
    rejectionReason: null,
    preparedBatchId: null,
    preparedBatchNumber: null,
    createdAt: scheduledFor,
    createdBy: 'user-1',
    updatedAt: scheduledFor,
    updatedBy: 'user-1',
    ...overrides,
  }) as unknown as OrderWithId;

const renderCard = (props: Partial<React.ComponentProps<typeof AdminOrderCard>> = {}) =>
  render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <AdminOrderCard order={buildOrder()} {...props} />
      </ThemeProvider>
    </I18nextProvider>,
  );

describe('AdminOrderCard reserved branch', () => {
  it('renders "Mark consumed" and "Cancel" buttons for a reserved order and invokes the commands', async () => {
    const user = userEvent.setup();
    const onConsume = vi.fn();
    const onCancel = vi.fn();

    renderCard({ onConsume, onCancel });

    const card = screen.getByTestId('admin-order-card');
    await user.click(within(card).getByRole('button', { name: 'Позначити спожитим' }));
    expect(onConsume).toHaveBeenCalledWith(expect.objectContaining({ id: 'order-1' }));

    await user.click(within(card).getByRole('button', { name: 'Скасувати' }));
    expect(onCancel).toHaveBeenCalledWith(expect.objectContaining({ id: 'order-1' }));
  });

  it('renders no reserved-branch buttons when onConsume/onCancel are omitted (read-only History row)', () => {
    renderCard();

    expect(screen.queryByRole('button', { name: 'Позначити спожитим' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Скасувати' })).not.toBeInTheDocument();
  });
});

describe('AdminOrderCard batch meta line', () => {
  it('renders the zero-padded stored batch number when present', () => {
    renderCard({
      order: buildOrder({ status: 'prepared', preparedBatchId: 'batch-abcd1234', preparedBatchNumber: 7 }),
    });

    expect(screen.getByText('Olena · порція #007')).toBeInTheDocument();
  });

  it('falls back to the id-derived code for a legacy batch with no stored number', () => {
    renderCard({
      order: buildOrder({ status: 'prepared', preparedBatchId: 'batch-abcd1234', preparedBatchNumber: null }),
    });

    expect(screen.getByText('Olena · порція #1234')).toBeInTheDocument();
  });
});
