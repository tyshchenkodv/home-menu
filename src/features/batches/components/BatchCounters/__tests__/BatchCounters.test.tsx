import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { i18n } from '../../../../../app/i18n';
import { theme } from '../../../../../app/theme';
import type { PreparedBatchWithId } from '../../../../../shared/types/preparedBatch';
import { BatchCounters } from '../BatchCounters';

const NOW = { toDate: () => new Date('2026-07-11T10:00:00Z'), toMillis: () => 1_784_275_200_000 } as never;

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
    preparedAt: NOW,
    expiresAt: NOW,
    status: 'available',
    sourceCookingRequestId: null,
    createdAt: NOW,
    createdBy: 'admin-uid',
    updatedAt: NOW,
    updatedBy: 'admin-uid',
    ...overrides,
  }) as unknown as PreparedBatchWithId;

const renderCounters = (batch: PreparedBatchWithId) =>
  render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme} defaultMode="light">
        <BatchCounters batch={batch} />
      </ThemeProvider>
    </I18nextProvider>,
  );

/**
 * 05d BatchCard counters strip tint matrix
 * (`docs/design/screens/shared-patterns.md`): available = success tint,
 * reserved = primary tint (secondary when fully reserved), consumed/discarded
 * = neutral grey. The pastel `.light` cell fills re-tone via CSS variables, but
 * the number ink on a tinted cell is PINNED to the light scheme's `.dark` tone
 * (a fixed literal, not a flipping CSS variable) so it stays readable on the
 * pastel fill in dark mode too — the same rationale as StatusChip's filled ink.
 */
describe('BatchCounters', () => {
  it('tints the available cell with the success palette', () => {
    renderCounters(buildBatch());

    const cell = screen.getByText('2').closest('div') as HTMLElement;
    expect(getComputedStyle(cell).backgroundColor).toContain('--mui-palette-success-light');
    // Light-scheme success.dark (computed from #3FB98C), pinned so it never flips.
    expect(getComputedStyle(screen.getByText('2')).color).toBe('rgb(44, 129, 98)');
  });

  it('tints the reserved cell with the primary palette when not fully reserved', () => {
    renderCounters(buildBatch({ availableQuantity: 2, reservedQuantity: 3 }));

    const cell = screen.getByText('3').closest('div') as HTMLElement;
    expect(getComputedStyle(cell).backgroundColor).toContain('--mui-palette-primary-light');
    // Light-scheme primary.dark (#B8446F), pinned so it never flips.
    expect(getComputedStyle(screen.getByText('3')).color).toBe('rgb(184, 68, 111)');
  });

  it('tints the reserved cell with the secondary palette when fully reserved', () => {
    renderCounters(buildBatch({ availableQuantity: 0, reservedQuantity: 5 }));

    const cell = screen.getByText('5').closest('div') as HTMLElement;
    expect(getComputedStyle(cell).backgroundColor).toContain('--mui-palette-secondary-light');
    // Light-scheme secondary.dark (#6F5FB3), pinned so it never flips.
    expect(getComputedStyle(screen.getByText('5')).color).toBe('rgb(111, 95, 179)');
  });

  it('pins the label ink on tinted cells so it stays readable on the pastel fill', () => {
    renderCounters(buildBatch());

    // Light-scheme text.secondary (#7A6B72), pinned so the label does not flip
    // to near-white over the pastel available/reserved fills in dark mode.
    const availableCell = screen.getByText('2').closest('div') as HTMLElement;
    const availableLabel = availableCell.querySelector('.MuiTypography-caption');
    if (!(availableLabel instanceof HTMLElement)) {
      throw new Error('expected a caption label in the available cell');
    }
    expect(getComputedStyle(availableLabel).color).toBe('rgb(122, 107, 114)');
  });

  it('renders consumed and discarded cells with a neutral grey tone', () => {
    renderCounters(buildBatch({ consumedQuantity: 4, discardedQuantity: 1 }));

    const consumedNumber = screen.getByText('4');
    const discardedNumber = screen.getByText('1');
    expect(getComputedStyle(consumedNumber).color).toContain('--mui-palette-text-secondary');
    expect(getComputedStyle(discardedNumber).color).toContain('--mui-palette-text-secondary');
  });

  it('always shows an explicit 0 rather than hiding an empty counter', () => {
    renderCounters(buildBatch({ consumedQuantity: 0 }));

    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });
});
