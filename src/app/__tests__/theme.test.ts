import { describe, expect, it } from 'vitest';

import { theme } from '../theme';

describe('theme', () => {
  it('defines light and dark color schemes', () => {
    expect(theme.colorSchemes.light).toBeDefined();
    expect(theme.colorSchemes.dark).toBeDefined();
  });

  it('uses the canon brand rose as primary.main per scheme', () => {
    expect(theme.colorSchemes.light?.palette.primary.main).toBe('#E36397');
    expect(theme.colorSchemes.dark?.palette.primary.main).toBe('#F49CBF');
  });

  it('uses the canon background.default per scheme', () => {
    expect(theme.colorSchemes.light?.palette.background.default).toBe('#FDF2F6');
    expect(theme.colorSchemes.dark?.palette.background.default).toBe('#1E1A1D');
  });

  it('uses a 14px global border radius', () => {
    expect(theme.shape.borderRadius).toBe(14);
  });

  it('uses an 8px spacing unit', () => {
    // With `cssVariables` enabled, MUI emits a calc() expression referencing
    // the CSS variable rather than a literal pixel string, so assert against
    // the variable's fallback value instead of the resolved string.
    expect(theme.spacing(2)).toBe('calc(2 * var(--mui-spacing, 8px))');
  });
});
