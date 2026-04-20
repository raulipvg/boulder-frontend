import apiClient from '../apiClient'
import type { ReportePeriodo } from '../../constants/reportes'
import type { DashboardReportDto, SimpleReportItemDto } from '../../types/models'

interface ReportesFiltroParams {
  periodo: ReportePeriodo
  fechaReferencia: string
}

export const reportesService = {
  dashboard: async (params: ReportesFiltroParams) => (await apiClient.get<DashboardReportDto>('/reportes/dashboard', { params })).data,
  ventasPorProducto: async (params: ReportesFiltroParams) => (await apiClient.get<SimpleReportItemDto[]>('/reportes/ventas/producto', { params })).data,
  ventasPorTipoCliente: async (params: ReportesFiltroParams) => (await apiClient.get<SimpleReportItemDto[]>('/reportes/ventas/tipo-cliente', { params })).data,
  accesosPorBloque: async (params: ReportesFiltroParams) => (await apiClient.get<SimpleReportItemDto[]>('/reportes/accesos/bloque', { params })).data,
  usoClases: async (params: ReportesFiltroParams) => (await apiClient.get<SimpleReportItemDto[]>('/reportes/clases/uso', { params })).data,
}
