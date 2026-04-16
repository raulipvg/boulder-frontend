import {
  buildAntdComponents,
  buildAntdToken,
  buildLayoutVars,
} from './builders'
import type {
  ThemeCode,
  ThemeDefinition,
  ThemePalette,
  ThemePresetOptions,
} from './types'

const createTheme = (
  code: ThemeCode,
  name: string,
  palette: ThemePalette,
  options: ThemePresetOptions,
): ThemeDefinition => ({
  code,
  name,
  palette,
  antdTheme: {
    token: buildAntdToken(palette, options),
    components: buildAntdComponents(options),
  },
  layoutVars: buildLayoutVars(palette, options),
})

export const THEME_PRESETS: Record<ThemeCode, ThemeDefinition> = {
  DEFAULT: createTheme(
    'DEFAULT',
    'Default',
    {
      primary: '#1890ff',
      secondary: '#001529',
      neutral: '#8c8c8c',
      accent: '#52c41a',
      background: '#f5f5f5',
    },
    {
      layout: {
        headerDesktopBg: '#ffffff',
        headerDesktopText: '#1f1f1f',
        headerMobileBg: '#001529',
        headerMobileText: '#ffffff',
        siderBg: '#001529',
        drawerBg: '#001529',
        contentBg: '#eeeeee',
        loginBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        logoText: '#ffffff',
        avatarBg: '#1890ff',
        textBase: '#1f1f1f',
        menuDarkSubMenuItemBg: '#000c17',
        layoutTriggerBg: '#002140',
      },
      controls: {
        segmentedTrackBg: '#f5f5f5',
        segmentedItemColor: 'rgba(0, 0, 0, 0.65)',
        segmentedItemHoverColor: 'rgba(0, 0, 0, 0.88)',
        segmentedItemHoverBg: 'rgba(0, 0, 0, 0.06)',
        segmentedItemActiveBg: 'rgba(0, 0, 0, 0.15)',
        segmentedItemSelectedBg: '#ffffff',
        segmentedItemSelectedColor: 'rgba(0, 0, 0, 0.88)',
        controlBorderColor: '#ebebeb',
        controlBorderHoverColor: '#8bbcf2',
        controlBorderActiveColor: '#6fa7e8',
        controlOutlineColor: 'rgba(111, 167, 232, 0.08)',
      },
      kanban: {
        kanbanCardDimmedBg: '#f5f5f5',
        kanbanCardBorder: '#e5e7eb',
      },
    },
  ),
  GRAFITO: createTheme(
    'GRAFITO',
    'Grafito',
    {
      primary: '#374151',
      secondary: '#111827',
      neutral: '#9ca3af',
      accent: '#10b981',
      background: '#f3f4f6',
    },
    {
      layout: {
        headerDesktopBg: '#ffffff',
        headerDesktopText: '#111827',
        headerMobileBg: '#111827',
        headerMobileText: '#ffffff',
        siderBg: '#111827',
        drawerBg: '#111827',
        contentBg: '#eceff3',
        loginBg: 'linear-gradient(135deg, #4b5563 0%, #111827 100%)',
        logoText: '#ffffff',
        avatarBg: '#374151',
        textBase: '#111827',
        menuDarkSubMenuItemBg: '#0b1220',
        layoutTriggerBg: '#1f2937',
      },
      controls: {
        segmentedTrackBg: '#e5e7eb',
        segmentedItemColor: '#374151',
        segmentedItemHoverColor: '#111827',
        segmentedItemHoverBg: '#f3f4f6',
        segmentedItemActiveBg: '#d1d5db',
        segmentedItemSelectedBg: '#ffffff',
        segmentedItemSelectedColor: '#111827',
        controlBorderColor: '#e5e7eb',
        controlBorderHoverColor: '#9ca3af',
        controlBorderActiveColor: '#6b7280',
        controlOutlineColor: 'rgba(107, 114, 128, 0.12)',
      },
      kanban: {
        kanbanCardDimmedBg: '#eef1f4',
        kanbanCardBorder: '#d6dbe3',
      },
    },
  ),
}

export const THEME_LIST = Object.values(THEME_PRESETS)
