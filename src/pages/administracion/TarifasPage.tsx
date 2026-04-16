import dayjs from 'dayjs'
import { App as AntdApp, Button, Card, DatePicker, Form, Input, Modal, Select, Table, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { administracionService } from '../../services/administracion/administracionService'
import type { LookupDto, ProductoDto, TarifaDto, TipoClienteDto } from '../../types/models'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'

export default function TarifasPage() {
  const { message } = AntdApp.useApp()
  const [items, setItems] = useState<TarifaDto[]>([])
  const [productos, setProductos] = useState<ProductoDto[]>([])
  const [tiposCliente, setTiposCliente] = useState<TipoClienteDto[]>([])
  const [bloques, setBloques] = useState<LookupDto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TarifaDto | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      const [tarifas, productosData, tiposData, bloquesData] = await Promise.all([
        administracionService.getTarifas(),
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

  useEffect(() => { void load() }, [])

  return (
    <>
      <RequireCompanyAlert />
      <Card>
        <div className="page-actions">
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>Tarifas</Typography.Title>
            <Typography.Text type="secondary">Tarifas por producto, día, bloque y tipo de cliente.</Typography.Text>
          </div>
          <Button
            type="primary"
            onClick={() => {
              setEditingItem(null)
              form.resetFields()
              form.setFieldsValue({ VigenciaDesde: dayjs(), VigenciaHasta: dayjs().add(1, 'month'), Activo: true })
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
                      TipoDia: record.TipoDia ?? undefined,
                      BloqueHorarioComercialId: record.BloqueHorarioComercialId ?? undefined,
                      Precio: record.Precio,
                      VigenciaDesde: dayjs(record.VigenciaDesde),
                      VigenciaHasta: dayjs(record.VigenciaHasta),
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
                const payload = {
                  ...values,
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
              <Select options={productos.map((p) => ({ value: p.ProductoEmpresaId, label: p.NombreComercial }))} />
            </Form.Item>
            <Form.Item name="TipoClienteId" label="Tipo cliente">
              <Select allowClear options={tiposCliente.map((t) => ({ value: t.TipoClienteId, label: t.Nombre }))} />
            </Form.Item>
            <Form.Item name="TipoDia" label="Tipo día">
              <Select allowClear options={['LUN','MAR','MIE','JUE','VIE','SAB','DOM_FEST'].map((value) => ({ value, label: value }))} />
            </Form.Item>
            <Form.Item name="BloqueHorarioComercialId" label="Bloque horario">
              <Select allowClear options={bloques.map((b) => ({ value: b.Id, label: b.Nombre }))} />
            </Form.Item>
            <Form.Item name="Precio" label="Precio" rules={[{ required: true }]}><Input type="number" /></Form.Item>
            <Form.Item name="VigenciaDesde" label="Vigencia desde" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} defaultValue={dayjs()} /></Form.Item>
            <Form.Item name="VigenciaHasta" label="Vigencia hasta" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} defaultValue={dayjs().add(1, 'month')} /></Form.Item>
          </Form>
        </Modal>
      </Card>
    </>
  )
}
