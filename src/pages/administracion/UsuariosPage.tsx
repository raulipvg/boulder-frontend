import {
  EditOutlined,
  KeyOutlined,
  MailOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import {
  App as AntdApp,
  Avatar,
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
  Typography,
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

const estadoTag = (estado: string) => <Tag variant="filled" color={estado === 'activo' ? 'success' : 'default'}>{estado === 'activo' ? 'ACTIVO' : 'INACTIVO'}</Tag>

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
    setOpen(true)
  }

  const openEdit = (record: UsuarioDto) => {
    setEditingItem(record)
    setOpen(true)
  }

  useEffect(() => {
    if (!open) {
      return
    }

    if (!editingItem) {
      form.resetFields()
      return
    }

    form.setFieldsValue({
      NombreCompleto: editingItem.NombreCompleto,
      Rut: editingItem.Rut,
      EmailLogin: editingItem.EmailLogin,
      Estado: editingItem.Estado,
      RolCodigo: editingItem.Roles[0],
      EmpresaId: editingItem.EmpresaId ?? undefined,
    })
  }, [editingItem, form, open])

  const openPassword = (record: UsuarioDto) => {
    setPasswordTarget(record)
    setPasswordOpen(true)
  }

  useEffect(() => {
    if (passwordOpen) {
      passwordForm.resetFields()
    }
  }, [passwordForm, passwordOpen])

  const roleTags = (record: UsuarioDto) => {
    if (!record.Roles?.length) {
      return <Tag variant="filled">Sin roles</Tag>
    }

    return (
      <Space size={4} wrap>
        {record.Roles.map((rol) => (
          <Tag key={rol} color="blue" variant="filled">{rol}</Tag>
        ))}
      </Space>
    )
  }

  const actionButtons = (record: UsuarioDto) => (
    <Space size={8}>
      <Tooltip title="Editar perfil de usuario">
        <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={() => openEdit(record)}>Editar</Button>
      </Tooltip>
      <Tooltip title="Cambiar contrasena">
        <Button size="small" icon={<KeyOutlined />} onClick={() => openPassword(record)}>Clave</Button>
      </Tooltip>
    </Space>
  )

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
      render: (_, record) => roleTags(record),
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
                          {roleTags(record)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
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
