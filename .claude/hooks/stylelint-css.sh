#!/usr/bin/env bash
# PostToolUse(Edit|Write): stylelint the CSS file just edited under webui/.
# Exit 2 sends the errors back to the agent; anything else is a silent no-op.
root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
file=$(jq -r '.tool_input.file_path // empty')
case "$file" in
  "$root"/webui/static/dist/*) exit 0 ;;
  "$root"/webui/*.css) ;;
  *) exit 0 ;;
esac
cd "$root/webui" && [ -x node_modules/.bin/stylelint ] || exit 0
if ! out=$(node_modules/.bin/stylelint --formatter unix "${file#"$root/webui/"}" 2>&1); then
  printf 'stylelint failed on %s. Fix these (rules: webui/STYLE.md):\n%s\n' "$file" "$out" >&2
  exit 2
fi
