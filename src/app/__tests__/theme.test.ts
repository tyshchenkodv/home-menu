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

  describe('typography variants used by feature components', () => {
    it('defines h4 as a compact card-title heading in Nunito', () => {
      expect(theme.typography.h4.fontFamily).toContain('Nunito');
      expect(theme.typography.h4.fontWeight).toBeDefined();
      expect(theme.typography.h4.fontSize).toBeDefined();
      // MUI's unstyled default is 2.125rem; the canon compact card title must
      // be explicitly smaller than that (roughly between h5 1rem and h3 1.25rem).
      expect(theme.typography.h4.fontSize).not.toBe('2.125rem');
    });

    it('defines h6 in Nunito for dialog titles and the header wordmark', () => {
      expect(theme.typography.h6.fontFamily).toContain('Nunito');
      expect(theme.typography.h6.fontWeight).toBeDefined();
      expect(theme.typography.h6.fontSize).toBeDefined();
    });

    it('defines subtitle2 for small bold section labels', () => {
      expect(theme.typography.subtitle2.fontWeight).toBeDefined();
      expect(theme.typography.subtitle2.fontSize).toBeDefined();
    });

    it('defines caption for meta text', () => {
      expect(theme.typography.caption.fontWeight).toBeDefined();
      expect(theme.typography.caption.fontSize).toBeDefined();
    });
  });

  describe('dark-scheme component tokens', () => {
    it('resolves the MuiCard border through the divider CSS variable, not a hardcoded light literal', () => {
      const root = theme.components?.MuiCard?.styleOverrides?.root;
      // Scheme-aware overrides use the function form of `styleOverrides` so
      // the border can reference `theme.vars.palette.divider`. MUI's css-vars
      // output is `var(--mui-palette-divider, <light fallback>)`, which is
      // expected to include the light hex as the CSS fallback value — the
      // important part is that resolution goes through the variable (so the
      // dark scheme's own `[data-dark] { --mui-palette-divider: ... }` rule
      // wins), not a literal `border: '1px solid #F3DDE5'` with no variable.
      expect(typeof root).toBe('function');
      // `styleOverrides` functions are typed to require `ownerState`, which
      // this unit test has no reason to construct; only `theme` is read.
      const resolved = typeof root === 'function' ? root({ theme } as never) : root;
      expect(JSON.stringify(resolved)).toContain('var(--mui-palette-divider');
      expect(JSON.stringify(resolved)).not.toContain('solid #F3DDE5');
    });

    it('resolves the MuiBottomNavigation border through the divider CSS variable, not a hardcoded light literal', () => {
      const root = theme.components?.MuiBottomNavigation?.styleOverrides?.root;
      expect(typeof root).toBe('function');
      const resolved = typeof root === 'function' ? root({ theme } as never) : root;
      expect(JSON.stringify(resolved)).toContain('var(--mui-palette-divider');
      expect(JSON.stringify(resolved)).not.toContain('solid #F3DDE5');
    });

    it('gives outlined inputs an opaque fill in both schemes so fields never read as transparent', () => {
      const root = theme.components?.MuiOutlinedInput?.styleOverrides?.root;
      expect(typeof root).toBe('function');
      const resolved = typeof root === 'function' ? root({ theme } as never) : root;
      const serialized = JSON.stringify(resolved);
      // Light scheme: canon white fill (shared-patterns 05f).
      expect(serialized).toContain('#FFFFFF');
      // Dark scheme override is emitted under the css-vars dark selector so it
      // wins over the base white fill on dark surfaces.
      expect(serialized).toContain('#352C33');
    });
  });
});
