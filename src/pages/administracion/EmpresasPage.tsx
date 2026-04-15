import { Button, Card, Form, Input, Modal, Space, Table, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { administracionService } from '../../services/administracion/administracionService'
import type { EmpresaDto } from '../../types/models'

export default function EmpresasPage() {
  const [items, setItems] = useState<EmpresaDto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      setItems(await administracionService.getEmpresas())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <Card>
      <div className="page-actions">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>Empresas</Typography.Title>
          <Typography.Text type="secondary">Administración global de tenants SaaS.</Typography.Text>
        </div>
        <Button type="primary" onClick={() => setOpen(true)}>Nueva empresa</Button>
      </div>

      <Table
        rowKey="EmpresaId"
        loading={loading}
        dataSource={items}
        columns={[
          { title: 'Nombre comercial', dataIndex: 'NombreComercial' },
          { title: 'RUT', dataIndex: 'Rut' },
          { title: 'Estado', dataIndex: 'Estado' },
          { title: 'Moneda', dataIndex: 'MonedaCodigo' },
          { title: 'Correo', dataIndex: 'CorreoContacto' },
        ]}
      />

      <Modal
        open={open}
        title="Nueva empresa"
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            await administracionService.createEmpresa({
              NombreComercial: values.NombreComercial,
              RazonSocial: values.RazonSocial,
              Rut: values.Rut,
              TelefonoContacto: values.TelefonoContacto,
              CorreoContacto: values.CorreoContacto,
            })
            setOpen(false)
            form.resetFields()
            await load()
          }}
        >
          <Form.Item name="NombreComercial" label="Nombre comercial" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="RazonSocial" label="Razón social">
            <Input />
          </Form.Item>
          <Form.Item name="Rut" label="RUT" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="TelefonoContacto" label="Teléfono" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="CorreoContacto" label="Correo" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  )
}
