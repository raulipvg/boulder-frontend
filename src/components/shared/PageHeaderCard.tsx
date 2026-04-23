import { Card, Space, Typography } from 'antd'
import type { CSSProperties, ReactNode } from 'react'

interface PageHeaderCardProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  actionsWrap?: boolean
  rowStyle?: CSSProperties
  mobileStandard?: boolean
}

export function PageHeaderCard({ title, subtitle, actions, actionsWrap = true, rowStyle, mobileStandard = false }: PageHeaderCardProps) {
  const resolvedSubtitle = mobileStandard ? undefined : subtitle
  const resolvedActionsWrap = mobileStandard ? false : actionsWrap
  const resolvedRowStyle = mobileStandard
    ? { flexWrap: 'nowrap', alignItems: 'center', ...rowStyle }
    : rowStyle

  return (
    <Card className="tms-page-header-card" styles={{ body: { padding: '8px 12px' } }}>
      <div className="tms-page-header-row" style={resolvedRowStyle}>
        <div className="tms-page-header-copy">
          <Typography.Title level={3} className="tms-page-header-title">
            {title}
          </Typography.Title>
          {resolvedSubtitle ? (
            <Typography.Text type="secondary" className="tms-page-header-subtitle">
              {resolvedSubtitle}
            </Typography.Text>
          ) : null}
        </div>
        {actions ? <Space wrap={resolvedActionsWrap}>{actions}</Space> : null}
      </div>
    </Card>
  )
}
