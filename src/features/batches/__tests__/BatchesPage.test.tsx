import { render, screen, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import '../../../app/i18n';
import type { AuthContextValue } from '../../auth/authContextValue';
import type { PreparedBatchWithId } from '../../../shared/types/preparedBatch';

const ADMIN_USER = { uid: 'admin-uid', email: 'admin@example.test' } as unknown as User;

vi.mock('../../auth/useAuth', () => ({
  useAuth: (): AuthContextValue => ({ user: ADMIN_USER, profile: null, status: 'authenticated' }),
}));

const mockSubscribeAllBatches = vi.fn();

vi.mock('../../../infrastructure/firebase/services/batchService', () => ({
  subscribeAllBatches: (...args: unknown[]): unknown => mockSubscribeAllBatches(...args),
}));

const mockDiscardBatch = vi.fn();
const mockRegisterBatch = vi.fn();

vi.mock('../../../infrastructure/firebase/services/orderTransactions', () => ({
  discardBatch: (...args: unknown[]): unknown => mockDiscardBatch(...args),
  registerBatch: (...args: unknown[]): unknown => mockRegisterBatch(...args),
}));

const { BatchesPage } = await import('../pages/BatchesPage');

const PREPARED_AT = { toDate: () => new Date('2026-07-11T10:00:00Z'), toMillis: () => 1_784_275_200_000 } as never;
const EXPIRES_AT = { toDate: () => new Date('2026-07-12T10:00:00Z'), toMillis: () => 1_784_361_600_000 } as never;

const buildBatch = (overrides: Partial<PreparedBatchWithId> = {}): PreparedBatchWithId =>
  ({
    id: 'batch-1',
    dishId: 'dish-1',
    dishName: 'Mushroom risotto',
    producedQuantity: 5,
    availableQuantity: 2,
    reservedQuantity: 3,
    consumedQuantity: 0,
    discardedQuantity: 0,
    preparedAt: PREPARED_AT,
    expiresAt: EXPIRES_AT,
    status: 'available',
    sourceCookingRequestId: null,
    createdAt: PREPARED_AT,
    createdBy: 'admin-uid',
    updatedAt: PREPARED_AT,
    updatedBy: 'admin-uid',
    ...overrides,
  }) as unknown as PreparedBatchWithId;

describe('BatchesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders its translated heading', async () => {
    mockSubscribeAllBatches.mockImplementation((onNext: (batches: PreparedBatchWithId[]) => void) => {
      onNext([]);
      return vi.fn();
    });

    render(<BatchesPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Доступні порції' })).toBeInTheDocument();
    });
  });

  it('renders batches when available', async () => {
    const batch = buildBatch();

    mockSubscribeAllBatches.mockImplementation((onNext: (batches: PreparedBatchWithId[]) => void) => {
      onNext([batch]);
      return vi.fn();
    });

    render(<BatchesPage />);

    await waitFor(() => {
      expect(screen.getByText('Mushroom risotto')).toBeInTheDocument();
    });
  });

  it('displays empty state when no batches', async () => {
    mockSubscribeAllBatches.mockImplementation((onNext: (batches: PreparedBatchWithId[]) => void) => {
      onNext([]);
      return vi.fn();
    });

    render(<BatchesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Порція з'явиться/i)).toBeInTheDocument();
    });
  });

  it('shows the empty-state headline alongside the body copy', async () => {
    mockSubscribeAllBatches.mockImplementation((onNext: (batches: PreparedBatchWithId[]) => void) => {
      onNext([]);
      return vi.fn();
    });

    render(<BatchesPage />);

    await waitFor(() => {
      expect(screen.getByText('Немає доступних порцій')).toBeInTheDocument();
    });
  });

  it('shows the error-state headline alongside the body copy', async () => {
    mockSubscribeAllBatches.mockImplementation(
      (_onNext: (batches: PreparedBatchWithId[]) => void, onError: (error: Error) => void) => {
        onError(new Error('boom'));
        return vi.fn();
      },
    );

    render(<BatchesPage />);

    await waitFor(() => {
      expect(screen.getByText('Не вдалося завантажити')).toBeInTheDocument();
    });
  });
});
