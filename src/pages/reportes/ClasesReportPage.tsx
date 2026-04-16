import { ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Statistic, Table } from 'antd'
import { useEffect, useState } from 'react'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { reportesService } from '../../services/reportes/reportesService'
import type { DashboardReportDto, SimpleReportItemDto } from '../../types/models'

export default function ClasesReportPage() {
  const [dashboard, setDashboard] = useState<DashboardReportDto | null>(null)
  const [usoClases, setUsoClases] = useState<SimpleReportItemDto[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [dashboardData, clasesData] = await Promise.all([reportesService.dashboard(), reportesService.usoClases()])
      setDashboard(dashboardData)
      setUsoClases(clasesData)
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
        title="Reportes de clases"
        subtitle="Evolución de beneficios vigentes y uso de clases por categoría."
        actions={<Button icon={<ReloadOutlined />} onClick={() => void load()} loading={loading} />}
      />

      <Row gutter={16} className="tms-kpi-row">
        <Col xs={24} md={12}><Card className="tms-compact-card"><Statistic title="Mensualidades activas" value={dashboard?.MensualidadesActivas ?? 0} loading={loading} /></Card></Col>
        <Col xs={24} md={12}><Card className="tms-compact-card"><Statistic title="Packs vigentes" value={dashboard?.PacksVigentes ?? 0} loading={loading} /></Card></Col>
      </Row>

      <Card title="Uso de clases" className="tms-page-table-card">
        <Table rowKey="Etiqueta" loading={loading} pagination={false} dataSource={usoClases} columns={[{ title: 'Clase', dataIndex: 'Etiqueta' }, { title: 'Asistencias', dataIndex: 'Valor' }]} />
      </Card>
    </div>
  )
}
