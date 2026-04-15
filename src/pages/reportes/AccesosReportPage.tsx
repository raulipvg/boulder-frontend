import { Card, Statistic, Table, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { reportesService } from '../../services/reportes/reportesService'
import type { DashboardReportDto, SimpleReportItemDto } from '../../types/models'

export default function AccesosReportPage() {
  const [dashboard, setDashboard] = useState<DashboardReportDto | null>(null)
  const [items, setItems] = useState<SimpleReportItemDto[]>([])

  useEffect(() => {
    void Promise.all([reportesService.dashboard(), reportesService.accesosPorBloque()]).then(([dashboardData, accessData]) => {
      setDashboard(dashboardData)
      setItems(accessData)
    })
  }, [])

  return (
    <>
      <RequireCompanyAlert />
      <Typography.Title level={3}>Reportes de accesos</Typography.Title>
      <Card style={{ marginBottom: 16 }}><Statistic title="Accesos autorizados hoy" value={dashboard?.AccesosAutorizadosHoy ?? 0} /></Card>
      <Card title="Accesos por bloque horario"><Table rowKey="Etiqueta" pagination={false} dataSource={items} columns={[{ title: 'Bloque', dataIndex: 'Etiqueta' }, { title: 'Accesos', dataIndex: 'Valor' }]} /></Card>
    </>
  )
}
