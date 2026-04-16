import { App as AntdApp, Button, Form, Input, Modal, Select, Switch, Table, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { RequireCompanyAlert } from '../../../components/shared/RequireCompanyAlert'
import { administracionService } from '../../../services/administracion/administracionService'
import type { ClaseDto, LookupDto, ProductoDto } from '../../../types/models'
import { getApiErrorMessage } from '../../../utils/getApiErrorMessage'

export default function ProductosTab() {
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
  const selectedTipoCodigo = useMemo(
    () => tipos.find((t) => t.Id === selectedTipoProductoBaseId)?.Codigo,
    [selectedTipoProductoBaseId, tipos],
  )

  // Tipo flags
  const isMensualidadPorHorario = selectedTipoCodigo === 'MENSUALIDAD_POR_HORARIO'
  const isMensualidadTodoHorario = selectedTipoCodigo === 'MENSUALIDAD_TODO_HORARIO'
  const isMensualidad = isMensualidadPorHorario || isMensualidadTodoHorario
  const isPackTickets = selectedTipoCodigo === 'PACK_TICKETS' || selectedTipoCodigo === 'PACK_10_TICKETS'
  const isClases = selectedTipoCodigo === 'CLASES_CON_PROFESOR'
  const isProductoCaja = selectedTipoCodigo === 'PRODUCTO_CAJA'
  const isTicketIndividual = selectedTipoCodigo === 'TICKET_INDIVIDUAL'

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

  // Auto-fill por tipo
  useEffect(() => {
    if (!isMensualidad) return
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

  useEffect(() => {
    if (!isPackTickets) return
    form.setFieldsValue({
      ModoPrecio: 'tarifa',
      PrecioFijo: undefined,
      ClaseId: undefined,
      RequiereCliente: true,
      GeneraBeneficio: true,
      AccesoIlimitado: false,
      UsosIncluidos: form.getFieldValue('UsosIncluidos') ?? 10,
      VigenciaDias: form.getFieldValue('VigenciaDias') ?? 60,
    })
  }, [form, isPackTickets])

  useEffect(() => {
    if (!isClases) return
    form.setFieldsValue({
      ModoPrecio: 'tarifa',
      PrecioFijo: undefined,
      BloqueHorarioComercialId: undefined,
      RequiereCliente: true,
      GeneraBeneficio: true,
      AccesoIlimitado: false,
      VigenciaDias: 30,
    })
  }, [form, isClases])

  useEffect(() => {
    if (!isProductoCaja) return
    form.setFieldsValue({
      ModoPrecio: 'fijo',
      VigenciaDias: undefined,
      UsosIncluidos: undefined,
      BloqueHorarioComercialId: undefined,
      ClaseId: undefined,
      RequiereCliente: false,
      GeneraBeneficio: false,
      AccesoIlimitado: false,
    })
  }, [form, isProductoCaja])

  useEffect(() => {
    if (!isTicketIndividual) return
    form.setFieldsValue({
      ModoPrecio: 'tarifa',
      PrecioFijo: undefined,
      VigenciaDias: undefined,
      UsosIncluidos: 1,
      ClaseId: undefined,
      RequiereCliente: true,
      GeneraBeneficio: false,
      AccesoIlimitado: false,
    })
  }, [form, isTicketIndividual])

  // Visibilidad de campos
  const showModoPrecio = !isMensualidad && !isPackTickets && !isClases && !isProductoCaja && !isTicketIndividual
  const showPrecioFijo = isProductoCaja || showModoPrecio
  const showVigenciaDias = !isMensualidad && !isProductoCaja && !isTicketIndividual
  const showUsosIncluidos = !isMensualidad && !isProductoCaja && !isTicketIndividual
  const showBloqueHorario = isMensualidadPorHorario || isPackTickets || isTicketIndividual || (!isMensualidad && !isClases && !isProductoCaja)
  const showClase = !isMensualidad && !isPackTickets && !isProductoCaja && !isTicketIndividual
  const showSwitchesCliente = !isMensualidad && !isPackTickets && !isClases && !isProductoCaja && !isTicketIndividual

  const bloqueRequerido = isMensualidadPorHorario || isTicketIndividual

  // Construcción de payload fijo por tipo
  const buildPayload = (values: Record<string, unknown>, tipoCodigo: string | undefined) => {
    switch (tipoCodigo) {
      case 'MENSUALIDAD_POR_HORARIO':
      case 'MENSUALIDAD_TODO_HORARIO':
        return { ...values, ModoPrecio: 'tarifa', PrecioFijo: null, UsosIncluidos: null, ClaseId: null, RequiereCliente: true, GeneraBeneficio: true, AccesoIlimitado: true, VigenciaDias: 30, BloqueHorarioComercialId: tipoCodigo === 'MENSUALIDAD_POR_HORARIO' ? values.BloqueHorarioComercialId ?? null : null }
      case 'PACK_TICKETS':
      case 'PACK_10_TICKETS':
        return { ...values, ModoPrecio: 'tarifa', PrecioFijo: null, ClaseId: null, RequiereCliente: true, GeneraBeneficio: true, AccesoIlimitado: false }
      case 'CLASES_CON_PROFESOR':
        return { ...values, ModoPrecio: 'tarifa', PrecioFijo: null, BloqueHorarioComercialId: null, RequiereCliente: true, GeneraBeneficio: true, AccesoIlimitado: false, VigenciaDias: 30 }
      case 'PRODUCTO_CAJA':
        return { ...values, ModoPrecio: 'fijo', VigenciaDias: null, UsosIncluidos: null, BloqueHorarioComercialId: null, ClaseId: null, RequiereCliente: false, GeneraBeneficio: false, AccesoIlimitado: false }
      case 'TICKET_INDIVIDUAL':
        return { ...values, ModoPrecio: 'tarifa', PrecioFijo: null, VigenciaDias: null, UsosIncluidos: 1, ClaseId: null, RequiereCliente: true, GeneraBeneficio: false, AccesoIlimitado: false }
      default:
        return values
    }
  }

  const usosLabel = isPackTickets ? 'Cantidad de tickets del pack' : isClases ? 'Cantidad de clases' : 'Usos incluidos'

  return (
    <>
      <RequireCompanyAlert />
      <div className="page-actions" style={{ marginBottom: 16 }}>
        <div>
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
        onCancel={() => { setOpen(false); setEditingItem(null) }}
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
              const tipoCodigo = tipos.find((t) => t.Id === values.TipoProductoBaseId)?.Codigo
              const payload = buildPayload(values, tipoCodigo)

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
            <Form.Item name="TipoProductoBaseId" label="Tipo Producto" rules={[{ required: true }]}>
              <Select options={tipos.map((t) => ({ value: t.Id, label: t.Nombre }))} />
            </Form.Item>

            {selectedTipoCodigo && (
              <Form.Item name="NombreComercial" label="Nombre Producto" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            )}
            {selectedTipoCodigo && <Form.Item name="Descripcion" label="Descripción"><Input /></Form.Item>}

            {selectedTipoCodigo && showModoPrecio && (
              <Form.Item name="ModoPrecio" label="Modo precio" rules={[{ required: true }]}>
                <Select options={[{ value: 'fijo', label: 'Fijo' }, { value: 'tarifa', label: 'Tarifa' }]} />
              </Form.Item>
            )}
            {selectedTipoCodigo && showPrecioFijo && (
              <Form.Item name="PrecioFijo" label="Precio fijo" rules={isProductoCaja ? [{ required: true, message: 'El precio fijo es obligatorio.' }] : undefined}>
                <Input type="number" />
              </Form.Item>
            )}
            {selectedTipoCodigo && showVigenciaDias && (
              <Form.Item name="VigenciaDias" label="Vigencia días">
                <Input type="number" />
              </Form.Item>
            )}
            {selectedTipoCodigo && showUsosIncluidos && (
              <Form.Item name="UsosIncluidos" label={usosLabel}>
                <Input type="number" />
              </Form.Item>
            )}
            {selectedTipoCodigo && showBloqueHorario && (
              <Form.Item
                name="BloqueHorarioComercialId"
                label="Bloque horario"
                rules={bloqueRequerido ? [{ required: true, message: 'Selecciona un bloque horario.' }] : undefined}
              >
                <Select allowClear options={bloques.map((b) => ({ value: b.Id, label: b.Nombre }))} />
              </Form.Item>
            )}
            {selectedTipoCodigo && showClase && (
              <Form.Item
                name="ClaseId"
                label="Clase"
                rules={isClases ? [{ required: true, message: 'Selecciona una clase.' }] : undefined}
              >
                <Select allowClear options={clases.map((c) => ({ value: c.ClaseId, label: c.Nombre }))} />
              </Form.Item>
            )}
          </div>

          <div className="grid-two">
            {selectedTipoCodigo && <Form.Item name="VisiblePos" label="Visible POS" valuePropName="checked"><Switch /></Form.Item>}
            {selectedTipoCodigo && <Form.Item name="Activo" label="Activo" valuePropName="checked"><Switch /></Form.Item>}
            {selectedTipoCodigo && showSwitchesCliente && (
              <>
                <Form.Item name="RequiereCliente" label="Requiere cliente" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item name="GeneraBeneficio" label="Genera beneficio" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item name="AccesoIlimitado" label="Acceso ilimitado" valuePropName="checked"><Switch /></Form.Item>
              </>
            )}
          </div>
        </Form>
      </Modal>
    </>
  )
}
