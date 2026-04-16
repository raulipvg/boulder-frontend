import type { ThemeConfig } from 'antd'
import type {
  ThemeLayoutVars,
  ThemePalette,
  ThemePresetOptions,
} from './types'

export const buildAntdToken = (
  palette: ThemePalette,
  options: ThemePresetOptions,
): ThemeConfig['token'] => {
  const { layout, controls } = options

  return {
    colorPrimary: palette.primary,
    colorInfo: palette.secondary,
    colorLink: palette.secondary,
    colorBgLayout: layout.contentBg,
    colorBgContainer: layout.headerDesktopBg,
    colorTextBase: layout.textBase,
    borderRadius: 8,
    colorBorder: controls.controlBorderColor,
    colorBorderSecondary: controls.controlBorderColor,
    colorPrimaryBorder: controls.controlBorderActiveColor,
    controlOutline: controls.controlOutlineColor,
  }
}

export const buildAntdComponents = (
  options: ThemePresetOptions,
): ThemeConfig['components'] => {
  const { layout, controls } = options

  return {
    Layout: {
      bodyBg: layout.contentBg,
      triggerBg: layout.layoutTriggerBg,
    },
    Menu: {
      darkSubMenuItemBg: layout.menuDarkSubMenuItemBg,
    },
    Segmented: {
      trackBg: controls.segmentedTrackBg,
      itemColor: controls.segmentedItemColor,
      itemHoverColor: controls.segmentedItemHoverColor,
      itemHoverBg: controls.segmentedItemHoverBg,
      itemActiveBg: controls.segmentedItemActiveBg,
      itemSelectedBg: controls.segmentedItemSelectedBg,
      itemSelectedColor: controls.segmentedItemSelectedColor,
    },
    Input: {
      hoverBorderColor: controls.controlBorderHoverColor,
      activeBorderColor: controls.controlBorderActiveColor,
    },
    Select: {
      hoverBorderColor: controls.controlBorderHoverColor,
      activeBorderColor: controls.controlBorderActiveColor,
      activeOutlineColor: controls.controlOutlineColor,
    },
    DatePicker: {
      hoverBorderColor: controls.controlBorderHoverColor,
      activeBorderColor: controls.controlBorderActiveColor,
    },
  }
}

export const buildLayoutVars = (
  palette: ThemePalette,
  options: ThemePresetOptions,
): ThemeLayoutVars => {
  const { layout, kanban } = options

  return {
    '--tms-accent': palette.accent,
    '--tms-header-desktop-bg': layout.headerDesktopBg,
    '--tms-header-desktop-text': layout.headerDesktopText,
    '--tms-header-mobile-bg': layout.headerMobileBg,
    '--tms-header-mobile-text': layout.headerMobileText,
    '--tms-sider-bg': layout.siderBg,
    '--tms-drawer-bg': layout.drawerBg,
    '--tms-content-bg': layout.contentBg,
    '--tms-login-bg': layout.loginBg,
    '--tms-kanban-card-dimmed-bg': kanban.kanbanCardDimmedBg,
    '--tms-kanban-card-border': kanban.kanbanCardBorder,
    '--tms-logo-text': layout.logoText,
    '--tms-avatar-bg': layout.avatarBg,
  }
}
