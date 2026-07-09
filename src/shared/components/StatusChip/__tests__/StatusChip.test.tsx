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
});
