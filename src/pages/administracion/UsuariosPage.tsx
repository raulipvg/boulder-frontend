import { Button, Card, Form, Input, Modal, Select, Table, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { administracionService } from '../../services/administracion/administracionService'
import type { EmpresaDto, UsuarioDto } from '../../types/models'

export default function UsuariosPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<UsuarioDto[]>([])
  const [empresas, setEmpresas] = useState<EmpresaDto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

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
        <Button type="primary" onClick={() => setOpen(true)}>Nuevo usuario</Button>
      </div>

      <Table
        rowKey="UsuarioId"
        loading={loading}
        dataSource={items}
        columns={[
          { title: 'Nombre', dataIndex: 'NombreCompleto' },
          { title: 'Correo', dataIndex: 'EmailLogin' },
          { title: 'Estado', dataIndex: 'Estado' },
          { title: 'Roles', render: (_, record) => record.Roles.join(', ') },
          { title: 'Empresa', dataIndex: 'EmpresaNombre' },
        ]}
      />

      <Modal open={open} title="Nuevo usuario" onCancel={() => setOpen(false)} onOk={() => form.submit()} destroyOnHidden>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            await administracionService.createUsuario({
              NombreCompleto: values.NombreCompleto,
              Rut: values.Rut,
              EmailLogin: values.EmailLogin,
              Password: values.Password,
              RolCodigo: values.RolCodigo,
              EmpresaId: values.EmpresaId ?? null,
            })
            setOpen(false)
            form.resetFields()
            await load()
          }}
        >
          <Form.Item name="NombreCompleto" label="Nombre completo" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="Rut" label="RUT" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="EmailLogin" label="Correo" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="Password" label="Contraseña" rules={[{ required: true }]}><Input.Password /></Form.Item>
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
    </Card>
  )
}
