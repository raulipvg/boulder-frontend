import { ReloadOutlined } from '@ant-design/icons'
import { Alert, App as AntdApp, AutoComplete, Button, Card, Col, Divider, Form, Input, InputNumber, Modal, Row, Select, Space, Typography } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { administracionService } from '../../services/administracion/administracionService'
import { operacionService } from '../../services/operacion/operacionService'
import { ventasService } from '../../services/ventas/ventasService'
import type { ClienteLookupDto, LookupDto, PosCatalogItemDto, TipoClienteDto } from '../../types/models'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import { toCapitalCase } from '../../utils/formatPersonName'
import { isValidRut, normalizeRut } from '../../utils/rut'

const REQUIRED_CLIENT_CODES = new Set([
  'CLASES_CON_PROFESOR',
  'MENSUALIDAD_POR_HORARIO',
  'MENSUALIDAD_TODO_HORARIO',
  'PACK_TICKETS',
  'PACK_10_TICKETS',
  'TICKET_INDIVIDUAL',
])

interface CartItem {
  Id: string
  Product: PosCatalogItemDto
  Quantity: number
  ClienteEmpresaIdAsignado?: number | null
}

interface VentaPreviewDto {
  Subtotal: number
  Total: number
  Detalles: Array<{
    ProductoEmpresaId: number
    ProductoNombre: string
    Cantidad: number
    PrecioUnitario: number
    Subtotal: number
  }>
}

function requiresAssignedClient(product: PosCatalogItemDto): boolean {
  return REQUIRED_CLIENT_CODES.has(product.TipoProductoBaseCodigo)
}

function formatClientLabel(cliente: ClienteLookupDto): string {
  return `${toCapitalCase(cliente.NombreCompleto)} (${cliente.Rut})`
}

export default function PuntoVentaPage() {
  const { message } = AntdApp.useApp()
  const [catalog, setCatalog] = useState<PosCatalogItemDto[]>([])
  const [mediosPago, setMediosPago] = useState<LookupDto[]>([])
  const [tiposCliente, setTiposCliente] = useState<TipoClienteDto[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [knownClientes, setKnownClientes] = useState<Record<number, ClienteLookupDto>>({})
  const [clientSearchByItem, setClientSearchByItem] = useState<Record<string, string>>({})
  const [clientOptionsByItem, setClientOptionsByItem] = useState<Record<string, ClienteLookupDto[]>>({})
  const [searchingByItem, setSearchingByItem] = useState<Record<string, boolean>>({})
  const [preview, setPreview] = useState<VentaPreviewDto | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [medioPagoId, setMedioPagoId] = useState<number | null>(null)
  const [createClientOpen, setCreateClientOpen] = useState(false)
  const [createClientTargetItemId, setCreateClientTargetItemId] = useState<string | null>(null)
  const [creatingClient, setCreatingClient] = useState(false)
  const [createClientForm] = Form.useForm()
  const lineIdRef = useRef(1)
  const searchTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout> | undefined>>({})

  const nextLineId = () => {
    const id = `line-${lineIdRef.current}`
    lineIdRef.current += 1
    return id
  }

  const mergeKnownClientes = (clientes: ClienteLookupDto[]) => {
    setKnownClientes((current) => {
      const next = { ...current }
      for (const cliente of clientes) {
        next[cliente.ClienteEmpresaId] = cliente
      }
      return next
    })
  }

  const buildHeaderClienteId = (items: CartItem[]): number | null => {
    const ids = Array.from(new Set(items.map((item) => item.ClienteEmpresaIdAsignado).filter((id): id is number => !!id)))
    return ids.length === 1 ? ids[0] : null
  }

  const cleanupItemSearchState = (itemId: string) => {
    const timeout = searchTimeoutsRef.current[itemId]
    if (timeout) {
      clearTimeout(timeout)
      delete searchTimeoutsRef.current[itemId]
    }

    setClientSearchByItem((current) => {
      const next = { ...current }
      delete next[itemId]
      return next
    })
    setClientOptionsByItem((current) => {
      const next = { ...current }
      delete next[itemId]
      return next
    })
    setSearchingByItem((current) => {
      const next = { ...current }
      delete next[itemId]
      return next
    })
  }

  const loadCatalogData = async () => {
    setLoading(true)
    try {
      const [catalogData, medios, tipos] = await Promise.all([
        ventasService.getPosCatalog(),
        administracionService.getMediosPago(),
        administracionService.getTiposCliente(),
      ])
      setCatalog(catalogData)
      setMediosPago(medios)
      setTiposCliente(tipos)
      setMedioPagoId((current) => current ?? medios[0]?.Id ?? null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCatalogData()

    return () => {
      for (const timeout of Object.values(searchTimeoutsRef.current)) {
        if (timeout) {
          clearTimeout(timeout)
        }
      }
      searchTimeoutsRef.current = {}
    }
  }, [])

  const onClientSearch = (itemId: string, value: string) => {
    setClientSearchByItem((current) => ({ ...current, [itemId]: value }))

    const existingTimeout = searchTimeoutsRef.current[itemId]
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      delete searchTimeoutsRef.current[itemId]
    }

    const term = value.trim()
    if (term.length < 2) {
      setClientOptionsByItem((current) => ({ ...current, [itemId]: [] }))
      setSearchingByItem((current) => ({ ...current, [itemId]: false }))
      return
    }

    setSearchingByItem((current) => ({ ...current, [itemId]: true }))
    searchTimeoutsRef.current[itemId] = setTimeout(async () => {
      try {
        const results = await operacionService.buscarClientes(term)
        mergeKnownClientes(results)
        setClientOptionsByItem((current) => ({ ...current, [itemId]: results }))
      } finally {
        setSearchingByItem((current) => ({ ...current, [itemId]: false }))
      }
    }, 250)
  }

  const setAssignedClient = (itemId: string, cliente: ClienteLookupDto) => {
    mergeKnownClientes([cliente])
    setCart((current) => current.map((item) => item.Id === itemId ? { ...item, ClienteEmpresaIdAsignado: cliente.ClienteEmpresaId } : item))
    setClientSearchByItem((current) => ({ ...current, [itemId]: formatClientLabel(cliente) }))
    setClientOptionsByItem((current) => ({ ...current, [itemId]: [] }))
  }

  const clearAssignedClient = (itemId: string) => {
    setCart((current) => current.map((item) => item.Id === itemId ? { ...item, ClienteEmpresaIdAsignado: null } : item))
    setClientSearchByItem((current) => ({ ...current, [itemId]: '' }))
    setClientOptionsByItem((current) => ({ ...current, [itemId]: [] }))
  }

  const addProduct = (product: PosCatalogItemDto) => {
    if (requiresAssignedClient(product)) {
      setCart((current) => [
        ...current,
        {
          Id: nextLineId(),
          Product: product,
          Quantity: 1,
          ClienteEmpresaIdAsignado: null,
        },
      ])
      return
    }

    setCart((current) => {
      const existing = current.find((item) => item.Product.ProductoEmpresaId === product.ProductoEmpresaId && !requiresAssignedClient(item.Product))
      if (existing) {
        return current.map((item) => item.Id === existing.Id ? { ...item, Quantity: item.Quantity + 1 } : item)
      }

      return [
        ...current,
        {
          Id: nextLineId(),
          Product: product,
          Quantity: 1,
          ClienteEmpresaIdAsignado: null,
        },
      ]
    })
  }

  const removeItem = (itemId: string) => {
    setCart((current) => current.filter((item) => item.Id !== itemId))
    cleanupItemSearchState(itemId)

    if (createClientTargetItemId === itemId) {
      setCreateClientTargetItemId(null)
      setCreateClientOpen(false)
      createClientForm.resetFields()
    }
  }

  const openCreateClient = (itemId: string) => {
    const generalTipoClienteId = tiposCliente.find((item) => item.Codigo === 'GENERAL')?.TipoClienteId
      ?? tiposCliente[0]?.TipoClienteId

    setCreateClientTargetItemId(itemId)
    createClientForm.setFieldsValue({
      NombreCompleto: clientSearchByItem[itemId]?.trim() || undefined,
      TipoClienteId: generalTipoClienteId,
      Estado: 'activo',
    })
    setCreateClientOpen(true)
  }

  const missingAssignedItem = useMemo(
    () => cart.find((item) => requiresAssignedClient(item.Product) && !item.ClienteEmpresaIdAsignado),
    [cart],
  )

  useEffect(() => {
    const loadPreview = async () => {
      if (!cart.length) {
        setPreview(null)
        setPreviewError(null)
        return
      }

      if (missingAssignedItem) {
        setPreview(null)
        setPreviewError(`Debes asignar cliente al producto ${missingAssignedItem.Product.NombreComercial}.`)
        return
      }

      try {
        const result = await ventasService.previewVenta({
          ClienteEmpresaId: buildHeaderClienteId(cart),
          Items: cart.map((item) => ({
            ProductoEmpresaId: item.Product.ProductoEmpresaId,
            Cantidad: item.Quantity,
            ClienteEmpresaIdAsignado: item.ClienteEmpresaIdAsignado ?? null,
            FechaInicioVigencia: null,
            Observacion: null,
          })),
        })
        setPreview(result)
        setPreviewError(null)
      } catch (error) {
        setPreview(null)
        setPreviewError(getApiErrorMessage(error, 'No fue posible cotizar la venta.'))
      }
    }

    void loadPreview()
  }, [cart, missingAssignedItem])

  return (
    <div className="tms-page">
      <RequireCompanyAlert />
      <PageHeaderCard
        title="Punto de venta"
        subtitle="Selecciona productos, asigna clientes cuando corresponda y confirma la venta."
        actions={<Button icon={<ReloadOutlined />} onClick={() => void loadCatalogData()} />}
      />

      <Row gutter={16}>
        <Col xs={24} xl={15}>
          <Card loading={loading} title="Productos disponibles" className="tms-page-table-card">
            <Row gutter={[12, 12]}>
              {catalog.map((product) => (
                <Col xs={24} md={12} lg={8} key={product.ProductoEmpresaId}>
                  <Card hoverable size="small" onClick={() => addProduct(product)}>
                    <Typography.Title level={5}>{product.NombreComercial}</Typography.Title>
                    <Typography.Text type="secondary">{product.TipoProductoBaseCodigo}</Typography.Text>
                    <div>
                      <Typography.Text strong>
                        {product.ModoPrecio === 'fijo' ? `$ ${product.PrecioFijo ?? 0}` : 'Precio por tarifa'}
                      </Typography.Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <Card title="Caja" className="tms-page-table-card">
            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
              {cart.length === 0 ? (
                <Typography.Text type="secondary">Sin productos en el carro</Typography.Text>
              ) : (
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 8 }}>
                  {cart.map((item) => {
                    const requiresClient = requiresAssignedClient(item.Product)
                    const assignedClient = item.ClienteEmpresaIdAsignado ? knownClientes[item.ClienteEmpresaIdAsignado] : null
                    const searchValue = clientSearchByItem[item.Id] ?? ''
                    const options = clientOptionsByItem[item.Id] ?? []
                    const searching = searchingByItem[item.Id] ?? false
                    const canSuggestCreate = !assignedClient && searchValue.trim().length >= 2 && !searching && options.length === 0

                    return (
                      <div key={item.Id} style={{ padding: '12px 12px', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <Typography.Text strong>{item.Product.NombreComercial}</Typography.Text>
                            <br />
                            <Typography.Text type="secondary">
                              {item.Product.ModoPrecio === 'fijo' ? `$ ${item.Product.PrecioFijo ?? 0}` : 'Tarifa dinámica'}
                            </Typography.Text>

                            {requiresClient && (
                              <div style={{ marginTop: 10 }}>
                                <AutoComplete
                                  value={assignedClient ? formatClientLabel(assignedClient) : searchValue}
                                  onSearch={(value) => onClientSearch(item.Id, value)}
                                  onSelect={(value) => {
                                    const cliente = options.find((entry) => `${entry.ClienteEmpresaId}` === value)
                                    if (cliente) {
                                      setAssignedClient(item.Id, cliente)
                                    }
                                  }}
                                  options={options.map((cliente) => ({
                                    value: `${cliente.ClienteEmpresaId}`,
                                    label: formatClientLabel(cliente),
                                  }))}
                                >
                                  <Input placeholder="Asignar cliente por nombre o RUT (mín. 2 caracteres)" />
                                </AutoComplete>

                                {assignedClient ? (
                                  <Space style={{ marginTop: 6 }} size={8}>
                                    <Typography.Text type="secondary">{assignedClient.TipoCliente} · {assignedClient.Estado}</Typography.Text>
                                    <Button size="small" onClick={() => clearAssignedClient(item.Id)}>Quitar cliente</Button>
                                  </Space>
                                ) : (
                                  <Typography.Text type="danger" style={{ display: 'block', marginTop: 6 }}>
                                    Este producto requiere cliente asignado.
                                  </Typography.Text>
                                )}

                                {canSuggestCreate && (
                                  <Space style={{ marginTop: 8 }}>
                                    <Typography.Text type="secondary">No encontramos coincidencias.</Typography.Text>
                                    <Button size="small" type="primary" onClick={() => openCreateClient(item.Id)}>
                                      Crear cliente
                                    </Button>
                                  </Space>
                                )}
                              </div>
                            )}
                          </div>

                            <Space orientation="vertical" align="end">
                            {requiresClient ? (
                              <Typography.Text type="secondary">Cantidad fija: 1</Typography.Text>
                            ) : (
                              <InputNumber
                                min={1}
                                value={item.Quantity}
                                onChange={(value) => {
                                  const nextValue = Number(value) || 1
                                  setCart((current) => current.map((row) => row.Id === item.Id ? { ...row, Quantity: nextValue } : row))
                                }}
                              />
                            )}

                            {requiresClient && (
                              <Button size="small" onClick={() => addProduct(item.Product)}>
                                Agregar otro
                              </Button>
                            )}

                            <Button danger size="small" onClick={() => removeItem(item.Id)}>Quitar</Button>
                          </Space>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {previewError && <Alert showIcon type="error" title={previewError} />}

              {preview && (
                <Card size="small" title="Previsualización de venta">
                  {preview.Detalles.map((detail, index) => (
                    <div key={`${detail.ProductoEmpresaId}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>{detail.ProductoNombre} x {detail.Cantidad}</span>
                      <strong>$ {detail.Subtotal}</strong>
                    </div>
                  ))}
                  <Divider style={{ margin: '12px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography.Text strong>Total</Typography.Text>
                    <Typography.Text strong>$ {preview.Total}</Typography.Text>
                  </div>
                </Card>
              )}

              <Select
                placeholder="Medio de pago"
                value={medioPagoId ?? undefined}
                onChange={setMedioPagoId}
                options={mediosPago.map((item) => ({ value: item.Id, label: item.Nombre }))}
              />

              <Button
                type="primary"
                size="large"
                block
                loading={saving}
                disabled={!preview || !medioPagoId || !!missingAssignedItem}
                onClick={async () => {
                  if (!preview || !medioPagoId) {
                    return
                  }

                  setSaving(true)
                  try {
                    const result = await ventasService.createVenta({
                      ClienteEmpresaId: buildHeaderClienteId(cart),
                      Items: cart.map((item) => ({
                        ProductoEmpresaId: item.Product.ProductoEmpresaId,
                        Cantidad: item.Quantity,
                        ClienteEmpresaIdAsignado: item.ClienteEmpresaIdAsignado ?? null,
                        FechaInicioVigencia: null,
                        Observacion: null,
                      })),
                      Pagos: [{ MedioPagoId: medioPagoId, Monto: preview.Total, Referencia: null }],
                    })

                    message.success(`Venta ${result.NumeroComprobante} creada correctamente.`)
                    setCart([])
                    setPreview(null)
                    setPreviewError(null)
                    setClientSearchByItem({})
                    setClientOptionsByItem({})
                    setSearchingByItem({})
                  } catch (error) {
                    message.error(getApiErrorMessage(error, 'No fue posible crear la venta.'))
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                Confirmar venta
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal
        open={createClientOpen}
        title="Crear cliente"
        onCancel={() => {
          setCreateClientOpen(false)
          setCreateClientTargetItemId(null)
          createClientForm.resetFields()
        }}
        onOk={() => createClientForm.submit()}
        confirmLoading={creatingClient}
        destroyOnHidden
      >
        <Form
          form={createClientForm}
          layout="vertical"
          onFinish={async (values) => {
            if (!createClientTargetItemId) {
              return
            }

            setCreatingClient(true)
            try {
              const created = await administracionService.createCliente({
                NombreCompleto: values.NombreCompleto?.trim(),
                Rut: normalizeRut(values.Rut),
                FechaNacimiento: null,
                Telefono: values.Telefono ?? null,
                Correo: values.Correo ?? null,
                TipoClienteId: values.TipoClienteId,
                Estado: 'activo',
              })

              const createdLookup: ClienteLookupDto = {
                ClienteEmpresaId: created.ClienteEmpresaId,
                NombreCompleto: created.NombreCompleto,
                Rut: created.Rut,
                Estado: created.Estado,
                TipoCliente: created.TipoCliente,
              }

              setAssignedClient(createClientTargetItemId, createdLookup)
              setCreateClientOpen(false)
              setCreateClientTargetItemId(null)
              createClientForm.resetFields()
              message.success('Cliente creado y asignado correctamente.')
            } catch (error) {
              message.error(getApiErrorMessage(error, 'No fue posible crear el cliente.'))
            } finally {
              setCreatingClient(false)
            }
          }}
        >
          <Form.Item name="NombreCompleto" label="Nombre completo" rules={[{ required: true, whitespace: true, message: 'Ingresa el nombre del cliente.' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="Rut"
            label="RUT"
            rules={[
              { required: true, message: 'Ingresa el RUT del cliente.' },
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
          <Form.Item name="TipoClienteId" label="Tipo de cliente" rules={[{ required: true, message: 'Selecciona el tipo de cliente.' }]}>
            <Select options={tiposCliente.map((item) => ({ value: item.TipoClienteId, label: item.Nombre }))} />
          </Form.Item>
          <Form.Item name="Telefono" label="Teléfono">
            <Input />
          </Form.Item>
          <Form.Item name="Correo" label="Correo">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
