import dayjs from 'dayjs'
import { Button, Card, DatePicker, Form, Input, Modal, Select, Table, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { administracionService } from '../../services/administracion/administracionService'
import type { LookupDto, ProductoDto, TarifaDto, TipoClienteDto } from '../../types/models'

export default function TarifasPage() {
  const [items, setItems] = useState<TarifaDto[]>([])
  const [productos, setProductos] = useState<ProductoDto[]>([])
  const [tiposCliente, setTiposCliente] = useState<TipoClienteDto[]>([])
  const [bloques, setBloques] = useState<LookupDto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
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
          <Button type="primary" onClick={() => setOpen(true)}>Nueva tarifa</Button>
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
          ]}
        />

        <Modal open={open} title="Nueva tarifa" onCancel={() => setOpen(false)} onOk={() => form.submit()} destroyOnHidden>
          <Form
            form={form}
            layout="vertical"
            initialValues={{ Activo: true }}
            onFinish={async (values) => {
              await administracionService.createTarifa({
                ...values,
                VigenciaDesde: values.VigenciaDesde.format('YYYY-MM-DD'),
                VigenciaHasta: values.VigenciaHasta.format('YYYY-MM-DD'),
              })
              setOpen(false)
              form.resetFields()
              await load()
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
