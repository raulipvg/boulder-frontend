import { ReloadOutlined } from '@ant-design/icons'
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
import type { DashboardReportDto, SimpleReportItemDto } from '../../types/models'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'

export default function AccesosReportPage() {
  const { message } = AntdApp.useApp()
  const [dashboard, setDashboard] = useState<DashboardReportDto | null>(null)
  const [items, setItems] = useState<SimpleReportItemDto[]>([])
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
      />

      <Card className="tms-compact-card"><Statistic title="Accesos autorizados del periodo" value={dashboard?.AccesosAutorizadosHoy ?? 0} loading={loading} /></Card>
      <Card title="Accesos por bloque horario" className="tms-page-table-card">
        <Table rowKey="Etiqueta" loading={loading} pagination={false} dataSource={items} columns={[{ title: 'Bloque', dataIndex: 'Etiqueta' }, { title: 'Accesos', dataIndex: 'Valor' }]} />
      </Card>
    </div>
  )
}
