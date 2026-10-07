import { expect, test, type Page } from '@playwright/test';

import { routeHandlers, shellHandlers } from './fixtures';
import { installShell, ORIGIN } from './harness';

/**
 * Screenshot baselines for the main routes, so CSS refactors can prove they
 * changed nothing. Run with `npm run test:visual`; see tests/visual/README.md
 * for when to update the baselines.
 */

const ROUTES: { name: string; path: string }[] = [
  { name: 'dashboard', path: '/dashboard' },
  { name: 'discover', path: '/discover' },
  { name: 'search', path: '/search' },
  { name: 'library', path: '/library' },
  { name: 'artist-detail', path: '/artist-detail/library/42' },
  { name: 'watchlist', path: '/watchlist' },
  { name: 'wishlist', path: '/wishlist' },
  { name: 'settings', path: '/settings' },
  { name: 'podcasts', path: '/podcasts' },
  { name: 'audiobooks', path: '/audiobooks' },
  { name: 'issues', path: '/issues' },
  { name: 'stats', path: '/stats' },
  { name: 'chat', path: '/chat' },
  { name: 'automations', path: '/automations' },
];

/** The key routes also checked at the 768px breakpoint. */
const MOBILE_ROUTES = ['dashboard', 'discover', 'library', 'watchlist', 'settings'];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, routes: ROUTES },
  {
    name: 'mobile',
    width: 768,
    height: 1024,
    routes: ROUTES.filter((r) => MOBILE_ROUTES.includes(r.name)),
  },
];

/** Monday 13 January 2025, 10:00 UTC: greetings and dates never move. */
const FROZEN_NOW = new Date('2025-01-13T10:00:00Z');

/** Freeze everything that would make two runs of the same page differ. */
async function stabilise(page: Page) {
  await page.clock.setFixedTime(FROZEN_NOW);
  await page.addInitScript(() => {
    // A returning user: the first-launch help tip pops in on a timer.
    localStorage.setItem('soulsync_setup_welcome_dismissed', '1');
    localStorage.setItem('soulsync_helper_discovered', '1');
    // Seeded Math.random, so shuffled art and random picks repeat.
    let seed = 0x2f6b1d3a;
    Math.random = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  });
}

async function settle(page: Page) {
  await expect
    .poll(() => page.evaluate(() => document.querySelector('.page.active')?.id ?? ''), {
      timeout: 15_000,
    })
    .not.toBe('');
  // helper.js badges the help button 2.5s after load; wait it out so the
  // badge is in every shot rather than in some.
  // The generous timeout covers a loaded machine running every shot at once.
  await expect(page.locator('#helper-float-btn')).toHaveClass(/\bhas-badge\b/, {
    timeout: 15_000,
  });
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
}

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} (${viewport.width}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of viewport.routes) {
      test(route.name, async ({ page }) => {
        await stabilise(page);
        const missing = await installShell(page, [
          ...(routeHandlers[route.name] ?? []),
          ...shellHandlers,
        ]);
        await page.goto(`${ORIGIN}${route.path}`);
        await settle(page);
        expect(missing, 'static files missing; run `npm run build`').toEqual([]);
        await expect(page).toHaveScreenshot([viewport.name, `${route.name}.png`]);
      });
    }
  });
}
