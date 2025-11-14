import {hues} from '@sanity/color'

// Inject Sanity colors as CSS variables
export function injectSanityColorVars(): void {
  const root = document.documentElement.style

  root.setProperty('--color-gray-100', hues.gray[100].hex)
  root.setProperty('--color-gray-400', hues.gray[400].hex)
  root.setProperty('--color-gray-800', hues.gray[800].hex)
  root.setProperty('--color-red-500', hues.red[500].hex)
  root.setProperty('--color-yellow-500', hues.yellow[500].hex)
}
