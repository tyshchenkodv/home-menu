import '@testing-library/jest-dom/vitest';

// MUI `useMediaQuery` requires `window.matchMedia`, which jsdom implements
// only partially. Default to "no match" (the mobile/below-`md` branch);
// tests that need the desktop branch reassign `window.matchMedia` themselves.
window.matchMedia = (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }) as MediaQueryList;
