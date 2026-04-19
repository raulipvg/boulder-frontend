import type { ReactNode } from 'react'
import type { PosCatalogItemDto } from '../../types/models'

export interface CartItem {
  Id: string
  Product: PosCatalogItemDto
  Quantity: number
  ClienteEmpresaIdAsignado?: number | null
}

export interface VentaPreviewDto {
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

export interface ProductTypeMeta {
  family: string
  label: string
  icon: ReactNode
}

export interface CreateClientFormValues {
  NombreCompleto: string
  Rut: string
  TipoClienteId: number
  Telefono?: string
  Correo?: string
}
