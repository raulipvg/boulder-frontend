import { App as AntdApp, Button, Card, Form, Input, Modal, Select, Switch, Table, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { administracionService } from '../../services/administracion/administracionService'
import type { ClaseDto, LookupDto, ProductoDto } from '../../types/models'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'

export default function ProductosPage() {
  const { message } = AntdApp.useApp()
  const [items, setItems] = useState<ProductoDto[]>([])
  const [tipos, setTipos] = useState<LookupDto[]>([])
  const [bloques, setBloques] = useState<LookupDto[]>([])
  const [clases, setClases] = useState<ClaseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ProductoDto | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()
  const selectedTipoProductoBaseId = Form.useWatch('TipoProductoBaseId', form)
  const selectedTipoProductoCodigo = useMemo(
    () => tipos.find((tipo) => tipo.Id === selectedTipoProductoBaseId)?.Codigo,
    [selectedTipoProductoBaseId, tipos],
  )
  const isMensualidadPorHorario = selectedTipoProductoCodigo === 'MENSUALIDAD_POR_HORARIO'
  const isMensualidadTodoHorario = selectedTipoProductoCodigo === 'MENSUALIDAD_TODO_HORARIO'
  const isMensualidad = isMensualidadPorHorario || isMensualidadTodoHorario

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

  useEffect(() => {
    if (!isMensualidad) {
      return
    }

    form.setFieldsValue({
      ModoPrecio: 'tarifa',
      PrecioFijo: undefined,
      UsosIncluidos: undefined,
      ClaseId: undefined,
      RequiereCliente: true,
      GeneraBeneficio: true,
      AccesoIlimitado: true,
      VigenciaDias: 30,
      BloqueHorarioComercialId: isMensualidadTodoHorario ? undefined : form.getFieldValue('BloqueHorarioComercialId'),
    })
  }, [form, isMensualidad, isMensualidadTodoHorario])

  return (
    <>
      <RequireCompanyAlert />
      <Card>
        <div className="page-actions">
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>Productos</Typography.Title>
            <Typography.Text type="secondary">Configuración de productos comerciales visibles en caja.</Typography.Text>
          </div>
          <Button
            type="primary"
            onClick={() => {
              setEditingItem(null)
              form.resetFields()
              form.setFieldsValue({ ModoPrecio: 'fijo', VisiblePos: true, Activo: true, RequiereCliente: false, GeneraBeneficio: false, AccesoIlimitado: false })
              setOpen(true)
            }}
          >
            Nuevo producto
          </Button>
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
            {
              title: 'Acciones',
              render: (_, record) => (
                <Button
                  type="link"
                  onClick={() => {
                    setEditingItem(record)
                    form.setFieldsValue({
                      TipoProductoBaseId: tipos.find((t) => t.Codigo === record.TipoProductoBaseCodigo)?.Id,
                      NombreComercial: record.NombreComercial,
                      Descripcion: record.Descripcion ?? undefined,
                      ModoPrecio: record.ModoPrecio,
                      PrecioFijo: record.PrecioFijo ?? undefined,
                      VigenciaDias: record.VigenciaDias ?? undefined,
                      UsosIncluidos: record.UsosIncluidos ?? undefined,
                      BloqueHorarioComercialId: record.BloqueHorarioComercialId ?? undefined,
                      ClaseId: record.ClaseId ?? undefined,
                      VisiblePos: record.VisiblePos,
                      Activo: record.Activo,
                      RequiereCliente: record.RequiereCliente,
                      GeneraBeneficio: record.GeneraBeneficio,
                      AccesoIlimitado: record.AccesoIlimitado,
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
          title={editingItem ? 'Editar producto' : 'Nuevo producto'}
          onCancel={() => {
            setOpen(false)
            setEditingItem(null)
          }}
          onOk={() => form.submit()}
          confirmLoading={submitting}
          destroyOnHidden
          width={720}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{ ModoPrecio: 'fijo', VisiblePos: true, Activo: true, RequiereCliente: false, GeneraBeneficio: false, AccesoIlimitado: false }}
            onFinish={async (values) => {
              setSubmitting(true)
              try {
                const tipoCodigo = tipos.find((tipo) => tipo.Id === values.TipoProductoBaseId)?.Codigo
                const payload = (tipoCodigo === 'MENSUALIDAD_POR_HORARIO' || tipoCodigo === 'MENSUALIDAD_TODO_HORARIO')
                  ? {
                      ...values,
                      ModoPrecio: 'tarifa',
                      PrecioFijo: null,
                      UsosIncluidos: null,
                      ClaseId: null,
                      RequiereCliente: true,
                      GeneraBeneficio: true,
                      AccesoIlimitado: true,
                      VigenciaDias: 30,
                      BloqueHorarioComercialId: tipoCodigo === 'MENSUALIDAD_POR_HORARIO'
                        ? values.BloqueHorarioComercialId ?? null
                        : null,
                    }
                  : values

                if (editingItem) {
                  await administracionService.updateProducto(editingItem.ProductoEmpresaId, payload)
                  message.success('Producto actualizado correctamente.')
                } else {
                  await administracionService.createProducto(payload)
                  message.success('Producto creado correctamente.')
                }

                setOpen(false)
                setEditingItem(null)
                form.resetFields()
                await load()
              } catch (error) {
                message.error(getApiErrorMessage(error, `No se pudo ${editingItem ? 'actualizar' : 'crear'} el producto.`))
              } finally {
                setSubmitting(false)
              }
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
              {!isMensualidad && (
                <Form.Item name="ModoPrecio" label="Modo precio" rules={[{ required: true }]}>
                  <Select options={[{ value: 'fijo', label: 'Fijo' }, { value: 'tarifa', label: 'Tarifa' }]} />
                </Form.Item>
              )}
              {!isMensualidad && <Form.Item name="PrecioFijo" label="Precio fijo"><Input type="number" /></Form.Item>}
              {!isMensualidad && <Form.Item name="VigenciaDias" label="Vigencia días"><Input type="number" /></Form.Item>}
              {!isMensualidad && <Form.Item name="UsosIncluidos" label="Usos incluidos"><Input type="number" /></Form.Item>}
              {(isMensualidadPorHorario || !isMensualidad) && (
                <Form.Item
                  name="BloqueHorarioComercialId"
                  label="Bloque horario"
                  rules={isMensualidadPorHorario ? [{ required: true, message: 'Selecciona un bloque horario.' }] : undefined}
                >
                  <Select allowClear options={bloques.map((b) => ({ value: b.Id, label: b.Nombre }))} />
                </Form.Item>
              )}
              {!isMensualidad && <Form.Item name="ClaseId" label="Clase"><Select allowClear options={clases.map((c) => ({ value: c.ClaseId, label: c.Nombre }))} /></Form.Item>}
            </div>
            <div className="grid-two">
              <Form.Item name="VisiblePos" label="Visible POS" valuePropName="checked"><Switch /></Form.Item>
              <Form.Item name="Activo" label="Activo" valuePropName="checked"><Switch /></Form.Item>
              {!isMensualidad && <Form.Item name="RequiereCliente" label="Requiere cliente" valuePropName="checked"><Switch /></Form.Item>}
              {!isMensualidad && <Form.Item name="GeneraBeneficio" label="Genera beneficio" valuePropName="checked"><Switch /></Form.Item>}
              {!isMensualidad && <Form.Item name="AccesoIlimitado" label="Acceso ilimitado" valuePropName="checked"><Switch /></Form.Item>}
            </div>
          </Form>
        </Modal>
      </Card>
    </>
  )
}
