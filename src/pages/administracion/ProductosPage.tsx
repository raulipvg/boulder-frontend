import { Button, Card, Form, Input, Modal, Select, Switch, Table, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { administracionService } from '../../services/administracion/administracionService'
import type { ClaseDto, LookupDto, ProductoDto } from '../../types/models'

export default function ProductosPage() {
  const [items, setItems] = useState<ProductoDto[]>([])
  const [tipos, setTipos] = useState<LookupDto[]>([])
  const [bloques, setBloques] = useState<LookupDto[]>([])
  const [clases, setClases] = useState<ClaseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      const [productos, tiposBase, bloquesData, clasesData] = await Promise.all([
        administracionService.getProductos(),
        administracionService.getTiposProductoBase(),
        administracionService.getBloques(),
        administracionService.getClases(),
      ])
      setItems(productos)
      setTipos(tiposBase)
      setBloques(bloquesData)
      setClases(clasesData)
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
            <Typography.Title level={3} style={{ margin: 0 }}>Productos</Typography.Title>
            <Typography.Text type="secondary">Configuración de productos comerciales visibles en caja.</Typography.Text>
          </div>
          <Button type="primary" onClick={() => setOpen(true)}>Nuevo producto</Button>
        </div>

        <Table
          rowKey="ProductoEmpresaId"
          loading={loading}
          dataSource={items}
          columns={[
            { title: 'Producto', dataIndex: 'NombreComercial' },
            { title: 'Tipo base', dataIndex: 'TipoProductoBaseCodigo' },
            { title: 'Modo precio', dataIndex: 'ModoPrecio' },
            { title: 'Precio fijo', dataIndex: 'PrecioFijo' },
            { title: 'POS', render: (_, r) => (r.VisiblePos ? 'Sí' : 'No') },
            { title: 'Activo', render: (_, r) => (r.Activo ? 'Sí' : 'No') },
          ]}
        />

        <Modal open={open} title="Nuevo producto" onCancel={() => setOpen(false)} onOk={() => form.submit()} destroyOnHidden width={720}>
          <Form
            form={form}
            layout="vertical"
            initialValues={{ ModoPrecio: 'fijo', VisiblePos: true, Activo: true, RequiereCliente: false, GeneraBeneficio: false, AccesoIlimitado: false }}
            onFinish={async (values) => {
              await administracionService.createProducto(values)
              setOpen(false)
              form.resetFields()
              await load()
            }}
          >
            <div className="grid-two">
              <Form.Item name="TipoProductoBaseId" label="Tipo base" rules={[{ required: true }]}>
                <Select options={tipos.map((tipo) => ({ value: tipo.Id, label: tipo.Nombre }))} />
              </Form.Item>
              <Form.Item name="NombreComercial" label="Nombre comercial" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="Descripcion" label="Descripción"><Input /></Form.Item>
              <Form.Item name="ModoPrecio" label="Modo precio" rules={[{ required: true }]}>
                <Select options={[{ value: 'fijo', label: 'Fijo' }, { value: 'tarifa', label: 'Tarifa' }]} />
              </Form.Item>
              <Form.Item name="PrecioFijo" label="Precio fijo"><Input type="number" /></Form.Item>
              <Form.Item name="VigenciaDias" label="Vigencia días"><Input type="number" /></Form.Item>
              <Form.Item name="UsosIncluidos" label="Usos incluidos"><Input type="number" /></Form.Item>
              <Form.Item name="BloqueHorarioComercialId" label="Bloque horario"><Select allowClear options={bloques.map((b) => ({ value: b.Id, label: b.Nombre }))} /></Form.Item>
              <Form.Item name="ClaseId" label="Clase"><Select allowClear options={clases.map((c) => ({ value: c.ClaseId, label: c.Nombre }))} /></Form.Item>
            </div>
            <div className="grid-two">
              <Form.Item name="VisiblePos" label="Visible POS" valuePropName="checked"><Switch /></Form.Item>
              <Form.Item name="Activo" label="Activo" valuePropName="checked"><Switch /></Form.Item>
              <Form.Item name="RequiereCliente" label="Requiere cliente" valuePropName="checked"><Switch /></Form.Item>
              <Form.Item name="GeneraBeneficio" label="Genera beneficio" valuePropName="checked"><Switch /></Form.Item>
              <Form.Item name="AccesoIlimitado" label="Acceso ilimitado" valuePropName="checked"><Switch /></Form.Item>
            </div>
          </Form>
        </Modal>
      </Card>
    </>
  )
}
