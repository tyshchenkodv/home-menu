import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { theme } from '../../../../../app/theme';
import { EmptyState } from '../EmptyState';

describe('EmptyState (admin dashboard)', () => {
  it('renders the idle mascot, not the empty-bowl mascot', () => {
    const { container } = render(
      <ThemeProvider theme={theme} defaultMode="light">
        <EmptyState message="Nothing needs attention right now." title="All calm" />
      </ThemeProvider>,
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('All calm')).toBeInTheDocument();
    expect(screen.getByText('Nothing needs attention right now.')).toBeInTheDocument();
    // The idle cat art includes a raised waving paw path that only exists on
    // the `idle` variant, distinguishing it from the empty-bowl mascot.
    expect(container.querySelector('path[d="M150 176 C188 172 194 138 166 130"]')).toBeInTheDocument();
  });
});
