import { Tag } from 'antd'

export const estadoTag = (estado: string) => {
  if (estado === 'activo') return <Tag color="success" variant="filled">ACTIVO</Tag>
  if (estado === 'inactivo') return <Tag color="default" variant="filled">INACTIVO</Tag>
  return <Tag color="error" variant="filled">BLOQUEADO</Tag>
}

export const tipoClienteTag = (tipo?: string) => (
  <Tag color="blue" variant="filled">{tipo || 'Sin tipo'}</Tag>
)
