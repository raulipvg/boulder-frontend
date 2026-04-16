import { App as AntdApp, ConfigProvider } from 'antd'
import esES from 'antd/locale/es_ES'
import { useEffect, type PropsWithChildren } from 'react'
import { resolveTheme } from './resolveTheme'

export function AppThemeProvider({ children }: PropsWithChildren) {
  const activeTheme = resolveTheme('GRAFITO')

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const root = document.documentElement
    Object.entries(activeTheme.layoutVars).forEach(([variable, value]) => {
      root.style.setProperty(variable, value)
    })
  }, [activeTheme])

  return (
    <ConfigProvider locale={esES} theme={activeTheme.antdTheme}>
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  )
}
