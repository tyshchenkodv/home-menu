import { beforeEach, describe, expect, it } from 'vitest';

import en from '../en/translation.json';
import uk from '../uk/translation.json';

interface TranslationTree {
  [key: string]: string | TranslationTree;
}

const flattenKeys = (tree: TranslationTree, prefix = ''): string[] => {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      return [path];
    }

    return flattenKeys(value, path);
  });
};

describe('locale parity', () => {
  it('has identical flattened key sets for uk and en', () => {
    const ukKeys = flattenKeys(uk).sort();
    const enKeys = flattenKeys(en).sort();

    expect(ukKeys).toEqual(enKeys);
  });
});

describe('i18n initialization', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to uk when no language preference is stored', async () => {
    const { i18n } = await import('../../app/i18n');
    await i18n.init();

    expect(i18n.language).toBe('uk');
  });

  it('falls back to en for unsupported languages', async () => {
    const { i18n } = await import('../../app/i18n');

    expect(i18n.options.fallbackLng).toEqual(['en']);
  });

  it('reports uk and en as the supported languages', async () => {
    const { i18n } = await import('../../app/i18n');

    expect(i18n.options.supportedLngs).toEqual(expect.arrayContaining(['uk', 'en']));
  });
});
