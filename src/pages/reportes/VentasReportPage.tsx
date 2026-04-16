import { ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Statistic, Table } from 'antd'
import { useEffect, useState } from 'react'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { reportesService } from '../../services/reportes/reportesService'
import type { DashboardReportDto, SimpleReportItemDto } from '../../types/models'

export default function VentasReportPage() {
  const [dashboard, setDashboard] = useState<DashboardReportDto | null>(null)
  const [ventasPorProducto, setVentasPorProducto] = useState<SimpleReportItemDto[]>([])
  const [ventasPorTipoCliente, setVentasPorTipoCliente] = useState<SimpleReportItemDto[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [dashboardData, productoData, tipoClienteData] = await Promise.all([
        reportesService.dashboard(),
        reportesService.ventasPorProducto(),
        reportesService.ventasPorTipoCliente(),
      ])
      setDashboard(dashboardData)
      setVentasPorProducto(productoData)
      setVentasPorTipoCliente(tipoClienteData)
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
        title="Reportes de ventas"
        subtitle="Indicadores generales y composición por producto y tipo de cliente."
        actions={<Button icon={<ReloadOutlined />} onClick={() => void load()} loading={loading} />}
      />

      <Row gutter={16} className="tms-kpi-row">
        <Col xs={24} md={8}><Card className="tms-compact-card"><Statistic title="Ventas totales" value={dashboard?.VentasTotales ?? 0} prefix="$" /></Card></Col>
        <Col xs={24} md={8}><Card className="tms-compact-card"><Statistic title="Ventas emitidas" value={dashboard?.VentasEmitidas ?? 0} /></Card></Col>
        <Col xs={24} md={8}><Card className="tms-compact-card"><Statistic title="Clientes activos" value={dashboard?.ClientesActivos ?? 0} /></Card></Col>
      </Row>

      <Card title="Ventas por producto" className="tms-page-table-card">
        <Table rowKey="Etiqueta" loading={loading} pagination={false} dataSource={ventasPorProducto} columns={[{ title: 'Producto', dataIndex: 'Etiqueta' }, { title: 'Valor', dataIndex: 'Valor' }]} />
      </Card>

      <Card title="Ventas por tipo de cliente" className="tms-page-table-card">
        <Table rowKey="Etiqueta" loading={loading} pagination={false} dataSource={ventasPorTipoCliente} columns={[{ title: 'Tipo cliente', dataIndex: 'Etiqueta' }, { title: 'Valor', dataIndex: 'Valor' }]} />
      </Card>
    </div>
  )
}
