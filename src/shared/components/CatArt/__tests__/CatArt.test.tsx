import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { theme } from '../../../../app/theme';
import { CatArt } from '../CatArt';

const renderCatArt = (props: Parameters<typeof CatArt>[0]) => {
  return render(
    <ThemeProvider theme={theme} defaultMode="light">
      <CatArt {...props} />
    </ThemeProvider>,
  );
};

describe('CatArt', () => {
  it.each(['idle', 'empty', 'sleeping', 'confused', 'logo'] as const)('renders an svg for the %s variant', variant => {
    const { container } = renderCatArt({ variant });

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies the size prop to the svg width and height', () => {
    const { container } = renderCatArt({ variant: 'idle', size: 48 });

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });

  it('uses a default size of 96 when size is not provided', () => {
    const { container } = renderCatArt({ variant: 'idle' });

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '96');
    expect(svg).toHaveAttribute('height', '96');
  });

  it('exposes an accessible name when a title is provided', () => {
    renderCatArt({ variant: 'idle', title: 'Happy cat' });

    expect(screen.getByRole('img', { name: 'Happy cat' })).toBeInTheDocument();
  });

  it('is hidden from assistive technology when no title is provided', () => {
    const { container } = renderCatArt({ variant: 'idle' });

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});
