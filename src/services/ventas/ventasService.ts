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

interface VentaItemRequest {
  ProductoEmpresaId: number
  Cantidad: number
  ClienteEmpresaIdAsignado?: number | null
  FechaInicioVigencia?: string | null
  Observacion?: string | null
}

interface PreviewVentaRequest {
  ClienteEmpresaId?: number | null
  Items: VentaItemRequest[]
}

interface CreateVentaRequest {
  ClienteEmpresaId?: number | null
  Items: VentaItemRequest[]
  Pagos: Array<{
    MedioPagoId: number
    Monto: number
    Referencia?: string | null
  }>
}

export const ventasService = {
  getPosCatalog: async () => (await apiClient.get<PosCatalogItemDto[]>('/ventas/pos/catalogo')).data,
  previewVenta: async (payload: PreviewVentaRequest) => (await apiClient.post<VentaPreviewDto>('/ventas/pos/preview', payload)).data,
  createVenta: async (payload: CreateVentaRequest) => (await apiClient.post<VentaDto>('/ventas/pos/ventas', payload)).data,
  getVentas: async () => (await apiClient.get<VentaDto[]>('/ventas/ventas')).data,
  anularVenta: async (ventaId: number, Motivo: string) => (await apiClient.post<VentaDto>(`/ventas/ventas/${ventaId}/anular`, { Motivo })).data,
}
