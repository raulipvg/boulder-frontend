import { EditOutlined, KeyOutlined, MailOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Empty, Space, Tooltip, Typography } from 'antd'
import type { UsuarioDto } from '../../../types/models'
import { toCapitalCase } from '../../../utils/formatPersonName'
import { estadoTag, rolesTagList } from './usuarios'

type UsuariosMobileListProps = {
  items: UsuarioDto[]
  onEdit: (record: UsuarioDto) => void
  onPassword: (record: UsuarioDto) => void
}

export function UsuariosMobileList({ items, onEdit, onPassword }: UsuariosMobileListProps) {
  if (items.length === 0) {
    return <Empty description="Sin usuarios registrados" />
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {items.map((record) => (
        <Card size="small" key={record.UsuarioId}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ minWidth: 0, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600, fontSize: 16 }}>
                <Avatar style={{ backgroundColor: '#1890ff', flexShrink: 0 }}>{record.NombreCompleto.charAt(0).toUpperCase()}</Avatar>
                <div>
                  <div style={{ lineHeight: 1.2 }}>{toCapitalCase(record.NombreCompleto)}</div>
                </div>
              </div>

              <div style={{ marginTop: 16, display: 'grid', gap: 8, fontSize: 13, background: '#fafafa', padding: 12, borderRadius: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center' }}><MailOutlined style={{ marginRight: 8, color: '#8c8c8c' }} /><Typography.Text ellipsis>{record.EmailLogin}</Typography.Text></span>
                <span style={{ display: 'flex', alignItems: 'center', color: '#8c8c8c' }}>Empresa: <Typography.Text style={{ marginLeft: 4 }}>{record.EmpresaNombre || 'Sin empresa'}</Typography.Text></span>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  {estadoTag(record.Estado)}
                  {rolesTagList(record.Roles)}
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Space size={8}>
              <Tooltip title="Editar perfil de usuario">
                <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={() => onEdit(record)}>Editar</Button>
              </Tooltip>
              <Tooltip title="Cambiar contrasena">
                <Button size="small" icon={<KeyOutlined />} onClick={() => onPassword(record)}>Clave</Button>
              </Tooltip>
            </Space>
          </div>
        </Card>
      ))}
    </div>
  )
}
