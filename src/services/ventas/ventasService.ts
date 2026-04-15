import apiClient from '../apiClient'
import type { PosCatalogItemDto, VentaDto } from '../../types/models'

interface VentaPreviewDto {
  Subtotal: number
  Total: number
  Detalles: Array<{
    ProductoEmpresaId: number
    ProductoNombre: string
    Cantidad: number
    PrecioUnitario: number
    Subtotal: number
  }>
}

export const ventasService = {
  getPosCatalog: async () => (await apiClient.get<PosCatalogItemDto[]>('/ventas/pos/catalogo')).data,
  previewVenta: async (payload: Record<string, unknown>) => (await apiClient.post<VentaPreviewDto>('/ventas/pos/preview', payload)).data,
  createVenta: async (payload: Record<string, unknown>) => (await apiClient.post<VentaDto>('/ventas/pos/ventas', payload)).data,
  getVentas: async () => (await apiClient.get<VentaDto[]>('/ventas/ventas')).data,
  anularVenta: async (ventaId: number, Motivo: string) => (await apiClient.post<VentaDto>(`/ventas/ventas/${ventaId}/anular`, { Motivo })).data,
}
