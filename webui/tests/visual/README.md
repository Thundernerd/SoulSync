# Visual baselines

Screenshot tests for the main routes, so a CSS refactor can prove it changed
nothing it didn't mean to.

```sh
npm run test:visual          # build, then compare every route with its baseline
npm run test:visual:update   # build, then rewrite the baselines
```

The first time on a machine, install the browser this Playwright version pins:
`npx playwright install chromium-headless-shell`.

## How it works

There is no server. `harness.ts` renders `webui/index.html` the way Flask
would, serves `webui/static` (including the Vite build in `static/dist`) from
disk, and answers every API call. `fixtures.ts` holds the API data as MSW
`http.*` handlers, the same idiom the vitest route tests use. Anything without
a handler gets `{}`, so most pages show their empty state. Off-origin requests
(cover art, CDNs) are aborted.

Each shot is made repeatable: the clock is frozen, `Math.random` is seeded,
motion is reduced and animations are disabled, the first-launch tip is
suppressed, and the test waits for the delayed help badge, network idle and
fonts. The browser is Playwright's bundled headless chromium, pinned by the
`@playwright/test` version in `package-lock.json`.

## When to update the baselines

- **Never in a "no visual change" refactor.** A diff there is a regression, so
  fix the CSS. Look at `test-results/**/<route>-diff.png` to see what moved.
- **Only when a change is meant to look different.** Update, eyeball the
  new PNGs in the diff, and call the change out in the PR.
- After a Playwright upgrade, which changes the browser, regenerate in a
  commit of its own.

Baselines are rendered on Linux. Fonts differ between platforms, so a run on
macOS or Windows will diff; compare on the same machine that made them.

## Adding a route

Add it to `ROUTES` in `routes.visual.spec.ts` (and to `MOBILE_ROUTES` for a
768px shot). If its empty state isn't worth a baseline, give it handlers in
`fixtures.ts`. Then run `npm run test:visual:update`.
