import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
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
import type { ClaseReporteExportDto, DashboardReportDto, SimpleReportItemDto } from '../../types/models'
import type { CsvColumn } from '../../utils/csv'
import { downloadCsv } from '../../utils/csv'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'

const CSV_COLUMNS: CsvColumn<ClaseReporteExportDto>[] = [
  { header: 'ClaseAsistenciaId', value: (row) => row.ClaseAsistenciaId },
  { header: 'FechaHoraRegistro', value: (row) => row.FechaHoraRegistro },
  { header: 'FechaSesion', value: (row) => row.FechaSesion },
  { header: 'HoraInicioSesion', value: (row) => row.HoraInicioSesion },
  { header: 'HoraFinSesion', value: (row) => row.HoraFinSesion },
  { header: 'ClaseNombre', value: (row) => row.ClaseNombre },
  { header: 'ProfesorNombre', value: (row) => row.ProfesorNombre },
  { header: 'ClienteNombre', value: (row) => row.ClienteNombre },
  { header: 'ClienteRut', value: (row) => row.ClienteRut },
  { header: 'TipoCliente', value: (row) => row.TipoCliente },
  { header: 'ProductoBeneficio', value: (row) => row.ProductoBeneficio },
  { header: 'EstadoAsistencia', value: (row) => row.EstadoAsistencia },
]

export default function ClasesReportPage() {
  const { message } = AntdApp.useApp()
  const [dashboard, setDashboard] = useState<DashboardReportDto | null>(null)
  const [usoClases, setUsoClases] = useState<SimpleReportItemDto[]>([])
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

      const [dashboardData, clasesData] = await Promise.all([
        reportesService.dashboard(params),
        reportesService.usoClases(params),
      ])
      setDashboard(dashboardData)
      setUsoClases(clasesData)
    } catch (error) {
      message.error(getApiErrorMessage(error, 'No se pudieron cargar los reportes de clases.'))
    } finally {
      setLoading(false)
    }
  }

  const exportCsv = async () => {
    setExportingCsv(true)
    try {
      const params = getFiltroParams()
      const rows = await reportesService.exportarClases(params)

      downloadCsv({
        fileName: `reporte-clases-${params.periodo}-${params.fechaReferencia}.csv`,
        columns: CSV_COLUMNS,
        rows,
        delimiter: ';',
      })
    } catch (error) {
      message.error(getApiErrorMessage(error, 'No se pudo descargar el CSV de clases.'))
    } finally {
      setExportingCsv(false)
    }
  }

  useEffect(() => {
    void load(periodo, fechaReferencia)
  }, [fechaReferencia, periodo])

  return (
    <div className="tms-page">
      <RequireCompanyAlert />
      <PageHeaderCard
        title="Reportes de clases"
        subtitle="Evolucion por dia, mes o anio de beneficios vigentes y uso por clase."
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
        actions={<Button icon={<DownloadOutlined />} onClick={() => void exportCsv()} loading={exportingCsv}>Descargar CSV</Button>}
      />

      <Row gutter={16} className="tms-kpi-row">
        <Col xs={24} md={12}><Card className="tms-compact-card"><Statistic title="Mensualidades activas en periodo" value={dashboard?.MensualidadesActivas ?? 0} loading={loading} /></Card></Col>
        <Col xs={24} md={12}><Card className="tms-compact-card"><Statistic title="Packs vigentes en periodo" value={dashboard?.PacksVigentes ?? 0} loading={loading} /></Card></Col>
      </Row>

      <Card title="Uso de clases" className="tms-page-table-card">
        <Table rowKey="Etiqueta" loading={loading} pagination={false} dataSource={usoClases} columns={[{ title: 'Clase', dataIndex: 'Etiqueta' }, { title: 'Asistencias', dataIndex: 'Valor' }]} />
      </Card>
    </div>
  )
}
