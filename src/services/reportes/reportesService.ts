import apiClient from '../apiClient'
import type { DashboardReportDto, SimpleReportItemDto } from '../../types/models'

export const reportesService = {
  dashboard: async () => (await apiClient.get<DashboardReportDto>('/reportes/dashboard')).data,
  ventasPorProducto: async () => (await apiClient.get<SimpleReportItemDto[]>('/reportes/ventas/producto')).data,
  ventasPorTipoCliente: async () => (await apiClient.get<SimpleReportItemDto[]>('/reportes/ventas/tipo-cliente')).data,
  accesosPorBloque: async () => (await apiClient.get<SimpleReportItemDto[]>('/reportes/accesos/bloque')).data,
  usoClases: async () => (await apiClient.get<SimpleReportItemDto[]>('/reportes/clases/uso')).data,
}
