import { EditOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'
import { Avatar, Button, Space, Table, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ClienteDto } from '../../../types/models'
import { toCapitalCase } from '../../../utils/formatPersonName'
import { estadoTag, tipoClienteTag } from './clientes'

type ClientesTableProps = {
  items: ClienteDto[]
  onEdit: (record: ClienteDto) => void
}

export function ClientesTable({ items, onEdit }: ClientesTableProps) {
  const columns: ColumnsType<ClienteDto> = [
    {
      title: 'Cliente',
      key: 'NombreCompleto',
      render: (_, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff', verticalAlign: 'middle' }}>{record.NombreCompleto.charAt(0).toUpperCase()}</Avatar>
          <Typography.Text strong>{toCapitalCase(record.NombreCompleto)}</Typography.Text>
        </Space>
      )
    },
    {
      title: 'RUT',
      dataIndex: 'Rut',
      key: 'Rut',
      responsive: ['sm'],
      render: (rut) => <Typography.Text type="secondary" style={{ fontFamily: 'monospace' }}>{rut}</Typography.Text>
    },
    {
      title: 'Contacto',
      key: 'Contacto',
      responsive: ['md'],
      render: (_, record) => (
        <div style={{ display: 'grid', gap: 4 }}>
          {record.Correo ? <div style={{ fontSize: 13, display: 'flex', alignItems: 'center' }}><MailOutlined style={{ marginRight: 6, color: '#8c8c8c' }} /> <Typography.Text ellipsis style={{ maxWidth: 150 }}>{record.Correo}</Typography.Text></div> : null}
          {record.Telefono ? <div style={{ fontSize: 13 }}><PhoneOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />{record.Telefono}</div> : null}
          {!record.Correo && !record.Telefono ? <Typography.Text type="secondary" style={{ fontSize: 13 }}>No registrado</Typography.Text> : null}
        </div>
      )
    },
    {
      title: 'Tipo cliente',
      dataIndex: 'TipoCliente',
      key: 'TipoCliente',
      responsive: ['sm'],
      render: (tipo) => tipoClienteTag(tipo)
    },
    {
      title: 'Estado',
      key: 'Estado',
      responsive: ['sm'],
      render: (_, record) => estadoTag(record.Estado),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'right',
      render: (_, record) => (
        <Tooltip title="Editar perfil del cliente">
          <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={() => onEdit(record)}>Editar</Button>
        </Tooltip>
      ),
    },
  ]

  return (
    <Table
      rowKey="ClienteEmpresaId"
      columns={columns}
      dataSource={items}
      scroll={{ x: 900 }}
      tableLayout="auto"
      pagination={false}
    />
  )
}
