import { Card } from 'antd'
import type { ReactNode } from 'react'

interface PageFiltersCardProps {
  children: ReactNode
}

export function PageFiltersCard({ children }: PageFiltersCardProps) {
  return (
    <Card className="tms-page-filters-card" styles={{ body: { padding: '8px 12px' } }}>
      <div className="tms-page-filters-row">{children}</div>
    </Card>
  )
}
