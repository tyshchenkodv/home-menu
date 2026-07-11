import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { theme } from '../../../../app/theme';
import { StatusChip } from '../StatusChip';

const renderStatusChip = (props: Parameters<typeof StatusChip>[0]) =>
  render(
    <ThemeProvider theme={theme} defaultMode="light">
      <StatusChip {...props} />
    </ThemeProvider>,
  );

describe('StatusChip', () => {
  it('renders the given label', () => {
    renderStatusChip({ label: 'In stock', color: 'success' });

    expect(screen.getByText('In stock')).toBeInTheDocument();
  });

  it('renders a leading status dot', () => {
    renderStatusChip({ label: 'In stock', color: 'success' });

    expect(screen.getByTestId('status-chip-dot')).toBeInTheDocument();
  });

  it('tints the chip background with the light palette token instead of the saturated main color', () => {
    renderStatusChip({ label: 'In stock', color: 'success' });

    const chip = screen.getByText('In stock').closest('.MuiChip-root');
    if (!chip) throw new Error('chip not found');
    // `theme.vars` resolves to `var(--mui-palette-success-light)` (a CSS
    // custom-property reference, not the literal color) so it re-tones
    // automatically in dark mode; jsdom doesn't resolve custom properties,
    // so we assert the chip references that variable rather than a literal
    // rgb value.
    expect(getComputedStyle(chip).backgroundColor).toContain('--mui-palette-success-light');
  });

  it('uses a fixed dark ink for the filled label so it stays readable on the pastel fill in both schemes', () => {
    renderStatusChip({ label: 'In stock', color: 'success' });

    const chip = screen.getByText('In stock').closest('.MuiChip-root');
    if (!chip) throw new Error('chip not found');
    // Pinned to the light scheme's `text.primary` (#3A2E34 → rgb(58, 46, 52)),
    // NOT the active scheme's `text.primary` (which is near-white in dark
    // mode and would render light-on-light on the light pastel fill).
    expect(getComputedStyle(chip).color).toBe('rgb(58, 46, 52)');
  });

  it('applies the success color', () => {
    renderStatusChip({ label: 'In stock', color: 'success' });

    expect(screen.getByText('In stock').closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess');
  });

  it('applies the warning color', () => {
    renderStatusChip({ label: 'Low stock', color: 'warning' });

    expect(screen.getByText('Low stock').closest('.MuiChip-root')).toHaveClass('MuiChip-colorWarning');
  });

  it('applies the default color', () => {
    renderStatusChip({ label: 'Out of stock', color: 'default' });

    expect(screen.getByText('Out of stock').closest('.MuiChip-root')).toHaveClass('MuiChip-colorDefault');
  });

  it('applies the secondary color', () => {
    renderStatusChip({ label: 'Not configured', color: 'secondary' });

    expect(screen.getByText('Not configured').closest('.MuiChip-root')).toHaveClass('MuiChip-colorSecondary');
  });

  it('applies the primary color', () => {
    renderStatusChip({ label: 'Pending', color: 'primary' });

    expect(screen.getByText('Pending').closest('.MuiChip-root')).toHaveClass('MuiChip-colorPrimary');
  });

  it('applies the info color', () => {
    renderStatusChip({ label: 'Approved', color: 'info' });

    expect(screen.getByText('Approved').closest('.MuiChip-root')).toHaveClass('MuiChip-colorInfo');
  });

  it('applies the error color', () => {
    renderStatusChip({ label: 'Rejected', color: 'error' });

    expect(screen.getByText('Rejected').closest('.MuiChip-root')).toHaveClass('MuiChip-colorError');
  });

  it('applies the outlined variant when requested', () => {
    renderStatusChip({ label: 'Cancelled', color: 'default', variant: 'outlined' });

    expect(screen.getByText('Cancelled').closest('.MuiChip-root')).toHaveClass('MuiChip-outlined');
  });
});
