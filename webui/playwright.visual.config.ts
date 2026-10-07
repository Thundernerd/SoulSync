import { defineConfig } from '@playwright/test';

/**
 * Screenshot baselines for the main routes. No server: the harness renders
 * index.html itself, serves webui/static from disk and stubs every /api call.
 * See tests/visual/README.md.
 */

// The baselines are rendered inside the official Playwright image (the image
// sets PLAYWRIGHT_BROWSERS_PATH; nothing else does). Anywhere else the fonts
// differ and every shot would fail, so point at the wrapper instead.
// VISUAL_ON_HOST=1 skips the check, for poking at a page with a throwaway spec.
if (process.env.PLAYWRIGHT_BROWSERS_PATH !== '/ms-playwright' && !process.env.VISUAL_ON_HOST) {
  throw new Error(
    'The visual baselines only reproduce inside the Playwright Docker image. ' +
      'Run `npm run test:visual` (or `node scripts/visual.mjs <playwright args>`).',
  );
}

export default defineConfig({
  testDir: './tests/visual',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list']],
  expect: {
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixels: 0 },
  },
  use: {
    // Playwright's own bundled headless chromium, pinned by the
    // @playwright/test version in package-lock.json.
    browserName: 'chromium',
    serviceWorkers: 'block',
    contextOptions: { reducedMotion: 'reduce' },
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'dark',
    deviceScaleFactor: 1,
    trace: 'off',
  },
});
