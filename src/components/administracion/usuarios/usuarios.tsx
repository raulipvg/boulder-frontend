import { Space, Tag } from 'antd'

export const estadoTag = (estado: string) => (
  <Tag variant="filled" color={estado === 'activo' ? 'success' : 'default'}>{estado === 'activo' ? 'ACTIVO' : 'INACTIVO'}</Tag>
)

export const rolesTagList = (roles?: string[]) => {
  if (!roles?.length) {
    return <Tag variant="filled">Sin roles</Tag>
  }

  return (
    <Space size={4} wrap>
      {roles.map((rol) => (
        <Tag key={rol} color="blue" variant="filled">{rol}</Tag>
      ))}
    </Space>
  )
}
