import {hues} from '@sanity/color'
import {useColorSchemeValue} from 'sanity'

export function useLinkColorScheme() {
  const colorScheme = useColorSchemeValue()
  if (colorScheme == 'dark') return hues.gray[50].hex
  return hues.gray[800].hex
}
