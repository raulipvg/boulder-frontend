import { Tag } from 'antd'

export const isEstadoActivo = (estado: unknown) => {
  if (typeof estado === 'string') {
    const normalized = estado.trim().toLowerCase()
    return normalized === 'activo'
  }

  return false
}

export const estadoTag = (estado: string) => (
  <Tag variant="filled" color={isEstadoActivo(estado) ? 'success' : 'default'}>
    {isEstadoActivo(estado) ? 'ACTIVO' : 'INACTIVO'}
  </Tag>
)
