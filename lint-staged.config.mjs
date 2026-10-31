export default {
  // prettier runs in the same array as eslint rather than under its own glob:
  // lint-staged runs separate glob entries concurrently, so a `*` prettier entry
  // could rewrite a file while eslint was reading it.
  // tsc can't typecheck individual files, so return a static project-wide command
  // (lint-staged won't append filenames to a function-returned string).
  '**/*.{ts,tsx}': ['prettier --write', 'eslint --no-warn-ignored', () => 'tsc --noEmit'],
  '**/*.{js,cjs,mjs}': ['prettier --write', 'eslint --no-warn-ignored'],
  // Everything else prettier owns and eslint does not. Markdown is excluded by
  // .prettierignore, so it is deliberately absent here.
  '**/*.{json,html,css,yml,yaml}': ['prettier --write'],
}
