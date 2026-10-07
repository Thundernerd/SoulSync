import { dirname, join, normalize } from 'node:path';
import { describe, expect, it } from 'vitest';

import { listFiles, moduleSheets, read, readCss } from './css-files';

/**
 * Every class in a CSS module must be referenced by a component that imports
 * that module (`styles.foo` or `styles['foo']`). Unused classes are how the
 * dead player and duplicate modal CSS piled up unnoticed.
 *
 * Classes picked at runtime (`styles[`tone_${x}`]`) can't be seen statically;
 * list their prefix here, next to where the lookup lives.
 */
const DYNAMIC_PREFIXES: Record<string, string[]> = {
  // audiobook-releases-modal.tsx: styles[`quality_${band}`], styles[`status_${status}`]
  'src/routes/audiobooks/-ui/audiobooks-page.module.css': ['quality_', 'status_'],
  // issue-detail-modal.tsx: styles[link.className] from the external-links table
  'src/routes/issues/-ui/issue-detail-modal.module.css': ['issueExternalLink'],
  // stats-page.tsx: styles[`statsCardDelta_${direction}`]
  'src/routes/stats/-ui/stats-page.module.css': ['statsCardDelta_'],
  // year-story.tsx: styles[`glyph_${key}`]
  'src/routes/stats/-ui/year-story.module.css': ['glyph_'],
};

const IMPORT = /import\s+(\w+)\s+from\s+'(\.[^']+\.module\.css)'/g;

/** module path → the identifiers and sources of every file that imports it */
function importers(): Map<string, { ident: string; source: string }[]> {
  const out = new Map<string, { ident: string; source: string }[]>();
  const code = listFiles('src', (p) => /\.tsx?$/.test(p) && !/\.(test|spec)\.tsx?$/.test(p));
  for (const file of code) {
    const source = read(file);
    for (const [, ident, path] of source.matchAll(IMPORT)) {
      const target = normalize(join(dirname(file), path)).replace(/\\/g, '/');
      out.set(target, [...(out.get(target) ?? []), { ident, source }]);
    }
  }
  return out;
}

function classesIn(file: string): Set<string> {
  const selectors = readCss(file)
    .replace(/:global\([^)]*\)/g, '')
    // Keep selectors only: drop declaration bodies (innermost blocks) and strings.
    .replace(/(["'])(?:\\.|(?!\1).)*\1/g, '')
    .replace(/\{[^{}]*\}/g, '{}');
  return new Set([...selectors.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((m) => m[1]));
}

function referenced(users: { ident: string; source: string }[]): Set<string> {
  const names = new Set<string>();
  for (const { ident, source } of users) {
    for (const [, name] of source.matchAll(new RegExp(`\\b${ident}\\.([A-Za-z_]\\w*)`, 'g'))) {
      names.add(name);
    }
    for (const [, name] of source.matchAll(
      new RegExp(`\\b${ident}\\[\\s*['"]([\\w-]+)['"]\\s*\\]`, 'g'),
    )) {
      names.add(name);
    }
  }
  return names;
}

describe('CSS module classes are all used', () => {
  const users = importers();

  it.each(moduleSheets())('%s', (file) => {
    const used = referenced(users.get(file) ?? []);
    const prefixes = DYNAMIC_PREFIXES[file] ?? [];
    const unused = [...classesIn(file)].filter(
      (name) => !used.has(name) && !prefixes.some((prefix) => name.startsWith(prefix)),
    );
    expect(unused, `unused classes in ${file}: delete them, or list a dynamic prefix`).toEqual([]);
  });

  it('has no stale dynamic-lookup allowlist entries', () => {
    for (const [file, prefixes] of Object.entries(DYNAMIC_PREFIXES)) {
      const classes = [...classesIn(file)];
      for (const prefix of prefixes) {
        expect(
          classes.some((name) => name.startsWith(prefix)),
          `${file}: no class starts with "${prefix}"`,
        ).toBe(true);
      }
    }
  });
});
