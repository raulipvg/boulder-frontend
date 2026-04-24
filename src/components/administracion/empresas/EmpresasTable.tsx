import { EditOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'
import { Avatar, Button, Space, Table, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { EmpresaDto } from '../../../types/models'
import { estadoTag } from './empresas'

type EmpresasTableProps = {
  items: EmpresaDto[]
  onEdit: (record: EmpresaDto) => void
}

export function EmpresasTable({ items, onEdit }: EmpresasTableProps) {
  const columns: ColumnsType<EmpresaDto> = [
    {
      title: 'Empresa',
      key: 'NombreComercial',
      render: (_, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff', verticalAlign: 'middle' }}>{record.NombreComercial.charAt(0).toUpperCase()}</Avatar>
          <div style={{ minWidth: 0 }}>
            <Typography.Text strong>{record.NombreComercial}</Typography.Text>
            {record.RazonSocial ? (
              <div>
                <Typography.Text type="secondary" ellipsis>{record.RazonSocial}</Typography.Text>
              </div>
            ) : null}
          </div>
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
          {record.CorreoContacto ? (
            <div style={{ fontSize: 13, display: 'flex', alignItems: 'center' }}>
              <MailOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
              <Typography.Text ellipsis style={{ maxWidth: 180 }}>{record.CorreoContacto}</Typography.Text>
            </div>
          ) : null}
          {record.TelefonoContacto ? (
            <div style={{ fontSize: 13 }}>
              <PhoneOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
              {record.TelefonoContacto}
            </div>
          ) : null}
          {!record.CorreoContacto && !record.TelefonoContacto ? <Typography.Text type="secondary" style={{ fontSize: 13 }}>No registrado</Typography.Text> : null}
        </div>
      )
    },
    {
      title: 'Moneda',
      dataIndex: 'MonedaCodigo',
      key: 'MonedaCodigo',
      responsive: ['lg'],
      render: (moneda) => <Typography.Text>{moneda}</Typography.Text>
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
        <Tooltip title="Editar empresa">
          <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={() => onEdit(record)}>Editar</Button>
        </Tooltip>
      ),
    },
  ]

  return (
    <Table
      rowKey="EmpresaId"
      columns={columns}
      dataSource={items}
      scroll={{ x: 980 }}
      tableLayout="auto"
      pagination={false}
    />
  )
}
