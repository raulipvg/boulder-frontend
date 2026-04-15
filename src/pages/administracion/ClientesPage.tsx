import { Button, Card, Form, Input, Modal, Select, Space, Table, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { administracionService } from '../../services/administracion/administracionService'
import type { ClienteDto, TipoClienteDto } from '../../types/models'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'

export default function ClientesPage() {
  const [items, setItems] = useState<ClienteDto[]>([])
  const [tipos, setTipos] = useState<TipoClienteDto[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const load = async (searchValue = '') => {
    setLoading(true)
    try {
      const [clientes, tiposCliente] = await Promise.all([
        administracionService.getClientes(searchValue),
        administracionService.getTiposCliente(),
      ])
      setItems(clientes)
      setTipos(tiposCliente)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(search)
  }, [search])

  return (
    <>
      <RequireCompanyAlert />
      <Card>
        <div className="page-actions">
          <Space>
            <div>
              <Typography.Title level={3} style={{ margin: 0 }}>Clientes</Typography.Title>
              <Typography.Text type="secondary">Escaladores registrados por empresa.</Typography.Text>
            </div>
            <Input.Search placeholder="Buscar por nombre o RUT" style={{ width: 280 }} onSearch={setSearch} allowClear />
          </Space>
          <Button type="primary" onClick={() => setOpen(true)}>Nuevo cliente</Button>
        </div>

        <Table
          rowKey="ClienteEmpresaId"
          loading={loading}
          dataSource={items}
          columns={[
            { title: 'Nombre', dataIndex: 'NombreCompleto' },
            { title: 'RUT', dataIndex: 'Rut' },
            { title: 'Correo', dataIndex: 'Correo' },
            { title: 'Teléfono', dataIndex: 'Telefono' },
            { title: 'Tipo cliente', dataIndex: 'TipoCliente' },
            { title: 'Estado', dataIndex: 'Estado' },
          ]}
        />

        <Modal open={open} title="Nuevo cliente" onCancel={() => setOpen(false)} onOk={() => form.submit()} destroyOnHidden>
          <Form
            form={form}
            layout="vertical"
            onFinish={async (values) => {
              await administracionService.createCliente(values)
              setOpen(false)
              form.resetFields()
              await load(search)
            }}
          >
            <Form.Item name="NombreCompleto" label="Nombre completo" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="Rut" label="RUT" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="FechaNacimiento" label="Fecha nacimiento"><Input placeholder="2020-01-01" /></Form.Item>
            <Form.Item name="Telefono" label="Teléfono"><Input /></Form.Item>
            <Form.Item name="Correo" label="Correo"><Input /></Form.Item>
            <Form.Item name="TipoClienteId" label="Tipo cliente" rules={[{ required: true }]}>
              <Select options={tipos.map((tipo) => ({ value: tipo.TipoClienteId, label: tipo.Nombre }))} />
            </Form.Item>
            <Form.Item name="Estado" label="Estado" initialValue="activo" rules={[{ required: true }]}>
              <Select options={[{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }, { value: 'bloqueado', label: 'Bloqueado' }]} />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </>
  )
}
