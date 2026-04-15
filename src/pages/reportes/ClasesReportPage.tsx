import { Card, Col, Row, Statistic, Table, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { reportesService } from '../../services/reportes/reportesService'
import type { DashboardReportDto, SimpleReportItemDto } from '../../types/models'

export default function ClasesReportPage() {
  const [dashboard, setDashboard] = useState<DashboardReportDto | null>(null)
  const [usoClases, setUsoClases] = useState<SimpleReportItemDto[]>([])

  useEffect(() => {
    void Promise.all([reportesService.dashboard(), reportesService.usoClases()]).then(([dashboardData, clasesData]) => {
      setDashboard(dashboardData)
      setUsoClases(clasesData)
    })
  }, [])

  return (
    <>
      <RequireCompanyAlert />
      <Typography.Title level={3}>Reportes de clases</Typography.Title>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}><Card><Statistic title="Mensualidades activas" value={dashboard?.MensualidadesActivas ?? 0} /></Card></Col>
        <Col xs={24} md={12}><Card><Statistic title="Packs vigentes" value={dashboard?.PacksVigentes ?? 0} /></Card></Col>
      </Row>
      <Card title="Uso de clases"><Table rowKey="Etiqueta" pagination={false} dataSource={usoClases} columns={[{ title: 'Clase', dataIndex: 'Etiqueta' }, { title: 'Asistencias', dataIndex: 'Valor' }]} /></Card>
    </>
  )
}
