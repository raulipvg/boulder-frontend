import { EditOutlined } from '@ant-design/icons'
import {
  App as AntdApp,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Empty,
  Form,
  Grid,
  Input,
  Modal,
  Select,
  Switch,
  Table,
  Tag,
  Tooltip,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { administracionService } from '../../../services/administracion/administracionService'
import type { LookupDto, ProductoDto, TarifaDto, TipoClienteDto } from '../../../types/models'
import { getApiErrorMessage } from '../../../utils/getApiErrorMessage'

const DAY_OPTIONS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM']

export type ClienteFiltro = 'GENERAL' | 'ESTUDIANTE'

interface TarifasTabProps {
  clienteFiltro: ClienteFiltro
}

export interface TarifasTabHandle {
  openCreate: () => void
  reload: () => Promise<void>
}

const { useBreakpoint } = Grid

const activeTag = (value: boolean) => <Tag color={value ? 'green' : 'red'}>{value ? 'Activa' : 'Inactiva'}</Tag>

const TarifasTab = forwardRef<TarifasTabHandle, TarifasTabProps>(function TarifasTab(
  { clienteFiltro },
  ref,
) {
  const { message } = AntdApp.useApp()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const [items, setItems] = useState<TarifaDto[]>([])
  const [productos, setProductos] = useState<ProductoDto[]>([])
  const [tiposCliente, setTiposCliente] = useState<TipoClienteDto[]>([])
  const [bloques, setBloques] = useState<LookupDto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TarifaDto | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const getTipoClienteIdByCodigo = (codigo: ClienteFiltro) => {
    return tiposCliente.find((tipoCliente) => tipoCliente.Codigo === codigo)?.TipoClienteId
  }

  const load = async () => {
    setLoading(true)
    try {
      const [tarifas, productosData, tiposData, bloquesData] = await Promise.all([
        administracionService.getTarifas(clienteFiltro),
        administracionService.getProductos(),
        administracionService.getTiposCliente(),
        administracionService.getBloques(),
      ])
      setItems(tarifas)
      setProductos(productosData)
      setTiposCliente(tiposData)
      setBloques(bloquesData)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingItem(null)
    setOpen(true)
  }

  useEffect(() => {
    if (open && !editingItem) {
      form.resetFields()
      form.setFieldsValue({
        VigenciaDesde: dayjs(),
        VigenciaHasta: dayjs().add(1, 'month'),
        Activo: true,
        TipoClienteId: getTipoClienteIdByCodigo(clienteFiltro),
      })
    }
  }, [open, editingItem, clienteFiltro, form])

  const openEdit = (record: TarifaDto) => {
    setEditingItem(record)
    form.setFieldsValue({
      ProductoEmpresaId: record.ProductoEmpresaId,
      TipoClienteId: record.TipoClienteId ?? undefined,
      TipoDias: (record.TipoDia ?? '').split(',').filter(Boolean),
      BloqueHorarioComercialId: record.BloqueHorarioComercialId ?? undefined,
      Precio: record.Precio,
      VigenciaDesde: dayjs(record.VigenciaDesde),
      VigenciaHasta: dayjs(record.VigenciaHasta),
      Activo: record.Activo,
    })
    setOpen(true)
  }

  useImperativeHandle(ref, () => ({
    openCreate,
    reload: load,
  }))

  useEffect(() => {
    void load()
  }, [clienteFiltro])

  const columns: ColumnsType<TarifaDto> = [
    { title: 'Producto', dataIndex: 'ProductoNombre', key: 'ProductoNombre' },
    { title: 'Tipo cliente', dataIndex: 'TipoClienteNombre', key: 'TipoClienteNombre', responsive: ['md'] },
    { title: 'Tipo día', dataIndex: 'TipoDia', key: 'TipoDia', responsive: ['lg'] },
    { title: 'Precio', dataIndex: 'Precio', key: 'Precio' },
    { title: 'Desde', dataIndex: 'VigenciaDesde', key: 'VigenciaDesde', responsive: ['md'] },
    { title: 'Hasta', dataIndex: 'VigenciaHasta', key: 'VigenciaHasta', responsive: ['md'] },
    {
      title: 'Estado',
      key: 'Activo',
      responsive: ['sm'],
      render: (_, record) => activeTag(record.Activo),
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
    <>
      <Card className="tms-page-table-card" variant="borderless" style={{ boxShadow: 'none' }} loading={loading}>
        {isMobile ? (
          items.length > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {items.map((record) => (
                <Card size="small" key={record.TarifaProductoId}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{record.ProductoNombre}</div>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>
                        {record.TipoClienteNombre || 'Sin tipo cliente'}
                      </div>
                      <div style={{ marginTop: 6, color: '#374151', fontSize: 12 }}>
                        {record.TipoDia || 'Todos los dias'}
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Tag color="blue">${record.Precio}</Tag>
                        {activeTag(record.Activo)}
                      </div>
                    </div>

                    <Tooltip title="Editar">
                      <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
                    </Tooltip>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Empty description="Sin tarifas registradas" />
          )
        ) : (
          <Table
            rowKey="TarifaProductoId"
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
        title={editingItem ? 'Editar tarifa' : 'Nueva tarifa'}
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
          initialValues={{ Activo: true }}
          onFinish={async (values) => {
            setSubmitting(true)
            try {
              const selectedDays = Array.isArray(values.TipoDias)
                ? DAY_OPTIONS.filter((day) => values.TipoDias.includes(day))
                : []

              const { TipoDias, ...restValues } = values

              const payload = {
                ...restValues,
                TipoDia: selectedDays.join(','),
                VigenciaDesde: values.VigenciaDesde.format('YYYY-MM-DD'),
                VigenciaHasta: values.VigenciaHasta.format('YYYY-MM-DD'),
              }

              if (editingItem) {
                await administracionService.updateTarifa(editingItem.TarifaProductoId, payload)
                message.success('Tarifa actualizada correctamente.')
              } else {
                await administracionService.createTarifa(payload)
                message.success('Tarifa creada correctamente.')
              }

              setOpen(false)
              setEditingItem(null)
              form.resetFields()
              await load()
            } catch (error) {
              message.error(getApiErrorMessage(error, `No se pudo ${editingItem ? 'actualizar' : 'crear'} la tarifa.`))
            } finally {
              setSubmitting(false)
            }
          }}
        >
          <Form.Item name="ProductoEmpresaId" label="Producto" rules={[{ required: true }]}>
            <Select options={productos.map((producto) => ({ value: producto.ProductoEmpresaId, label: producto.NombreComercial }))} />
          </Form.Item>
          <Form.Item name="TipoClienteId" label="Tipo cliente">
            <Select allowClear options={tiposCliente.map((tipo) => ({ value: tipo.TipoClienteId, label: tipo.Nombre }))} />
          </Form.Item>
          <Form.Item
            name="TipoDias"
            label="Dias aplicables"
            rules={[{ required: true, type: 'array', min: 1, message: 'Selecciona al menos un dia.' }]}
          >
            <Checkbox.Group options={DAY_OPTIONS.map((day) => ({ value: day, label: day }))} />
          </Form.Item>
          <Form.Item name="BloqueHorarioComercialId" label="Bloque horario">
            <Select allowClear options={bloques.map((bloque) => ({ value: bloque.Id, label: bloque.Nombre }))} />
          </Form.Item>
          <Form.Item name="Precio" label="Precio" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="VigenciaDesde" label="Vigencia desde" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="VigenciaHasta" label="Vigencia hasta" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="Activo" label="Activo" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
})

export default TarifasTab
