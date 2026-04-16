import { ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Statistic, Table } from 'antd'
import { useEffect, useState } from 'react'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { reportesService } from '../../services/reportes/reportesService'
import type { DashboardReportDto, SimpleReportItemDto } from '../../types/models'

export default function AccesosReportPage() {
  const [dashboard, setDashboard] = useState<DashboardReportDto | null>(null)
  const [items, setItems] = useState<SimpleReportItemDto[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [dashboardData, accessData] = await Promise.all([reportesService.dashboard(), reportesService.accesosPorBloque()])
      setDashboard(dashboardData)
      setItems(accessData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="tms-page">
      <RequireCompanyAlert />
      <PageHeaderCard
        title="Reportes de accesos"
        subtitle="Seguimiento diario de validaciones y distribución por bloque horario."
        actions={<Button icon={<ReloadOutlined />} onClick={() => void load()} loading={loading} />}
      />

      <Card className="tms-compact-card"><Statistic title="Accesos autorizados hoy" value={dashboard?.AccesosAutorizadosHoy ?? 0} loading={loading} /></Card>
      <Card title="Accesos por bloque horario" className="tms-page-table-card">
        <Table rowKey="Etiqueta" loading={loading} pagination={false} dataSource={items} columns={[{ title: 'Bloque', dataIndex: 'Etiqueta' }, { title: 'Accesos', dataIndex: 'Valor' }]} />
      </Card>
    </div>
  )
}
