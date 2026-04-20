import { ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { App as AntdApp, Button, Card, Col, Row, Statistic, Table } from 'antd'
import { useEffect, useState } from 'react'
import {
  buildFechaReferenciaParam,
  normalizeFechaReferencia,
  ReportesPeriodoFilter,
} from '../../components/reportes/ReportesPeriodoFilter'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { DEFAULT_REPORTE_PERIODO, type ReportePeriodo } from '../../constants/reportes'
import { reportesService } from '../../services/reportes/reportesService'
import type { DashboardReportDto, SimpleReportItemDto } from '../../types/models'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'

export default function VentasReportPage() {
  const { message } = AntdApp.useApp()
  const [dashboard, setDashboard] = useState<DashboardReportDto | null>(null)
  const [ventasPorProducto, setVentasPorProducto] = useState<SimpleReportItemDto[]>([])
  const [ventasPorTipoCliente, setVentasPorTipoCliente] = useState<SimpleReportItemDto[]>([])
  const [periodo, setPeriodo] = useState<ReportePeriodo>(DEFAULT_REPORTE_PERIODO)
  const [fechaReferencia, setFechaReferencia] = useState(() => normalizeFechaReferencia(DEFAULT_REPORTE_PERIODO, dayjs()))
  const [loading, setLoading] = useState(false)

  const load = async (periodoFiltro = periodo, fechaFiltro = fechaReferencia) => {
    setLoading(true)
    try {
      const params = {
        periodo: periodoFiltro,
        fechaReferencia: buildFechaReferenciaParam(periodoFiltro, fechaFiltro),
      }

      const [dashboardData, productoData, tipoClienteData] = await Promise.all([
        reportesService.dashboard(params),
        reportesService.ventasPorProducto(params),
        reportesService.ventasPorTipoCliente(params),
      ])
      setDashboard(dashboardData)
      setVentasPorProducto(productoData)
      setVentasPorTipoCliente(tipoClienteData)
    } catch (error) {
      message.error(getApiErrorMessage(error, 'No se pudieron cargar los reportes de ventas.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(periodo, fechaReferencia)
  }, [fechaReferencia, periodo])

  return (
    <div className="tms-page">
      <RequireCompanyAlert />
      <PageHeaderCard
        title="Reportes de ventas"
        subtitle="Indicadores filtrados por dia, mes o anio para producto y tipo de cliente."
        actions={<Button icon={<ReloadOutlined />} onClick={() => void load()} loading={loading} />}
      />

      <ReportesPeriodoFilter
        periodo={periodo}
        fechaReferencia={fechaReferencia}
        onPeriodoChange={(nextPeriodo) => {
          setPeriodo(nextPeriodo)
          setFechaReferencia((value) => normalizeFechaReferencia(nextPeriodo, value))
        }}
        onFechaChange={(value) => setFechaReferencia(normalizeFechaReferencia(periodo, value))}
      />

      <Row gutter={16} className="tms-kpi-row">
        <Col xs={24} md={8}><Card className="tms-compact-card"><Statistic title="Ventas totales del periodo" value={dashboard?.VentasTotales ?? 0} prefix="$" /></Card></Col>
        <Col xs={24} md={8}><Card className="tms-compact-card"><Statistic title="Ventas emitidas del periodo" value={dashboard?.VentasEmitidas ?? 0} /></Card></Col>
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
