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
| Semantic | `--surface-1..3`, `--line`, `--line-strong`, `--text-1..3`, `--bg-primary` | Prefer these over raw alphas when the meaning fits |
| Status | `--danger`, `--warning`, `--success`, `--info` (+ `-rgb` for alpha) | Errors, warnings, OK states. Not the accent. |
| Radius | `--radius-xs/sm/md/lg/xl` (4/6/8/12/16), `--radius-pill`, `--radius-circle` | Every `border-radius` |
| Motion | `--dur-fast/base/slow`, `--ease-standard`, `--ease-emphasized` | Transitions and animations |
| Z-index | `--z-sticky` < `--z-dropdown` < `--z-overlay` < `--z-modal` < `--z-toast` < `--z-tooltip` | Anything stacking against other components. A single digit is fine for layering inside one component. |
| Fonts | `--font-sans`, `--font-mono` | |

Shadows may use `rgba(0, 0, 0, a)`; there is no black-alpha ramp.

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

- **stylelint** (`webui/.stylelintrc.json`), run on save by the Claude Code hook and in `npm run check`. In modules it rejects hex and literal `rgb()`/`hsl()` colours, `!important`, `z-index` other than `var(--z-*)` or one digit, `border-radius` other than `var(--radius-*)`/`0`, duplicate selectors, and non-camelCase classes. Existing modules that still break a rule are listed per rule in the config's `overrides`. After fixing a file, delete it from those lists; never add a file to them.
- **Budget** (`src/test/css-budget.json`): counts of hex, literal rgb and `!important` (legacy and modules), distinct z-index values and breakpoints, duplicate global keyframes, undefined custom properties, and the stylesheet link list. A count may only go down. When you lower one, run `UPDATE_CSS_BUDGET=1 npx vitest run src/test/css-budget.test.ts` and commit the JSON.
