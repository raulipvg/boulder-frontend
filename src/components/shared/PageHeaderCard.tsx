import { Card, Space, Typography } from 'antd'
import type { ReactNode } from 'react'

interface PageHeaderCardProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeaderCard({ title, subtitle, actions }: PageHeaderCardProps) {
  return (
    <Card className="tms-page-header-card" styles={{ body: { padding: '8px 12px' } }}>
      <div className="tms-page-header-row">
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
        {actions ? <Space wrap>{actions}</Space> : null}
      </div>
    </Card>
  )
}
