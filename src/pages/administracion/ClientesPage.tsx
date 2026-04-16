import { App as AntdApp, Button, Card, Form, Input, Modal, Select, Space, Table, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { administracionService } from '../../services/administracion/administracionService'
import type { ClienteDto, TipoClienteDto } from '../../types/models'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import { toCapitalCase } from '../../utils/formatPersonName'
import { isValidRut, normalizeRut } from '../../utils/rut'

export default function ClientesPage() {
  const { message } = AntdApp.useApp()
  const [items, setItems] = useState<ClienteDto[]>([])
  const [tipos, setTipos] = useState<TipoClienteDto[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ClienteDto | null>(null)
  const [submitting, setSubmitting] = useState(false)
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

  useEffect(() => {
    if (!open || !editingItem) {
      return
    }

    const tipoClienteId = editingItem.TipoClienteId
      ?? tipos.find((tipo) => tipo.Nombre === editingItem.TipoCliente)?.TipoClienteId

    form.setFieldsValue({
      NombreCompleto: editingItem.NombreCompleto,
      Rut: editingItem.Rut,
      FechaNacimiento: editingItem.FechaNacimiento ?? undefined,
      Telefono: editingItem.Telefono ?? undefined,
      Correo: editingItem.Correo ?? undefined,
      TipoClienteId: tipoClienteId,
      Estado: editingItem.Estado,
    })
  }, [editingItem, form, open, tipos])

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
          <Button
            type="primary"
            onClick={() => {
              setEditingItem(null)
              form.resetFields()
              form.setFieldsValue({ Estado: 'activo' })
              setOpen(true)
            }}
          >
            Nuevo cliente
          </Button>
        </div>

        <Table
          rowKey="ClienteEmpresaId"
          loading={loading}
          dataSource={items}
          columns={[
            { title: 'Nombre', render: (_, record) => toCapitalCase(record.NombreCompleto) },
            { title: 'RUT', dataIndex: 'Rut' },
            { title: 'Correo', dataIndex: 'Correo' },
            { title: 'Teléfono', dataIndex: 'Telefono' },
            { title: 'Tipo cliente', dataIndex: 'TipoCliente' },
            { title: 'Estado', dataIndex: 'Estado' },
            {
              title: 'Acciones',
              render: (_, record) => (
                <Button
                  type="link"
                  onClick={() => {
                    setEditingItem(record)
                    setOpen(true)
                  }}
                >
                  Editar
                </Button>
              ),
            },
          ]}
        />

        <Modal
          open={open}
          title={editingItem ? 'Editar cliente' : 'Nuevo cliente'}
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
                  ...values,
                  NombreCompleto: values.NombreCompleto?.trim(),
                  Rut: normalizeRut(values.Rut),
                }

                if (editingItem) {
                  await administracionService.updateCliente(editingItem.ClienteEmpresaId, payload)
                  message.success('Cliente actualizado correctamente.')
                } else {
                  await administracionService.createCliente(payload)
                  message.success('Cliente creado correctamente.')
                }

                setOpen(false)
                setEditingItem(null)
                form.resetFields()
                await load(search)
              } catch (error) {
                message.error(getApiErrorMessage(error, `No se pudo ${editingItem ? 'actualizar' : 'crear'} el cliente.`))
              } finally {
                setSubmitting(false)
              }
            }}
          >
            <Form.Item name="NombreCompleto" label="Nombre completo" rules={[{ required: true, whitespace: true }]}><Input /></Form.Item>
            <Form.Item
              name="Rut"
              label="RUT"
              rules={[
                { required: true },
                {
                  validator: (_, value) => {
                    if (!value || isValidRut(value)) {
                      return Promise.resolve()
                    }

                    return Promise.reject(new Error('Ingresa un RUT válido.'))
                  },
                },
              ]}
            >
              <Input />
            </Form.Item>
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
