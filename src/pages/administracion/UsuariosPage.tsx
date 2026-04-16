import {
  EditOutlined,
  KeyOutlined,
  MailOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import {
  App as AntdApp,
  Button,
  Card,
  Empty,
  Form,
  Grid,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useState } from 'react'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { useAuth } from '../../context/AuthContext'
import { administracionService } from '../../services/administracion/administracionService'
import type { EmpresaDto, UsuarioDto } from '../../types/models'
import { toCapitalCase } from '../../utils/formatPersonName'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'

const { useBreakpoint } = Grid

const estadoTag = (estado: string) => <Tag color={estado === 'activo' ? 'green' : 'red'}>{estado === 'activo' ? 'Activo' : 'Inactivo'}</Tag>

export default function UsuariosPage() {
  const { message } = AntdApp.useApp()
  const { user } = useAuth()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const [items, setItems] = useState<UsuarioDto[]>([])
  const [empresas, setEmpresas] = useState<EmpresaDto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<UsuarioDto | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [passwordTarget, setPasswordTarget] = useState<UsuarioDto | null>(null)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()

  const isAdminTotal = user?.RoleCodes.includes('ADMIN_TOTAL')

  const load = async () => {
    setLoading(true)
    try {
      const [usuarios, empresasData] = await Promise.all([
        administracionService.getUsuarios(),
        isAdminTotal ? administracionService.getEmpresas() : Promise.resolve([]),
      ])
      setItems(usuarios)
      setEmpresas(empresasData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [isAdminTotal])

  const openCreate = () => {
    setEditingItem(null)
    form.resetFields()
    setOpen(true)
  }

  const openEdit = (record: UsuarioDto) => {
    setEditingItem(record)
    form.setFieldsValue({
      NombreCompleto: record.NombreCompleto,
      Rut: record.Rut,
      EmailLogin: record.EmailLogin,
      Estado: record.Estado,
      RolCodigo: record.Roles[0],
      EmpresaId: record.EmpresaId ?? undefined,
    })
    setOpen(true)
  }

  const openPassword = (record: UsuarioDto) => {
    setPasswordTarget(record)
    passwordForm.resetFields()
    setPasswordOpen(true)
  }

  const roleTags = (record: UsuarioDto) => {
    if (!record.Roles?.length) {
      return <Tag>Sin roles</Tag>
    }

    return (
      <Space size={4} wrap>
        {record.Roles.map((rol) => (
          <Tag key={rol} color="blue">{rol}</Tag>
        ))}
      </Space>
    )
  }

  const actionButtons = (record: UsuarioDto) => (
    <Space size={2}>
      <Tooltip title="Editar usuario">
        <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
      </Tooltip>
      <Tooltip title="Cambiar contrasena">
        <Button type="text" icon={<KeyOutlined />} onClick={() => openPassword(record)} />
      </Tooltip>
    </Space>
  )

  const columns: ColumnsType<UsuarioDto> = [
    { title: 'Nombre', key: 'NombreCompleto', render: (_, record) => toCapitalCase(record.NombreCompleto) },
    { title: 'Correo', dataIndex: 'EmailLogin', key: 'EmailLogin', ellipsis: true },
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
      render: (_, record) => roleTags(record),
    },
    { title: 'Empresa', dataIndex: 'EmpresaNombre', key: 'EmpresaNombre', responsive: ['lg'] },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => actionButtons(record),
    },
  ]

  return (
    <div className="tms-page">
      <PageHeaderCard
        title="Usuarios"
        subtitle="Usuarios internos y sus roles operativos."
        actions={(
          <>
            <Button icon={<ReloadOutlined />} onClick={() => void load()} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Nuevo usuario
            </Button>
          </>
        )}
      />

      <Card className="tms-page-table-card" loading={loading}>
        {isMobile ? (
          items.length > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {items.map((record) => (
                <Card size="small" key={record.UsuarioId}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{toCapitalCase(record.NombreCompleto)}</div>
                      <div style={{ color: '#6b7280', fontSize: 12, marginTop: 3 }}>
                        <MailOutlined style={{ marginRight: 6 }} />
                        {record.EmailLogin}
                      </div>
                      <div style={{ marginTop: 8 }}>{estadoTag(record.Estado)}</div>
                      <div style={{ marginTop: 8 }}>{roleTags(record)}</div>
                      <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>
                        Empresa: {record.EmpresaNombre || 'Sin empresa'}
                      </div>
                    </div>
                    {actionButtons(record)}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Empty description="Sin usuarios registrados" />
          )
        ) : (
          <Table
            rowKey="UsuarioId"
            columns={columns}
            dataSource={items}
            scroll={{ x: 980 }}
            tableLayout="auto"
            pagination={false}
          />
        )}
      </Card>

      <Modal
        open={open}
        title={editingItem ? 'Editar usuario' : 'Nuevo usuario'}
        onCancel={() => {
          setOpen(false)
          setEditingItem(null)
        }}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            setSubmitting(true)
            try {
              const payload = {
                NombreCompleto: values.NombreCompleto,
                Rut: values.Rut,
                EmailLogin: values.EmailLogin,
                Estado: values.Estado,
                RolCodigo: values.RolCodigo,
                EmpresaId: values.EmpresaId ?? null,
              }

              if (editingItem) {
                await administracionService.updateUsuario(editingItem.UsuarioId, payload)
                message.success('Usuario actualizado correctamente.')
              } else {
                await administracionService.createUsuario({
                  ...payload,
                  Password: values.Password,
                })
                message.success('Usuario creado correctamente.')
              }

              setOpen(false)
              setEditingItem(null)
              form.resetFields()
              await load()
            } catch (error) {
              message.error(getApiErrorMessage(error, `No se pudo ${editingItem ? 'actualizar' : 'crear'} el usuario.`))
            } finally {
              setSubmitting(false)
            }
          }}
        >
          <Form.Item name="NombreCompleto" label="Nombre completo" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="Rut" label="RUT" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="EmailLogin" label="Correo" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {!editingItem && (
            <Form.Item name="Password" label="Contrasena" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="Estado" label="Estado" initialValue="activo" rules={[{ required: true }]}>
            <Select options={[{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }]} />
          </Form.Item>
          <Form.Item name="RolCodigo" label="Rol" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'ADMIN_TOTAL', label: 'Administrador Total' },
                { value: 'ADMIN_EMPRESA', label: 'Administrador Empresa' },
                { value: 'VENDEDOR_EMPRESA', label: 'Vendedor Empresa' },
              ].filter((item) => isAdminTotal || item.value !== 'ADMIN_TOTAL')}
            />
          </Form.Item>
          {isAdminTotal && (
            <Form.Item name="EmpresaId" label="Empresa asociada">
              <Select allowClear options={empresas.map((empresa) => ({ value: empresa.EmpresaId, label: empresa.NombreComercial }))} />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        open={passwordOpen}
        title={`Cambiar contrasena${passwordTarget ? ` · ${toCapitalCase(passwordTarget.NombreCompleto)}` : ''}`}
        onCancel={() => {
          setPasswordOpen(false)
          setPasswordTarget(null)
        }}
        onOk={() => passwordForm.submit()}
        confirmLoading={passwordSubmitting}
        destroyOnHidden
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={async (values) => {
            if (!passwordTarget) {
              return
            }

            setPasswordSubmitting(true)
            try {
              await administracionService.changePasswordUsuario(passwordTarget.UsuarioId, { NuevaPassword: values.NuevaPassword })
              message.success(`Contrasena actualizada para ${toCapitalCase(passwordTarget.NombreCompleto)}.`)
              setPasswordOpen(false)
              setPasswordTarget(null)
              passwordForm.resetFields()
            } catch (error) {
              message.error(getApiErrorMessage(error, 'No se pudo cambiar la contrasena.'))
            } finally {
              setPasswordSubmitting(false)
            }
          }}
        >
          <Form.Item name="NuevaPassword" label="Nueva contrasena" rules={[{ required: true, min: 8 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="ConfirmPassword"
            label="Confirmar contrasena"
            dependencies={['NuevaPassword']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator: (_, value) => {
                  if (!value || getFieldValue('NuevaPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Las contrasenas no coinciden'))
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
