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
  if (estado === 'activo') return <Tag color="success" bordered={false}>ACTIVO</Tag>
  if (estado === 'inactivo') return <Tag color="default" bordered={false}>INACTIVO</Tag>
  return <Tag color="error" bordered={false}>BLOQUEADO</Tag>
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
    { 
      title: 'Cliente', 
      key: 'NombreCompleto', 
      render: (_, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff', verticalAlign: 'middle' }}>{record.NombreCompleto.charAt(0).toUpperCase()}</Avatar>
          <Typography.Text strong>{toCapitalCase(record.NombreCompleto)}</Typography.Text>
        </Space>
      ) 
    },
    { 
      title: 'RUT', 
      dataIndex: 'Rut', 
      key: 'Rut', 
      responsive: ['sm'],
      render: (rut) => <Typography.Text type="secondary" style={{ fontFamily: 'monospace' }}>{rut}</Typography.Text>
    },
    { 
       title: 'Contacto', 
       key: 'Contacto', 
       responsive: ['md'],
       render: (_, record) => (
         <div style={{ display: 'grid', gap: 4 }}>
           {record.Correo ? <div style={{ fontSize: 13, display: 'flex', alignItems: 'center' }}><MailOutlined style={{ marginRight: 6, color: '#8c8c8c' }}/> <Typography.Text ellipsis style={{ maxWidth: 150 }}>{record.Correo}</Typography.Text></div> : null}
           {record.Telefono ? <div style={{ fontSize: 13 }}><PhoneOutlined style={{ marginRight: 6, color: '#8c8c8c' }}/>{record.Telefono}</div> : null}
           {!record.Correo && !record.Telefono ? <Typography.Text type="secondary" style={{ fontSize: 13 }}>No registrado</Typography.Text> : null}
         </div>
       )
    },
    { 
      title: 'Tipo cliente', 
      dataIndex: 'TipoCliente', 
      key: 'TipoCliente', 
      responsive: ['sm'],
      render: (tipo) => <Tag color="blue" bordered={false}>{tipo || 'Sin tipo'}</Tag>
    },
    {
      title: 'Estado',
      key: 'Estado',
      responsive: ['sm'],
      render: (_, record) => estadoTag(record.Estado),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'right',
      render: (_, record) => (
        <Tooltip title="Editar perfil del cliente">
          <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={() => openEdit(record)}>Editar</Button>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0, width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600, fontSize: 16 }}>
                        <Avatar style={{ backgroundColor: '#1890ff', flexShrink: 0 }}>{record.NombreCompleto.charAt(0).toUpperCase()}</Avatar>
                        <div>
                           <div style={{ lineHeight: 1.2 }}>{toCapitalCase(record.NombreCompleto)}</div>
                           <div style={{ color: '#8c8c8c', fontSize: 12, fontWeight: 'normal', fontFamily: 'monospace', marginTop: 2 }}>{record.Rut}</div>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: 16, display: 'grid', gap: 8, fontSize: 13, background: '#fafafa', padding: 12, borderRadius: 8 }}>
                        <span style={{ display: 'flex', alignItems: 'center' }}><MailOutlined style={{ marginRight: 8, color: '#8c8c8c' }} /><Typography.Text ellipsis>{record.Correo || 'Sin correo'}</Typography.Text></span>
                        <span style={{ display: 'flex', alignItems: 'center' }}><PhoneOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />{record.Telefono || 'Sin telefono'}</span>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <Tag color="blue" bordered={false}>{record.TipoCliente || 'Sin tipo'}</Tag>
                          {estadoTag(record.Estado)}
                        </div>
                      </div>
                    </div>

                    <Tooltip title="Editar">
                      <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} style={{ marginLeft: 8 }} />
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
