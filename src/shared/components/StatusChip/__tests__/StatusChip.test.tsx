import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusChip } from '../StatusChip';

describe('StatusChip', () => {
  it('renders the given label', () => {
    render(<StatusChip label="In stock" color="success" />);

    expect(screen.getByText('In stock')).toBeInTheDocument();
  });

  it('applies the success color', () => {
    render(<StatusChip label="In stock" color="success" />);

    expect(screen.getByText('In stock').closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess');
  });

  it('applies the warning color', () => {
    render(<StatusChip label="Low stock" color="warning" />);

    expect(screen.getByText('Low stock').closest('.MuiChip-root')).toHaveClass('MuiChip-colorWarning');
  });

  it('applies the default color', () => {
    render(<StatusChip label="Out of stock" color="default" />);

    expect(screen.getByText('Out of stock').closest('.MuiChip-root')).toHaveClass('MuiChip-colorDefault');
  });

  it('applies the secondary color', () => {
    render(<StatusChip label="Not configured" color="secondary" />);

    expect(screen.getByText('Not configured').closest('.MuiChip-root')).toHaveClass('MuiChip-colorSecondary');
  });

  it('applies the primary color', () => {
    render(<StatusChip label="Pending" color="primary" />);

    expect(screen.getByText('Pending').closest('.MuiChip-root')).toHaveClass('MuiChip-colorPrimary');
  });

  it('applies the info color', () => {
    render(<StatusChip label="Approved" color="info" />);

    expect(screen.getByText('Approved').closest('.MuiChip-root')).toHaveClass('MuiChip-colorInfo');
  });

  it('applies the error color', () => {
    render(<StatusChip label="Rejected" color="error" />);

    expect(screen.getByText('Rejected').closest('.MuiChip-root')).toHaveClass('MuiChip-colorError');
  });

  it('applies the outlined variant when requested', () => {
    render(<StatusChip label="Cancelled" color="default" variant="outlined" />);

    expect(screen.getByText('Cancelled').closest('.MuiChip-root')).toHaveClass('MuiChip-outlined');
  });
});
