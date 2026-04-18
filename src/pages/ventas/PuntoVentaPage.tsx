import {
  AppstoreOutlined,
  CalendarOutlined,
  DeleteOutlined,
  DollarCircleOutlined,
  ExclamationCircleFilled,
  FilterOutlined,
  MinusOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined,
  CloseCircleFilled,
} from '@ant-design/icons'
import { Alert, App as AntdApp, AutoComplete, Button, Card, Col, Divider, Empty, Form, Input, InputNumber, Modal, Row, Segmented, Select, Space, Tag, Typography, Skeleton } from 'antd'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { administracionService } from '../../services/administracion/administracionService'
import { operacionService } from '../../services/operacion/operacionService'
import { ventasService } from '../../services/ventas/ventasService'
import type { ClienteLookupDto, LookupDto, PosCatalogItemDto, TipoClienteDto } from '../../types/models'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import { toCapitalCase } from '../../utils/formatPersonName'
import { isValidRut, normalizeRut } from '../../utils/rut'

const REQUIRED_CLIENT_CODES = new Set([
  'CLASES',
  'MENSUALIDAD_POR_HORARIO',
  'MENSUALIDAD_TODO_HORARIO',
  'PACK_TICKETS',
  'TICKET_INDIVIDUAL',
])

const DUAL_TARIFA_CODES = new Set([
  'CLASES',
  'TICKET_INDIVIDUAL',
  'PACK_TICKETS',
  'MENSUALIDAD_POR_HORARIO',
  'MENSUALIDAD_TODO_HORARIO',
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

interface ProductTypeMeta {
  family: string
  label: string
  icon: ReactNode
  color: string
}

const currencyFormatter = new Intl.NumberFormat('es-CL')

const formatCurrency = (value?: number | null) => `$ ${currencyFormatter.format(Math.max(0, value ?? 0))}`

const normalizeTypeCode = (value: string) => value.trim().toUpperCase().replace(/\s+/g, '_')

const toDayCapitalCase = (value: string) => {
  const normalized = value.trim()
  if (!normalized) {
    return normalized
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
}

function getProductTypeMeta(typeCode: string): ProductTypeMeta {
  const normalized = normalizeTypeCode(typeCode)

  if (normalized.includes('PACK') || normalized.includes('TICKET')) {
    return { family: 'TICKETS', label: 'Tickets', icon: <TagsOutlined />, color: 'geekblue' }
  }

  if (normalized.includes('MENSUALIDAD')) {
    return { family: 'MENSUALIDADES', label: 'Mensualidades', icon: <CalendarOutlined />, color: 'cyan' }
  }

  if (normalized.includes('CLASE')) {
    return { family: 'CLASES', label: 'Clases', icon: <TeamOutlined />, color: 'volcano' }
  }

  if (normalized.includes('ARRIENDO') || normalized.includes('ZAPATILLA')) {
    return { family: 'ARRIENDO', label: 'Arriendo', icon: <AppstoreOutlined />, color: 'orange' }
  }

  if (normalized.includes('CAJA') || normalized.includes('CAFE') || normalized.includes('BEBIDA')) {
    return { family: 'MOSTRADOR', label: 'Mostrador', icon: <AppstoreOutlined />, color: 'green' }
  }

  return {
    family: 'OTROS',
    label: toCapitalCase(normalized.replace(/_/g, ' ').toLowerCase()),
    icon: <AppstoreOutlined />,
    color: 'default',
  }
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
  const [productSearch, setProductSearch] = useState('')
  const [selectedFamily, setSelectedFamily] = useState<string>('ALL')
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

  const updateItemQuantity = (itemId: string, value: number) => {
    const nextValue = Math.max(1, Math.floor(value || 1))
    setCart((current) => current.map((row) => row.Id === itemId ? { ...row, Quantity: nextValue } : row))
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

  const catalogFamilies = useMemo(() => {
    const familyMap = new Map<string, ProductTypeMeta>()
    for (const product of catalog) {
      const meta = getProductTypeMeta(product.TipoProductoBaseCodigo)
      if (!familyMap.has(meta.family)) {
        familyMap.set(meta.family, meta)
      }
    }

    const order = ['TICKETS', 'MENSUALIDADES', 'CLASES', 'ARRIENDO', 'MOSTRADOR', 'OTROS']
    return Array.from(familyMap.values())
      .sort((a, b) => order.indexOf(a.family) - order.indexOf(b.family))
  }, [catalog])

  const familyFilterOptions = useMemo(() => {
    return [
      {
        value: 'ALL',
        label: (
          <Space size={4}>
            <FilterOutlined />
            <span>Todos</span>
          </Space>
        ),
      },
      ...catalogFamilies.map((family) => ({
        value: family.family,
        label: (
          <Space size={4}>
            {family.icon}
            <span>{family.label}</span>
          </Space>
        ),
      })),
    ]
  }, [catalogFamilies])


  const filteredCatalog = useMemo(() => {
    const term = productSearch.trim().toLowerCase()
    return catalog.filter((product) => {
      const meta = getProductTypeMeta(product.TipoProductoBaseCodigo)
      const byFamily = selectedFamily === 'ALL' || meta.family === selectedFamily

      if (!byFamily) {
        return false
      }

      if (!term) {
        return true
      }

      const searchTarget = `${product.NombreComercial} ${meta.label} ${product.TipoProductoBaseCodigo}`.toLowerCase()
      return searchTarget.includes(term)
    })
  }, [catalog, productSearch, selectedFamily])

  useEffect(() => {
    if (selectedFamily === 'ALL') {
      return
    }

    const exists = catalogFamilies.some((family) => family.family === selectedFamily)
    if (!exists) {
      setSelectedFamily('ALL')
    }
  }, [catalogFamilies, selectedFamily])

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
    <div className="tms-page tms-pos-page">
      <RequireCompanyAlert />
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15} xxl={16}>
          <Card
            title={(
              <div className="tms-pos-catalog-head">
                <Space><AppstoreOutlined />Productos disponibles</Space>
                <div className="tms-pos-catalog-head-actions">
                  <Input
                    size="large"
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    allowClear
                    prefix={<SearchOutlined />}
                    placeholder="Buscar por nombre o tipo de producto"
                    className="tms-pos-catalog-search"
                  />
                  <Button size="large" icon={<ReloadOutlined />} onClick={() => void loadCatalogData()}></Button>
                </div>
              </div>
            )}
            className="tms-page-table-card tms-pos-catalog-card"
          >
            {loading ? (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div className="tms-pos-toolbar">
                  <div className="tms-pos-toolbar-controls">
                    <div className="tms-pos-filter-wrap">
                      <Skeleton.Button active block size="large" style={{ height: 44, borderRadius: 12 }} />
                    </div>
                  </div>
                </div>
                <Row gutter={[14, 14]}>
                  {Array.from({ length: 9 }).map((_, index) => (
                    <Col xs={24} md={12} lg={8} key={`skeleton-${index}`}>
                      <Card className="tms-pos-product-card" bordered={false}>
                        <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: '14px', marginBottom: '16px' }}>
                          <Skeleton.Avatar active shape="square" size={48} style={{ borderRadius: 14 }} />
                          <div style={{ display: 'grid', gap: '8px' }}>
                            <Skeleton.Input active size="small" style={{ width: '80%', height: 16 }} />
                            <Skeleton.Input active size="small" style={{ width: '40%', height: 14 }} />
                          </div>
                        </div>
                        <div className="tms-pos-product-footer">
                          <Skeleton.Input active size="small" style={{ width: '60px', height: 16 }} />
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Space>
            ) : (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div className="tms-pos-toolbar">
                  <div className="tms-pos-toolbar-controls">
                    <div className="tms-pos-filter-wrap">
                      <Segmented
                        size="large"
                        block
                        value={selectedFamily}
                        onChange={(value) => setSelectedFamily(String(value))}
                        options={familyFilterOptions}
                        className="tms-pos-filter-segmented"
                      />
                    </div>
                  </div>
                </div>

                {filteredCatalog.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No hay coincidencias con los filtros actuales."
                  >
                    <Button
                      size="large"
                      onClick={() => {
                        setProductSearch('')
                        setSelectedFamily('ALL')
                      }}
                    >
                      Limpiar filtros
                    </Button>
                  </Empty>
                ) : (
                  <Row gutter={[14, 14]}>
                    {filteredCatalog.map((product) => {
                      const typeMeta = getProductTypeMeta(product.TipoProductoBaseCodigo)
                      const isClassProduct = typeMeta.family === 'CLASES'
                      const normalizedProductCode = normalizeTypeCode(product.TipoProductoBaseCodigo)
                      const isDualTarifaProduct = DUAL_TARIFA_CODES.has(normalizedProductCode)
                      const classDaysLabel = isClassProduct && product.DiasClase?.length
                        ? product.DiasClase.map((day) => toDayCapitalCase(day)).join(', ')
                        : null
                      const classPriceRows = [
                        product.TarifaGeneralVigente != null
                          ? { label: 'General', value: product.TarifaGeneralVigente }
                          : null,
                        product.TarifaEstudianteVigente != null
                          ? { label: 'Estudiante', value: product.TarifaEstudianteVigente }
                          : null,
                      ].filter((entry): entry is { label: string, value: number } => Boolean(entry))
                      const hasClassTarifas = classPriceRows.length > 0
                      const priceLabel = product.ModoPrecio === 'fijo'
                        ? formatCurrency(product.PrecioFijo)
                        : 'Consultar en caja'

                      return (
                        <Col xs={24} md={12} lg={8} key={product.ProductoEmpresaId}>
                          <Card hoverable className="tms-pos-product-card" onClick={() => addProduct(product)}>
                            <div className="tms-pos-product-card-head">
                              <div className={`tms-pos-product-icon tms-pos-product-icon--${typeMeta.family.toLowerCase()}`}>
                                {typeMeta.icon}
                              </div>
                              <div className="tms-pos-product-copy">
                                <Typography.Text strong className="tms-pos-product-name">
                                  {product.NombreComercial}
                                </Typography.Text>
                                <div className="tms-pos-product-family-row">
                                  <Typography.Text type="secondary" className="tms-pos-product-family">
                                    {typeMeta.label}
                                  </Typography.Text>
                                  {classDaysLabel && (
                                    <Typography.Text type="secondary" className="tms-pos-product-days">
                                      {classDaysLabel}
                                    </Typography.Text>
                                  )}
                                </div>
                              </div>
                            </div>

                            {isDualTarifaProduct ? (
                              <div className="tms-pos-product-footer tms-pos-product-footer--class">
                                {hasClassTarifas ? (
                                  classPriceRows.map((row) => (
                                    <div key={row.label} className="tms-pos-class-price-block">
                                      <div className="tms-pos-class-price-label-row">
                                        <Typography.Text type="secondary" className="tms-pos-class-price-label">{row.label}</Typography.Text>

                                      </div>
                                      <Typography.Text strong className="tms-pos-product-price">{formatCurrency(row.value)}</Typography.Text>
                                    </div>
                                  ))
                                ) : (
                                  <Typography.Text type="secondary">Sin tarifa activa</Typography.Text>
                                )}
                              </div>
                            ) : (
                              <div className="tms-pos-product-footer">
                                <Typography.Text strong className="tms-pos-product-price">{priceLabel}</Typography.Text>
                              </div>
                            )}
                          </Card>
                        </Col>
                      )
                    })}
                  </Row>
                )}
              </Space>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={9} xxl={8}>
          <Card title={<Space><ShoppingCartOutlined />Caja</Space>} className="tms-page-table-card tms-pos-cart-card tms-pos-cart-sticky">
            <Space orientation="vertical" style={{ width: '100%' }} size="large">
              {cart.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Aun no agregas productos al carro"
                />
              ) : (
                <div className="tms-pos-cart-list">
                  {cart.map((item) => {
                    const requiresClient = requiresAssignedClient(item.Product)
                    const assignedClient = item.ClienteEmpresaIdAsignado ? knownClientes[item.ClienteEmpresaIdAsignado] : null
                    const searchValue = clientSearchByItem[item.Id] ?? ''
                    const options = clientOptionsByItem[item.Id] ?? []
                    const searching = searchingByItem[item.Id] ?? false
                    const canSuggestCreate = !assignedClient && searchValue.trim().length >= 2 && !searching && options.length === 0
                    const lineSubtotal = item.Product.ModoPrecio === 'fijo'
                      ? (item.Product.PrecioFijo ?? 0) * item.Quantity
                      : null

                    return (
                      <div key={item.Id} className="tms-pos-cart-item">
                        <div className="tms-pos-cart-item-head">
                          <div className="tms-pos-cart-item-copy">
                            <Typography.Text strong>{item.Product.NombreComercial}</Typography.Text>
                          </div>

                          <Button
                            danger
                            size="large"
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={() => removeItem(item.Id)}
                          />
                        </div>

                        {requiresClient && (
                          <div className="tms-pos-client-box">
                            <div className="tms-pos-client-box-header">
                              <Typography.Text type="secondary">Cliente</Typography.Text>
                              <div className="tms-pos-client-box-input">
                                <Space.Compact style={{ width: '100%' }}>
                                  <AutoComplete
                                    style={{ flex: 1, minWidth: 0, width: '100%' }}
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
                                    <Input
                                      size="large"
                                      placeholder="Asignar cliente por nombre o RUT (min. 2 caracteres)"
                                      prefix={<UserOutlined />}
                                      readOnly={!!assignedClient}
                                      suffix={
                                        assignedClient ? (
                                          <CloseCircleFilled
                                            style={{ cursor: 'pointer', color: '#bfbfbf', fontSize: '14px' }}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              clearAssignedClient(item.Id)
                                            }}
                                          />
                                        ) : null
                                      }
                                    />
                                  </AutoComplete>
                                  {canSuggestCreate && (
                                    <Button
                                      size="large"
                                      type="primary"
                                      icon={<PlusOutlined />}
                                      onClick={() => openCreateClient(item.Id)}
                                    />
                                  )}
                                </Space.Compact>
                              </div>
                            </div>

                            {assignedClient ? (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                                <Tag color="info" style={{ margin: 0 }}>{assignedClient.TipoCliente} · {assignedClient.Estado}</Tag>
                              </div>
                            ) : (
                              <Alert
                                showIcon
                                type="warning"
                                icon={<ExclamationCircleFilled />}
                                title="Este producto requiere cliente asignado."
                                style={{ marginTop: 5, padding: '5px 10px', border: 'none' }}
                              />
                            )}


                          </div>
                        )}

                        <div className="tms-pos-cart-item-foot">
                          {requiresClient ? (
                            <div />
                          ) : (
                            <div className="tms-pos-quantity-control">
                              <Button
                                size="large"
                                icon={<MinusOutlined />}
                                disabled={item.Quantity <= 1}
                                onClick={() => updateItemQuantity(item.Id, item.Quantity - 1)}
                              />
                              <InputNumber
                                min={1}
                                controls={false}
                                size="large"
                                value={item.Quantity}
                                onChange={(value) => updateItemQuantity(item.Id, Number(value) || 1)}
                              />
                              <Button size="large" icon={<PlusOutlined />} onClick={() => updateItemQuantity(item.Id, item.Quantity + 1)} />
                            </div>
                          )}

                          <div className="tms-pos-cart-line-total">
                            <Typography.Text type="secondary">Subtotal linea</Typography.Text>
                            <Typography.Text strong>{lineSubtotal == null ? 'Se cotiza en tarifa' : formatCurrency(lineSubtotal)}</Typography.Text>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="tms-pos-payment-block">
                <Typography.Text type="secondary">Medio de pago</Typography.Text>
                <Select
                  size="large"
                  placeholder="Selecciona medio de pago"
                  value={medioPagoId ?? undefined}
                  onChange={setMedioPagoId}
                  options={mediosPago.map((item) => ({ value: item.Id, label: item.Nombre }))}
                />
              </div>

              {previewError && <Alert showIcon type="error" title={previewError} />}


              {preview && (
                <Card size="small" variant='borderless' className="tms-pos-preview-card">
                  {preview.Detalles.map((detail, index) => (
                    <div key={`${detail.ProductoEmpresaId}-${index}`} className="tms-pos-preview-row">
                      <Typography.Text>{detail.ProductoNombre} x {detail.Cantidad}</Typography.Text>
                      <Typography.Text strong>{formatCurrency(detail.Subtotal)}</Typography.Text>
                    </div>
                  ))}
                  <Divider style={{ margin: '12px 0' }} />
                  <div className="tms-pos-preview-total">
                    <Typography.Text strong>Total</Typography.Text>
                    <Typography.Text strong>{formatCurrency(preview.Total)}</Typography.Text>
                  </div>
                </Card>
              )}



              <Button
                type="primary"
                size="large"
                block
                icon={<DollarCircleOutlined />}
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
