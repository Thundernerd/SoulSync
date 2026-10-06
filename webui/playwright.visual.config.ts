import { defineConfig } from '@playwright/test';

/**
 * Screenshot baselines for the main routes. No server: the harness renders
 * index.html itself, serves webui/static from disk and stubs every /api call.
 * See tests/visual/README.md.
 */
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
