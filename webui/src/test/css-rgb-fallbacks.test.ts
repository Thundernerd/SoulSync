import { describe, expect, it } from 'vitest';

import { legacySheets, moduleSheets, readCss } from './css-files';

/**
 * An `-rgb` custom property holds a bare channel triple for
 * `rgba(var(--x-rgb), a)`. Its fallback has to be the same shape: a
 * space-separated `88 101 242` makes `rgba(88 101 242, 0.16)`, which is invalid,
 * so whenever the var is unset the whole declaration silently drops out.
 */
describe('-rgb fallbacks', () => {
  it('are comma-separated triples or another var', () => {
    const bad: string[] = [];
    for (const file of [...legacySheets(), ...moduleSheets()]) {
      for (const [use, fallback] of readCss(file).matchAll(
        /var\(\s*--[\w-]+-rgb\s*,\s*([^)]*)\)/g,
      )) {
        const value = fallback.trim();
        if (
          !/^\d+(\.\d+)?\s*,\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?$/.test(value) &&
          !value.startsWith('var(')
        ) {
          bad.push(`${file}: ${use}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
