import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { theme } from '../../../../app/theme';
import { StatePlaceholder } from '../StatePlaceholder';

const renderStatePlaceholder = (props: Parameters<typeof StatePlaceholder>[0]) => {
  return render(
    <ThemeProvider theme={theme} defaultMode="light">
      <StatePlaceholder {...props} />
    </ThemeProvider>,
  );
};

describe('StatePlaceholder', () => {
  it.each(['sleeping', 'empty', 'confused', 'idle'] as const)('renders the %s mascot and the message', variant => {
    const { container } = renderStatePlaceholder({ variant, message: 'Hello there' });

    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('Hello there')).toBeInTheDocument();
  });

  it('renders the sleeping mascot smaller than the empty/error/idle mascots', () => {
    const { container: sleepingContainer } = renderStatePlaceholder({ variant: 'sleeping', message: 'Loading' });
    const { container: emptyContainer } = renderStatePlaceholder({ variant: 'empty', message: 'Empty' });

    const sleepingSvg = sleepingContainer.querySelector('svg');
    const emptySvg = emptyContainer.querySelector('svg');

    expect(sleepingSvg).toHaveAttribute('width', '72');
    expect(emptySvg).toHaveAttribute('width', '88');
  });

  it('renders an action button and calls onClick when provided', () => {
    const onClick = vi.fn();
    renderStatePlaceholder({
      variant: 'empty',
      message: 'Nothing here',
      action: { label: 'Add item', onClick },
    });

    const button = screen.getByRole('button', { name: 'Add item' });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not render an action button when none is provided', () => {
    renderStatePlaceholder({ variant: 'empty', message: 'Nothing here' });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders the action button outlined by default', () => {
    renderStatePlaceholder({
      variant: 'confused',
      message: 'Something failed',
      action: { label: 'Retry', onClick: vi.fn() },
    });

    expect(screen.getByRole('button', { name: 'Retry' })).toHaveClass('MuiButton-outlined');
  });

  it('renders the action button contained when variant is "contained"', () => {
    renderStatePlaceholder({
      variant: 'empty',
      message: 'Nothing here',
      action: { label: 'Add item', onClick: vi.fn(), variant: 'contained' },
    });

    expect(screen.getByRole('button', { name: 'Add item' })).toHaveClass('MuiButton-contained');
  });
});
