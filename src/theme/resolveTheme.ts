import { THEME_PRESETS } from './presets'
import type { ThemeCode, ThemeDefinition } from './types'

export const DEFAULT_THEME_CODE: ThemeCode = 'GRAFITO'

const hasTheme = (code: string): code is ThemeCode => {
  return Object.prototype.hasOwnProperty.call(THEME_PRESETS, code)
}

export const resolveThemeCode = (value?: string | null): ThemeCode => {
  if (!value) return DEFAULT_THEME_CODE

  const normalized = value.trim().toUpperCase().replace(/\s+/g, '_')
  return hasTheme(normalized) ? normalized : DEFAULT_THEME_CODE
}

export const resolveTheme = (value?: string | null): ThemeDefinition => {
  return THEME_PRESETS[resolveThemeCode(value)]
}
