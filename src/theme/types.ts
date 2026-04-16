import type { ThemeConfig } from 'antd'

export type ThemeCode = 'DEFAULT' | 'GRAFITO'

export interface ThemePalette {
  primary: string
  secondary: string
  neutral: string
  accent: string
  background: string
}

export interface ThemeLayoutOptions {
  headerDesktopBg: string
  headerDesktopText: string
  headerMobileBg: string
  headerMobileText: string
  siderBg: string
  drawerBg: string
  contentBg: string
  loginBg: string
  logoText: string
  avatarBg: string
  textBase: string
  menuDarkSubMenuItemBg: string
  layoutTriggerBg: string
}

export interface ThemeControlOptions {
  segmentedTrackBg: string
  segmentedItemColor: string
  segmentedItemHoverColor: string
  segmentedItemHoverBg: string
  segmentedItemActiveBg: string
  segmentedItemSelectedBg: string
  segmentedItemSelectedColor: string
  controlBorderColor: string
  controlBorderHoverColor: string
  controlBorderActiveColor: string
  controlOutlineColor: string
}

export interface ThemeKanbanOptions {
  kanbanCardDimmedBg: string
  kanbanCardBorder: string
}

export interface ThemePresetOptions {
  layout: ThemeLayoutOptions
  controls: ThemeControlOptions
  kanban: ThemeKanbanOptions
}

export interface ThemeLayoutVars {
  '--tms-accent': string
  '--tms-header-desktop-bg': string
  '--tms-header-desktop-text': string
  '--tms-header-mobile-bg': string
  '--tms-header-mobile-text': string
  '--tms-sider-bg': string
  '--tms-drawer-bg': string
  '--tms-content-bg': string
  '--tms-logo-text': string
  '--tms-avatar-bg': string
  '--tms-login-bg': string
  '--tms-kanban-card-dimmed-bg': string
  '--tms-kanban-card-border': string
}

export interface ThemeDefinition {
  code: ThemeCode
  name: string
  palette: ThemePalette
  antdTheme: ThemeConfig
  layoutVars: ThemeLayoutVars
}
