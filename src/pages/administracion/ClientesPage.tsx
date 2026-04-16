import {
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
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
  Table,
  Tag,
  Tooltip,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useState } from 'react'
import { PageFiltersCard } from '../../components/shared/PageFiltersCard'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { administracionService } from '../../services/administracion/administracionService'
import type { ClienteDto, TipoClienteDto } from '../../types/models'
import { toCapitalCase } from '../../utils/formatPersonName'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import { isValidRut, normalizeRut } from '../../utils/rut'

const { useBreakpoint } = Grid

const estadoTag = (estado: string) => {
  if (estado === 'activo') return <Tag color="green">Activo</Tag>
  if (estado === 'inactivo') return <Tag color="red">Inactivo</Tag>
  return <Tag color="orange">Bloqueado</Tag>
}

export default function ClientesPage() {
  const { message } = AntdApp.useApp()
  const screens = useBreakpoint()
  const isMobile = !screens.md

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

    const tipoClienteId = editingItem.TipoClienteId ?? tipos.find((tipo) => tipo.Nombre === editingItem.TipoCliente)?.TipoClienteId

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

  const openCreate = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({ Estado: 'activo' })
    setOpen(true)
  }

  const openEdit = (record: ClienteDto) => {
    setEditingItem(record)
    setOpen(true)
  }

  const columns: ColumnsType<ClienteDto> = [
    { title: 'Nombre', key: 'NombreCompleto', render: (_, record) => toCapitalCase(record.NombreCompleto) },
    { title: 'RUT', dataIndex: 'Rut', key: 'Rut', responsive: ['sm'] },
    { title: 'Correo', dataIndex: 'Correo', key: 'Correo', ellipsis: true, responsive: ['md'] },
    { title: 'Telefono', dataIndex: 'Telefono', key: 'Telefono', responsive: ['md'] },
    { title: 'Tipo cliente', dataIndex: 'TipoCliente', key: 'TipoCliente', responsive: ['sm'] },
    {
      title: 'Estado',
      key: 'Estado',
      responsive: ['sm'],
      render: (_, record) => estadoTag(record.Estado),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Tooltip title="Editar">
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
        </Tooltip>
      ),
    },
  ]

  return (
    <div className="tms-page">
      <RequireCompanyAlert />

      <PageHeaderCard
        title="Clientes"
        subtitle="Escaladores registrados por empresa."
        actions={(
          <>
            <Button icon={<ReloadOutlined />} onClick={() => void load(search)} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Nuevo cliente
            </Button>
          </>
        )}
      />

      <PageFiltersCard>
        <Input.Search
          className="tms-inline-search"
          placeholder="Buscar por nombre o RUT"
          prefix={<SearchOutlined />}
          onSearch={setSearch}
          allowClear
        />
      </PageFiltersCard>

      <Card className="tms-page-table-card" loading={loading}>
        {isMobile ? (
          items.length > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {items.map((record) => (
                <Card size="small" key={record.ClienteEmpresaId}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>
                        <UserOutlined style={{ marginRight: 6 }} />
                        {toCapitalCase(record.NombreCompleto)}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: 12, marginTop: 3 }}>{record.Rut}</div>
                      <div style={{ marginTop: 8, display: 'grid', gap: 4, fontSize: 12 }}>
                        <span><MailOutlined style={{ marginRight: 6 }} />{record.Correo || 'Sin correo'}</span>
                        <span><PhoneOutlined style={{ marginRight: 6 }} />{record.Telefono || 'Sin telefono'}</span>
                        <span>Tipo: {record.TipoCliente || 'Sin tipo'}</span>
                      </div>
                      <div style={{ marginTop: 8 }}>{estadoTag(record.Estado)}</div>
                    </div>

                    <Tooltip title="Editar">
                      <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
                    </Tooltip>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Empty description="Sin clientes registrados" />
          )
        ) : (
          <Table
            rowKey="ClienteEmpresaId"
            columns={columns}
            dataSource={items}
            scroll={{ x: 900 }}
            tableLayout="auto"
            pagination={false}
          />
        )}
      </Card>

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
          <Form.Item name="NombreCompleto" label="Nombre completo" rules={[{ required: true, whitespace: true }]}>
            <Input />
          </Form.Item>
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
                  return Promise.reject(new Error('Ingresa un RUT valido.'))
                },
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="FechaNacimiento" label="Fecha nacimiento">
            <Input placeholder="2020-01-01" />
          </Form.Item>
          <Form.Item name="Telefono" label="Telefono">
            <Input />
          </Form.Item>
          <Form.Item name="Correo" label="Correo">
            <Input />
          </Form.Item>
          <Form.Item name="TipoClienteId" label="Tipo cliente" rules={[{ required: true }]}>
            <Select options={tipos.map((tipo) => ({ value: tipo.TipoClienteId, label: tipo.Nombre }))} />
          </Form.Item>
          <Form.Item name="Estado" label="Estado" initialValue="activo" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'activo', label: 'Activo' },
                { value: 'inactivo', label: 'Inactivo' },
                { value: 'bloqueado', label: 'Bloqueado' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
