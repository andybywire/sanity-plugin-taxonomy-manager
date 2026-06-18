export default {
  // tsc can't typecheck individual files, so return a static project-wide command
  // (lint-staged won't append filenames to a function-returned string).
  '**/*.{ts,tsx}': ['eslint --no-warn-ignored', () => 'tsc --noEmit'],
  '**/*.{js,cjs,mjs}': ['eslint --no-warn-ignored'],
}
