import { EditOutlined, KeyOutlined, MailOutlined } from '@ant-design/icons'
import { Avatar, Button, Space, Table, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { UsuarioDto } from '../../../types/models'
import { toCapitalCase } from '../../../utils/formatPersonName'
import { estadoTag, rolesTagList } from './usuarios'

type UsuariosTableProps = {
  items: UsuarioDto[]
  onEdit: (record: UsuarioDto) => void
  onPassword: (record: UsuarioDto) => void
}

export function UsuariosTable({ items, onEdit, onPassword }: UsuariosTableProps) {
  const columns: ColumnsType<UsuarioDto> = [
    {
      title: 'Usuario',
      key: 'NombreCompleto',
      render: (_, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff', verticalAlign: 'middle' }}>{record.NombreCompleto.charAt(0).toUpperCase()}</Avatar>
          <Typography.Text strong>{toCapitalCase(record.NombreCompleto)}</Typography.Text>
        </Space>
      )
    },
    {
      title: 'Cuenta / Correo',
      dataIndex: 'EmailLogin',
      key: 'EmailLogin',
      ellipsis: true,
      render: (email) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <MailOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
          <Typography.Text>{email}</Typography.Text>
        </div>
      )
    },
    {
      title: 'Estado',
      key: 'Estado',
      responsive: ['sm'],
      render: (_, record) => estadoTag(record.Estado),
    },
    {
      title: 'Roles',
      key: 'Roles',
      responsive: ['md'],
      render: (_, record) => rolesTagList(record.Roles),
    },
    {
      title: 'Empresa',
      dataIndex: 'EmpresaNombre',
      key: 'EmpresaNombre',
      responsive: ['lg'],
      render: (empresa) => empresa ? <Typography.Text>{empresa}</Typography.Text> : <Typography.Text type="secondary">N/A</Typography.Text>
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'right',
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="Editar perfil de usuario">
            <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={() => onEdit(record)}>Editar</Button>
          </Tooltip>
          <Tooltip title="Cambiar contrasena">
            <Button size="small" icon={<KeyOutlined />} onClick={() => onPassword(record)}>Clave</Button>
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Table
      rowKey="UsuarioId"
      columns={columns}
      dataSource={items}
      scroll={{ x: 980 }}
      tableLayout="auto"
      pagination={false}
    />
  )
}
