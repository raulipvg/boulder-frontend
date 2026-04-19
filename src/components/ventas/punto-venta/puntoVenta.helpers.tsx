import {
  AppstoreOutlined,
  CalendarOutlined,
  TagsOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import type { ClienteLookupDto, PosCatalogItemDto } from '../../../types/models'
import { toCapitalCase } from '../../../utils/formatPersonName'
import type { ProductTypeMeta } from './puntoVenta.types'

export const REQUIRED_CLIENT_CODES = new Set([
  'CLASES',
  'MENSUALIDAD_POR_HORARIO',
  'MENSUALIDAD_TODO_HORARIO',
  'PACK_TICKETS',
  'TICKET_INDIVIDUAL',
])

export const DUAL_TARIFA_CODES = new Set([
  'CLASES',
  'TICKET_INDIVIDUAL',
  'PACK_TICKETS',
  'MENSUALIDAD_POR_HORARIO',
  'MENSUALIDAD_TODO_HORARIO',
])

const currencyFormatter = new Intl.NumberFormat('es-CL')

export const formatCurrency = (value?: number | null) => `$ ${currencyFormatter.format(Math.max(0, value ?? 0))}`

export const normalizeTypeCode = (value: string) => value.trim().toUpperCase().replace(/\s+/g, '_')

export const toDayCapitalCase = (value: string) => {
  const normalized = value.trim()
  if (!normalized) {
    return normalized
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
}

export function getProductTypeMeta(typeCode: string): ProductTypeMeta {
  const normalized = normalizeTypeCode(typeCode)

  if (normalized.includes('PACK') || normalized.includes('TICKET')) {
    return { family: 'TICKETS', label: 'Tickets', icon: <TagsOutlined /> }
  }

  if (normalized.includes('MENSUALIDAD')) {
    return { family: 'MENSUALIDADES', label: 'Mensualidades', icon: <CalendarOutlined /> }
  }

  if (normalized.includes('CLASE')) {
    return { family: 'CLASES', label: 'Clases', icon: <TeamOutlined /> }
  }

  if (normalized.includes('ARRIENDO') || normalized.includes('ZAPATILLA')) {
    return { family: 'ARRIENDO', label: 'Arriendo', icon: <AppstoreOutlined /> }
  }

  if (normalized.includes('CAJA') || normalized.includes('CAFE') || normalized.includes('BEBIDA')) {
    return { family: 'MOSTRADOR', label: 'Mostrador', icon: <AppstoreOutlined /> }
  }

  return {
    family: 'OTROS',
    label: toCapitalCase(normalized.replace(/_/g, ' ').toLowerCase()),
    icon: <AppstoreOutlined />,
  }
}

export function requiresAssignedClient(product: PosCatalogItemDto): boolean {
  return REQUIRED_CLIENT_CODES.has(product.TipoProductoBaseCodigo)
}

export function formatClientLabel(cliente: ClienteLookupDto): string {
  return `${toCapitalCase(cliente.NombreCompleto)} (${cliente.Rut})`
}
