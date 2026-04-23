import { Card, Space, Typography } from 'antd'
import type { CSSProperties, ReactNode } from 'react'

interface PageHeaderCardProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  actionsWrap?: boolean
  rowStyle?: CSSProperties
}

export function PageHeaderCard({ title, subtitle, actions, actionsWrap = true, rowStyle }: PageHeaderCardProps) {
  return (
    <Card className="tms-page-header-card" styles={{ body: { padding: '8px 12px' } }}>
      <div className="tms-page-header-row" style={rowStyle}>
        <div className="tms-page-header-copy">
          <Typography.Title level={3} className="tms-page-header-title">
            {title}
          </Typography.Title>
          {subtitle ? (
            <Typography.Text type="secondary" className="tms-page-header-subtitle">
              {subtitle}
            </Typography.Text>
          ) : null}
        </div>
        {actions ? <Space wrap={actionsWrap}>{actions}</Space> : null}
      </div>
    </Card>
  )
}
