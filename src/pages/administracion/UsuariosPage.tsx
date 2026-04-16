import { App as AntdApp, Button, Card, Form, Input, Modal, Select, Space, Table, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { administracionService } from '../../services/administracion/administracionService'
import type { EmpresaDto, UsuarioDto } from '../../types/models'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import { toCapitalCase } from '../../utils/formatPersonName'

export default function UsuariosPage() {
  const { message } = AntdApp.useApp()
  const { user } = useAuth()
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

  return (
    <Card>
      <div className="page-actions">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>Usuarios</Typography.Title>
          <Typography.Text type="secondary">Usuarios internos y sus roles operativos.</Typography.Text>
        </div>
        <Button
          type="primary"
          onClick={() => {
            setEditingItem(null)
            form.resetFields()
            setOpen(true)
          }}
        >
          Nuevo usuario
        </Button>
      </div>

      <Table
        rowKey="UsuarioId"
        loading={loading}
        dataSource={items}
        columns={[
          { title: 'Nombre', render: (_, record) => toCapitalCase(record.NombreCompleto) },
          { title: 'Correo', dataIndex: 'EmailLogin' },
          { title: 'Estado', dataIndex: 'Estado' },
          { title: 'Roles', render: (_, record) => record.Roles.join(', ') },
          { title: 'Empresa', dataIndex: 'EmpresaNombre' },
          {
            title: 'Acciones',
            render: (_, record) => (
              <Space size={4}>
                <Button
                  type="link"
                  onClick={() => {
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
                  }}
                >
                  Editar
                </Button>
                <Button
                  type="link"
                  onClick={() => {
                    setPasswordTarget(record)
                    passwordForm.resetFields()
                    setPasswordOpen(true)
                  }}
                >
                  Cambiar contraseña
                </Button>
              </Space>
            ),
          },
        ]}
      />

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
          <Form.Item name="NombreCompleto" label="Nombre completo" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="Rut" label="RUT" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="EmailLogin" label="Correo" rules={[{ required: true }]}><Input /></Form.Item>
          {!editingItem && <Form.Item name="Password" label="Contraseña" rules={[{ required: true }]}><Input.Password /></Form.Item>}
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
        title={`Cambiar contraseña${passwordTarget ? ` · ${toCapitalCase(passwordTarget.NombreCompleto)}` : ''}`}
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
              message.success(`Contraseña actualizada para ${toCapitalCase(passwordTarget.NombreCompleto)}.`)
              setPasswordOpen(false)
              setPasswordTarget(null)
              passwordForm.resetFields()
            } catch (error) {
              message.error(getApiErrorMessage(error, 'No se pudo cambiar la contraseña.'))
            } finally {
              setPasswordSubmitting(false)
            }
          }}
        >
          <Form.Item name="NuevaPassword" label="Nueva contraseña" rules={[{ required: true, min: 8 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="ConfirmPassword"
            label="Confirmar contraseña"
            dependencies={['NuevaPassword']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator: (_, value) => {
                  if (!value || getFieldValue('NuevaPassword') === value) {
                    return Promise.resolve()
                  }

                  return Promise.reject(new Error('Las contraseñas no coinciden'))
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
