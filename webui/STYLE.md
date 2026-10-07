# Web UI styling

Rules for any CSS or `className` you write in `webui/`. `npm run check` (stylelint) and `npm test` (`src/test/css-budget.test.ts`, `src/test/css-module-classes.test.ts`) enforce most of them; the rest is on you.

## Where styles go

- **New React UI uses a CSS module** (`foo.module.css` next to `foo.tsx`, imported as `styles`). Global classes from `static/*.css` are for the legacy vanilla pages and the React routes that still render their markup.
- **Edit the original rule.** When a legacy look needs changing, find the rule that sets it today and change it there. Never append a "v2" / "premier" / "overhaul" / "polish" sheet or section that overrides an older one by cascade order: that pattern is what produced the 89k-line `style.css`. `index.html` stylesheet links are frozen by the budget test.
- **Colours live in CSS, never in inline `style={{}}`.** Pass state as a `data-*` attribute or a class and colour it in the module. Inline styles are for genuinely runtime values (a computed width, a `--progress` custom property).

## Tokens

`static/tokens.css` holds the one global `:root` and is the source of truth: read it for exact values. It loads first, so both legacy sheets and modules can use every token. Use the nearest token and never the literal it replaces.

| Family | Names | Use for |
|---|---|---|
| Accent | `--accent`, `--accent-light`, `rgba(var(--accent-rgb), a)` | Anything that follows the user-chosen accent. Hardcoded greens ignore it. |
| White alpha | `--white-a02` … `--white-a90` | Translucent white fills, borders, text |
| Black alpha | `--black-a10` … `--black-a95` (steps of .05) | Shadows, scrims, modal backdrops |
| Semantic | `--surface-1..3`, `--line`, `--line-strong`, `--text-1..3`, `--bg-primary`, `--bg-secondary` | Prefer these over raw alphas when the meaning fits |
| Solid surfaces | `--bg-surface` < `--bg-raised` < `--bg-raised-2` (`#13141a`/`#1a1c23`/`#22242d`); `--bg-glass`, `--bg-glass-raised` | Opaque panels, cards and controls on them; translucent blue-black panels |
| Text on solids | `--text-bright` (+ `--text-bright-rgb`), `--text-soft`, `--text-faint` | Off-white headline text, a lighter cool grey, faint hints |
| Status | `--danger`, `--warning`, `--success`, `--info` (+ `-rgb` for alpha) | Errors, warnings, OK states. Not the accent. |
| Status, second shades | `--danger-soft`, `--warning-strong`, `--success-strong`, `--gold` (+ `-rgb`) | Where a feature already uses the softer red, the deeper amber/green, or gold next to the main status colour |
| Radius | `--radius-xs/sm/md/lg/xl` (4/6/8/12/16), `--radius-control` (10), `--radius-card` (14), `--radius-sheet` (18), `--radius-pill`, `--radius-circle` | Every `border-radius` |
| Duration | `--dur-xfast/fast/quick/base/moderate/slow/slower/slowest` (.12/.15/.18/.2/.25/.3/.4/.5s) | Transitions |
| Easing | `--ease-standard`, `--ease-emphasized`, `--ease-decelerate`, `--ease-out`, `--ease-spring` | Transitions and animations. Plain `ease`/`linear` stay keywords. |
| Z-index | `--z-sticky` < `--z-dropdown` < `--z-overlay` < `--z-modal` < `--z-dialog-backdrop` < `--z-dialog` < `--z-menu` < `--z-toast` < `--z-tooltip` | Anything stacking against other components. `DialogFrame` uses the dialog pair, a menu opened from a dialog uses `--z-menu`. A single digit is fine for layering inside one component. |
| Fonts | `--font-sans`, `--font-mono` | |

Don't build a feature palette (`--foo-surface`, `--foo-text` …) on top of these: use the global token directly, and if a value you need is missing and used in several places, add it to `tokens.css` and this table. The one scoped set left is the settings font ladder (`--stg-t-*`, rem-based, settings only).

**Keyframes**: `spin`, `pulse`, `shimmer` and `fade-in` are defined once in `tokens.css`. Keyframe names in legacy sheets are global, so a new one needs a unique prefixed name. In a module, `@keyframes` is scoped to the file; reach a shared one with `animation: global(spin) …`.

**Breakpoints**: 480 / 640 / 768 / 1024 / 1280 px, written as literals (`@media (max-width: 768px)`), since custom media needs a build step. `768px` is the mobile layout switch. Reuse one of these; the budget test counts distinct breakpoints.

## Naming

- Module classes and keyframes are **camelCase** (`.trackRow`, `.trackRowArt`).
- Variants are **`data-*` attributes**: `<div className={styles.trackRow} data-state="active">` styled as `.trackRow[data-state='active']`.
- Every module class must be referenced as `styles.name`. A class picked at runtime (`` styles[`tone_${x}`] ``) needs its prefix in `DYNAMIC_PREFIXES` in `src/test/css-module-classes.test.ts`.

## Shared components

Reach for these before writing CSS for the same thing:

| Component | Import | Replaces |
|---|---|---|
| `Button` | `@/components/form` | Raw `<button>` with local button classes |
| `Badge` (`tone`) | `@/components/primitives` | Local pill/badge/chip classes |
| `Notice` (`tone`) | `@/components/primitives` | Inline info/warning/error boxes |
| `Spinner` | `@/components/primitives` | Local `@keyframes spin` loaders |
| `Skeleton` | `@/components/primitives` | Shimmer placeholders |
| `EmptyState` | `@/components/primitives` | "Nothing here yet" blocks |
| `DialogFrame` | `@/components/dialog` | Hand-rolled modal overlays and their z-index |

## What the gates enforce

- **stylelint** (`webui/.stylelintrc.json`), run on save by the Claude Code hook and in `npm run check`. In modules it rejects hex and literal `rgb()`/`hsl()` colours (black shadows included: use `--black-aNN`), `!important`, `z-index` other than `var(--z-*)` or one digit, `border-radius` other than `var(--radius-*)`/`0`, duplicate selectors, and non-camelCase classes. Existing modules that still break a rule are listed per rule in the config's `overrides`. After fixing a file, delete it from those lists; never add a file to them. The legacy sheets get duplicate selectors checked too. Each existing duplicate carries `stylelint-disable-next-line no-duplicate-selectors -- order-sensitive: …`, meaning that merging it would move its declarations past a rule of equal specificity that sets the same property, which changes the cascade. Don't copy that marker onto a new rule; edit the existing copy instead.
- **Budget** (`src/test/css-budget.json`): counts of hex, literal rgb and `!important` (legacy and modules), distinct z-index values and breakpoints, duplicate global keyframes, undefined custom properties, and the stylesheet link list. A count may only go down. When you lower one, run `UPDATE_CSS_BUDGET=1 npx vitest run src/test/css-budget.test.ts` and commit the JSON.
