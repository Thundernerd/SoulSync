# AGENTS.md

## Styling

Read `webui/STYLE.md` before writing or editing any CSS, CSS module, or `className` in `webui/`. It holds the design tokens, breakpoints, naming, the shared components to reuse, and the rule to edit the original rule rather than layer an override sheet on top.

The gate is `cd webui && npm run check && npm test`: stylelint and the CSS budget test reject hardcoded colours, new z-index/breakpoint values, and new stylesheets.
