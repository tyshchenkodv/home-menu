import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
  it.each(['sleeping', 'empty', 'confused'] as const)('renders the %s mascot and the message', variant => {
    const { container } = renderStatePlaceholder({ variant, message: 'Hello there' });

    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('Hello there')).toBeInTheDocument();
  });
});
