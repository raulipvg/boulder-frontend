import { DownloadOutlined, ReloadOutlined, DollarOutlined, FileDoneOutlined, UserOutlined, TagsOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { App as AntdApp, Button, Card, Col, Row, Statistic, Table, Progress, Space } from 'antd'
import type { TableProps } from 'antd'
import { useEffect, useState, useMemo } from 'react'
import {
  buildFechaReferenciaParam,
  normalizeFechaReferencia,
  ReportesPeriodoFilter,
} from '../../components/reportes/ReportesPeriodoFilter'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { DEFAULT_REPORTE_PERIODO, type ReportePeriodo } from '../../constants/reportes'
import { reportesService } from '../../services/reportes/reportesService'
import type { DashboardReportDto, SimpleReportItemDto, VentaReporteExportDto } from '../../types/models'
import type { CsvColumn } from '../../utils/csv'
import { downloadCsv } from '../../utils/csv'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'

const CSV_COLUMNS: CsvColumn<VentaReporteExportDto>[] = [
  { header: 'VentaId', value: (row) => row.VentaId },
  { header: 'VentaDetalleId', value: (row) => row.VentaDetalleId },
  { header: 'NumeroComprobante', value: (row) => row.NumeroComprobante },
  { header: 'FechaHoraVenta', value: (row) => row.FechaHoraVenta },
  { header: 'ClienteNombre', value: (row) => row.ClienteNombre },
  { header: 'ClienteRut', value: (row) => row.ClienteRut },
  { header: 'TipoCliente', value: (row) => row.TipoCliente },
  { header: 'VendedorNombre', value: (row) => row.VendedorNombre },
  { header: 'ProductoNombre', value: (row) => row.ProductoNombre },
  { header: 'Cantidad', value: (row) => row.Cantidad },
  { header: 'PrecioUnitario', value: (row) => row.PrecioUnitario },
  { header: 'SubtotalDetalle', value: (row) => row.SubtotalDetalle },
  { header: 'TotalVenta', value: (row) => row.TotalVenta },
  { header: 'EstadoVenta', value: (row) => row.EstadoVenta },
]

export default function VentasReportPage() {
  const { message } = AntdApp.useApp()
  const [dashboard, setDashboard] = useState<DashboardReportDto | null>(null)
  const [ventasPorProducto, setVentasPorProducto] = useState<SimpleReportItemDto[]>([])
  const [ventasPorTipoCliente, setVentasPorTipoCliente] = useState<SimpleReportItemDto[]>([])
  const [periodo, setPeriodo] = useState<ReportePeriodo>(DEFAULT_REPORTE_PERIODO)
  const [fechaReferencia, setFechaReferencia] = useState(() => normalizeFechaReferencia(DEFAULT_REPORTE_PERIODO, dayjs()))
  const [loading, setLoading] = useState(false)
  const [exportingCsv, setExportingCsv] = useState(false)

  const getFiltroParams = (periodoFiltro = periodo, fechaFiltro = fechaReferencia) => ({
    periodo: periodoFiltro,
    fechaReferencia: buildFechaReferenciaParam(periodoFiltro, fechaFiltro),
  })

  const load = async (periodoFiltro = periodo, fechaFiltro = fechaReferencia) => {
    setLoading(true)
    try {
      const params = getFiltroParams(periodoFiltro, fechaFiltro)

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

  const exportCsv = async () => {
    setExportingCsv(true)
    try {
      const params = getFiltroParams()
      const rows = await reportesService.exportarVentas(params)

      downloadCsv({
        fileName: `reporte-ventas-${params.periodo}-${params.fechaReferencia}.csv`,
        columns: CSV_COLUMNS,
        rows,
        delimiter: ';',
      })
    } catch (error) {
      message.error(getApiErrorMessage(error, 'No se pudo descargar el CSV de ventas.'))
    } finally {
      setExportingCsv(false)
    }
  }

  useEffect(() => {
    void load(periodo, fechaReferencia)
  }, [fechaReferencia, periodo])

  // Cálculos para gráficos de barras dentro de la tabla
  const maxVentaProducto = useMemo(() =>
    ventasPorProducto.reduce((max, item) => Math.max(max, item.Valor), 0)
    , [ventasPorProducto])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value)

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('es-CL').format(value)

  const getColumns = (maxGlobal: number, itemName: string): TableProps<SimpleReportItemDto>['columns'] => [
    {
      title: itemName,
      dataIndex: 'Etiqueta',
      sorter: (a, b) => a.Etiqueta.localeCompare(b.Etiqueta),
      width: '45%'
    },
    {
      title: 'Ventas (CLP)',
      dataIndex: 'Valor',
      sorter: (a, b) => a.Valor - b.Valor,
      defaultSortOrder: 'descend',
      render: (valor: number) => {
        const percent = maxGlobal > 0 ? (valor / maxGlobal) * 100 : 0
        return (
          <Space orientation="vertical" style={{ width: '100%', gap: 2 }}>
            <span style={{ fontWeight: 500 }}>{formatCurrency(valor)}</span>
            <Progress
              percent={percent}
              showInfo={false}
              size="small"
              strokeColor="#374151"
              style={{ margin: 0 }}
            />
          </Space>
        )
      }
    }
  ]

  return (
    <div className="tms-page">
      <RequireCompanyAlert />
      <PageHeaderCard
        title="Reportes de ventas"
        subtitle="Indicadores filtrados por día, mes o año para producto y tipo de cliente."
        actions={<Button icon={<ReloadOutlined />} onClick={() => void load()} loading={loading}>Actualizar</Button>}
      />

      <ReportesPeriodoFilter
        periodo={periodo}
        fechaReferencia={fechaReferencia}
        onPeriodoChange={(nextPeriodo) => {
          setPeriodo(nextPeriodo)
          setFechaReferencia((value) => normalizeFechaReferencia(nextPeriodo, value))
        }}
        onFechaChange={(value) => setFechaReferencia(normalizeFechaReferencia(periodo, value))}
        actions={<Button icon={<DownloadOutlined />} onClick={() => void exportCsv()} loading={exportingCsv}>Descargar CSV</Button>}
      />

      <Row gutter={[16, 16]} className="tms-kpi-row" style={{ display: 'flex', alignItems: 'stretch' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="tms-compact-card" style={{ height: '100%' }}>
            <Statistic
              title={<span><DollarOutlined style={{ color: '#52c41a', marginRight: 8 }} /> Ventas totales del periodo</span>}
              value={dashboard?.VentasTotales ?? 0}
              prefix="$"
              formatter={(val) => formatNumber(Number(val))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="tms-compact-card" style={{ height: '100%' }}>
            <Statistic
              title={<span><FileDoneOutlined style={{ color: '#1890ff', marginRight: 8 }} /> Ventas emitidas del periodo</span>}
              value={dashboard?.VentasEmitidas ?? 0}
              formatter={(val) => formatNumber(Number(val))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="tms-compact-card" style={{ height: '100%' }}>
            <Statistic
              title={<span><UserOutlined style={{ color: '#722ed1', marginRight: 8 }} /> Clientes activos</span>}
              value={dashboard?.ClientesActivos ?? 0}
              formatter={(val) => formatNumber(Number(val))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="tms-compact-card" style={{ height: '100%' }}>
            <div style={{ color: 'rgba(0, 0, 0, 0.45)', marginBottom: 4, display: 'flex', alignItems: 'center' }}>
              <TagsOutlined style={{ color: '#eb2f96', marginRight: 8 }} />
              <span style={{ fontSize: 14 }}>Distribución por cliente</span>
            </div>
            <div style={{ marginTop: 12 }}>
              {ventasPorTipoCliente.length > 0 ? ventasPorTipoCliente.map(item => {
                const total = ventasPorTipoCliente.reduce((sum, i) => sum + i.Valor, 0)
                const pct = total > 0 ? (item.Valor / total) * 100 : 0
                const isStudent = item.Etiqueta.toLowerCase().includes('estudiante')
                return (
                  <div key={item.Etiqueta} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 2 }}>
                      <span>{item.Etiqueta}</span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(item.Valor)}</span>
                    </div>
                    <Progress
                      percent={pct}
                      showInfo={false}
                      size="small"
                      strokeColor={isStudent ? '#1890ff' : '#374151'}
                      style={{ margin: 0 }}
                    />
                  </div>
                )
              }) : (
                <div style={{ color: '#bfbfbf', paddingTop: 16 }}>No hay datos</div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={24}>
          <Card title="Ventas por producto" className="tms-page-table-card">
            <Table
              rowKey="Etiqueta"
              size="middle"
              loading={loading}
              pagination={{ pageSize: 15 }}
              dataSource={ventasPorProducto}
              columns={getColumns(maxVentaProducto, 'Producto')}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
