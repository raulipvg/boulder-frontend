import { App as AntdApp, ConfigProvider, theme } from 'antd'
import type { PropsWithChildren } from 'react'

export function AppThemeProvider({ children }: PropsWithChildren) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#0b5fff',
          borderRadius: 10,
        },
      }}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  )
}
