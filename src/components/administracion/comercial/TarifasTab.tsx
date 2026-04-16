import dayjs from 'dayjs'
import { App as AntdApp, Button, Checkbox, DatePicker, Form, Input, Modal, Radio, Select, Switch, Table, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { RequireCompanyAlert } from '../../../components/shared/RequireCompanyAlert'
import { administracionService } from '../../../services/administracion/administracionService'
import type { LookupDto, ProductoDto, TarifaDto, TipoClienteDto } from '../../../types/models'
import { getApiErrorMessage } from '../../../utils/getApiErrorMessage'

const DAY_OPTIONS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM']
type ClienteFiltro = 'GENERAL' | 'ESTUDIANTE'

export default function TarifasTab() {
  const { message } = AntdApp.useApp()
  const [items, setItems] = useState<TarifaDto[]>([])
  const [productos, setProductos] = useState<ProductoDto[]>([])
  const [tiposCliente, setTiposCliente] = useState<TipoClienteDto[]>([])
  const [bloques, setBloques] = useState<LookupDto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TarifaDto | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [clienteFiltro, setClienteFiltro] = useState<ClienteFiltro>('GENERAL')
  const [form] = Form.useForm()

  const getTipoClienteIdByCodigo = (codigo: ClienteFiltro) => tiposCliente.find((tc) => tc.Codigo === codigo)?.TipoClienteId

  const load = async (filtro: ClienteFiltro) => {
    setLoading(true)
    try {
      const [tarifas, productosData, tiposData, bloquesData] = await Promise.all([
        administracionService.getTarifas(filtro),
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

  useEffect(() => { void load(clienteFiltro) }, [clienteFiltro])

  useEffect(() => {
    if (open && !editingItem) {
      form.setFieldValue('TipoClienteId', getTipoClienteIdByCodigo(clienteFiltro))
    }
  }, [clienteFiltro, editingItem, form, open])

  return (
    <>
      <RequireCompanyAlert />
      <div className="page-actions" style={{ marginBottom: 16 }}>
        <div>
          <Typography.Text type="secondary">Tarifas por producto, día, bloque y tipo de cliente.</Typography.Text>
          <div style={{ marginTop: 8 }}>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={clienteFiltro}
              onChange={(event) => setClienteFiltro(event.target.value as ClienteFiltro)}
              options={[
                { label: 'General', value: 'GENERAL' },
                { label: 'Estudiante', value: 'ESTUDIANTE' },
              ]}
            />
          </div>
        </div>
        <Button
          type="primary"
          onClick={() => {
            setEditingItem(null)
            form.resetFields()
            form.setFieldsValue({
              VigenciaDesde: dayjs(),
              VigenciaHasta: dayjs().add(1, 'month'),
              Activo: true,
              TipoClienteId: getTipoClienteIdByCodigo(clienteFiltro),
            })
            setOpen(true)
          }}
        >
          Nueva tarifa
        </Button>
      </div>

      <Table
        rowKey="TarifaProductoId"
        loading={loading}
        dataSource={items}
        columns={[
          { title: 'Producto', dataIndex: 'ProductoNombre' },
          { title: 'Tipo cliente', dataIndex: 'TipoClienteNombre' },
          { title: 'Tipo día', dataIndex: 'TipoDia' },
          { title: 'Precio', dataIndex: 'Precio' },
          { title: 'Desde', dataIndex: 'VigenciaDesde' },
          { title: 'Hasta', dataIndex: 'VigenciaHasta' },
          {
            title: 'Acciones',
            render: (_, record) => (
              <Button
                type="link"
                onClick={() => {
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
              await load(clienteFiltro)
            } catch (error) {
              message.error(getApiErrorMessage(error, `No se pudo ${editingItem ? 'actualizar' : 'crear'} la tarifa.`))
            } finally {
              setSubmitting(false)
            }
          }}
        >
          <Form.Item name="ProductoEmpresaId" label="Producto" rules={[{ required: true }]}>
            <Select options={productos.map((p) => ({ value: p.ProductoEmpresaId, label: p.NombreComercial }))} />
          </Form.Item>
          <Form.Item name="TipoClienteId" label="Tipo cliente">
            <Select allowClear options={tiposCliente.map((t) => ({ value: t.TipoClienteId, label: t.Nombre }))} />
          </Form.Item>
          <Form.Item name="TipoDias" label="Días aplicables" rules={[{ required: true, type: 'array', min: 1, message: 'Selecciona al menos un día.' }]}>
            <Checkbox.Group options={DAY_OPTIONS.map((value) => ({ value, label: value }))} />
          </Form.Item>
          <Form.Item name="BloqueHorarioComercialId" label="Bloque horario">
            <Select allowClear options={bloques.map((b) => ({ value: b.Id, label: b.Nombre }))} />
          </Form.Item>
          <Form.Item name="Precio" label="Precio" rules={[{ required: true }]}><Input type="number" /></Form.Item>
          <Form.Item name="VigenciaDesde" label="Vigencia desde" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} defaultValue={dayjs()} /></Form.Item>
          <Form.Item name="VigenciaHasta" label="Vigencia hasta" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} defaultValue={dayjs().add(1, 'month')} /></Form.Item>
          <Form.Item name="Activo" label="Activo" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </>
  )
}
