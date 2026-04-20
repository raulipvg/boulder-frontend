import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { App as AntdApp, Button, Card, Statistic, Table } from 'antd'
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
import type { AccesoReporteExportDto, DashboardReportDto, SimpleReportItemDto } from '../../types/models'
import type { CsvColumn } from '../../utils/csv'
import { downloadCsv } from '../../utils/csv'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'

const CSV_COLUMNS: CsvColumn<AccesoReporteExportDto>[] = [
  { header: 'AccesoEventoId', value: (row) => row.AccesoEventoId },
  { header: 'FechaHoraAcceso', value: (row) => row.FechaHoraAcceso },
  { header: 'Resultado', value: (row) => row.Resultado },
  { header: 'MotivoRechazo', value: (row) => row.MotivoRechazo },
  { header: 'ClienteNombre', value: (row) => row.ClienteNombre },
  { header: 'ClienteRut', value: (row) => row.ClienteRut },
  { header: 'TipoCliente', value: (row) => row.TipoCliente },
  { header: 'ProductoNombre', value: (row) => row.ProductoNombre },
  { header: 'BloqueHorario', value: (row) => row.BloqueHorario },
  { header: 'UsuarioValidador', value: (row) => row.UsuarioValidador },
]

export default function AccesosReportPage() {
  const { message } = AntdApp.useApp()
  const [dashboard, setDashboard] = useState<DashboardReportDto | null>(null)
  const [items, setItems] = useState<SimpleReportItemDto[]>([])
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

      const [dashboardData, accessData] = await Promise.all([
        reportesService.dashboard(params),
        reportesService.accesosPorBloque(params),
      ])
      setDashboard(dashboardData)
      setItems(accessData)
    } catch (error) {
      message.error(getApiErrorMessage(error, 'No se pudieron cargar los reportes de accesos.'))
    } finally {
      setLoading(false)
    }
  }

  const exportCsv = async () => {
    setExportingCsv(true)
    try {
      const params = getFiltroParams()
      const rows = await reportesService.exportarAccesos(params)

      downloadCsv({
        fileName: `reporte-accesos-${params.periodo}-${params.fechaReferencia}.csv`,
        columns: CSV_COLUMNS,
        rows,
        delimiter: ';',
      })
    } catch (error) {
      message.error(getApiErrorMessage(error, 'No se pudo descargar el CSV de accesos.'))
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
        title="Reportes de accesos"
        subtitle="Seguimiento por dia, mes o anio de validaciones y bloque horario."
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

      <Card className="tms-compact-card"><Statistic title="Accesos autorizados del periodo" value={dashboard?.AccesosAutorizadosHoy ?? 0} loading={loading} /></Card>
      <Card title="Accesos por bloque horario" className="tms-page-table-card">
        <Table rowKey="Etiqueta" loading={loading} pagination={false} dataSource={items} columns={[{ title: 'Bloque', dataIndex: 'Etiqueta' }, { title: 'Accesos', dataIndex: 'Valor' }]} />
      </Card>
    </div>
  )
}
