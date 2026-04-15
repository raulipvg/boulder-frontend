import { Card, Col, Row, Statistic, Table, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { reportesService } from '../../services/reportes/reportesService'
import type { DashboardReportDto, SimpleReportItemDto } from '../../types/models'

export default function VentasReportPage() {
  const [dashboard, setDashboard] = useState<DashboardReportDto | null>(null)
  const [ventasPorProducto, setVentasPorProducto] = useState<SimpleReportItemDto[]>([])
  const [ventasPorTipoCliente, setVentasPorTipoCliente] = useState<SimpleReportItemDto[]>([])

  useEffect(() => {
    void Promise.all([
      reportesService.dashboard(),
      reportesService.ventasPorProducto(),
      reportesService.ventasPorTipoCliente(),
    ]).then(([dashboardData, productoData, tipoClienteData]) => {
      setDashboard(dashboardData)
      setVentasPorProducto(productoData)
      setVentasPorTipoCliente(tipoClienteData)
    })
  }, [])

  return (
    <>
      <RequireCompanyAlert />
      <SpaceWrapper title="Reportes de ventas">
        <Row gutter={16}>
          <Col xs={24} md={8}><Card><Statistic title="Ventas totales" value={dashboard?.VentasTotales ?? 0} prefix="$" /></Card></Col>
          <Col xs={24} md={8}><Card><Statistic title="Ventas emitidas" value={dashboard?.VentasEmitidas ?? 0} /></Card></Col>
          <Col xs={24} md={8}><Card><Statistic title="Clientes activos" value={dashboard?.ClientesActivos ?? 0} /></Card></Col>
        </Row>
        <Card title="Ventas por producto" style={{ marginTop: 16 }}><Table rowKey="Etiqueta" pagination={false} dataSource={ventasPorProducto} columns={[{ title: 'Producto', dataIndex: 'Etiqueta' }, { title: 'Valor', dataIndex: 'Valor' }]} /></Card>
        <Card title="Ventas por tipo de cliente" style={{ marginTop: 16 }}><Table rowKey="Etiqueta" pagination={false} dataSource={ventasPorTipoCliente} columns={[{ title: 'Tipo cliente', dataIndex: 'Etiqueta' }, { title: 'Valor', dataIndex: 'Valor' }]} /></Card>
      </SpaceWrapper>
    </>
  )
}

function SpaceWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <Typography.Title level={3}>{title}</Typography.Title>
      {children}
    </>
  )
}
