import { EditOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Empty, Tooltip, Typography } from 'antd'
import type { EmpresaDto } from '../../../types/models'
import { estadoTag } from './empresas'

type EmpresasMobileListProps = {
  items: EmpresaDto[]
  onEdit: (record: EmpresaDto) => void
}

export function EmpresasMobileList({ items, onEdit }: EmpresasMobileListProps) {
  if (items.length === 0) {
    return <Empty description="Sin empresas registradas" />
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {items.map((record) => (
        <Card size="small" key={record.EmpresaId}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ minWidth: 0, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600, fontSize: 16 }}>
                <Avatar style={{ backgroundColor: '#1890ff', flexShrink: 0 }}>{record.NombreComercial.charAt(0).toUpperCase()}</Avatar>
                <div style={{ minWidth: 0 }}>
                  <div style={{ lineHeight: 1.2 }}>{record.NombreComercial}</div>
                  <div style={{ color: '#8c8c8c', fontSize: 12, fontWeight: 'normal', fontFamily: 'monospace', marginTop: 2 }}>{record.Rut}</div>
                </div>
              </div>

              <div style={{ marginTop: 16, display: 'grid', gap: 8, fontSize: 13, background: '#fafafa', padding: 12, borderRadius: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <MailOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                  <Typography.Text ellipsis>{record.CorreoContacto || 'Sin correo'}</Typography.Text>
                </span>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                  {record.TelefonoContacto || 'Sin teléfono'}
                </span>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  <Typography.Text type="secondary">Moneda: {record.MonedaCodigo}</Typography.Text>
                  {estadoTag(record.Estado)}
                </div>
              </div>
            </div>

            <Tooltip title="Editar">
              <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} style={{ marginLeft: 8 }} />
            </Tooltip>
          </div>
        </Card>
      ))}
    </div>
  )
}
