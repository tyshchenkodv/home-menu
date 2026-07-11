import { describe, expect, it } from 'vitest';
import ukTranslation from '../uk/translation.json';
import enTranslation from '../en/translation.json';

/**
 * Recursive key path collection: traverses an object and collects all dot-separated
 * paths (e.g., `settings.mealTimes.title`).
 */
function collectKeyPaths(obj: unknown, prefix = ''): Set<string> {
  const paths = new Set<string>();

  if (obj === null || typeof obj !== 'object' || obj instanceof Date || obj instanceof Array) {
    return paths;
  }

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    paths.add(path);

    if (value !== null && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
      for (const subPath of collectKeyPaths(value, path)) {
        paths.add(subPath);
      }
    }
  }

  return paths;
}

describe('Locale parity', () => {
  it('both locales contain the exact same set of keys', () => {
    const ukPaths = collectKeyPaths(ukTranslation);
    const enPaths = collectKeyPaths(enTranslation);

    const missingInEn = [...ukPaths].filter(p => !enPaths.has(p)).sort();
    const missingInUk = [...enPaths].filter(p => !ukPaths.has(p)).sort();

    expect(missingInEn, 'Missing in EN').toHaveLength(0);
    expect(missingInUk, 'Missing in UK').toHaveLength(0);
    expect(ukPaths).toEqual(enPaths);
  });
});
