import { FilterOutlined } from '@ant-design/icons'
import { App as AntdApp, Form, Row, Space } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  PuntoVentaCartSection,
  PuntoVentaCatalogSection,
  PuntoVentaCreateClientModal,
  formatClientLabel,
  getProductTypeMeta,
  requiresAssignedClient,
  type CartItem,
  type CreateClientFormValues,
  type VentaPreviewDto,
} from '../../components/punto-venta'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { administracionService } from '../../services/administracion/administracionService'
import { operacionService } from '../../services/operacion/operacionService'
import { ventasService } from '../../services/ventas/ventasService'
import type { ClienteLookupDto, LookupDto, PosCatalogItemDto, TipoClienteDto } from '../../types/models'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import { isValidRut, normalizeRut } from '../../utils/rut'

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
  const [createClientForm] = Form.useForm<CreateClientFormValues>()
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
    })
    setCreateClientOpen(true)
  }

  const missingAssignedItem = useMemo(
    () => cart.find((item) => requiresAssignedClient(item.Product) && !item.ClienteEmpresaIdAsignado),
    [cart],
  )

  const catalogFamilies = useMemo(() => {
    const familyMap = new Map<string, { family: string, label: string, icon: ReturnType<typeof getProductTypeMeta>['icon'] }>()
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

  const handleConfirmVenta = async () => {
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
      for (const timeout of Object.values(searchTimeoutsRef.current)) {
        if (timeout) {
          clearTimeout(timeout)
        }
      }
      searchTimeoutsRef.current = {}
    } catch (error) {
      message.error(getApiErrorMessage(error, 'No fue posible crear la venta.'))
    } finally {
      setSaving(false)
    }
  }

  const handleCreateClient = async (values: CreateClientFormValues) => {
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
  }

  return (
    <div className="tms-page tms-pos-page">
      <RequireCompanyAlert />

      <Row gutter={[16, 0]} className="tms-pos-layout-row">
        <PuntoVentaCatalogSection
          loading={loading}
          productSearch={productSearch}
          selectedFamily={selectedFamily}
          familyFilterOptions={familyFilterOptions}
          filteredCatalog={filteredCatalog}
          onProductSearchChange={setProductSearch}
          onReload={() => { void loadCatalogData() }}
          onFamilyChange={setSelectedFamily}
          onClearFilters={() => {
            setProductSearch('')
            setSelectedFamily('ALL')
          }}
          onAddProduct={addProduct}
        />

        <PuntoVentaCartSection
          cart={cart}
          knownClientes={knownClientes}
          clientSearchByItem={clientSearchByItem}
          clientOptionsByItem={clientOptionsByItem}
          searchingByItem={searchingByItem}
          mediosPago={mediosPago}
          medioPagoId={medioPagoId}
          preview={preview}
          previewError={previewError}
          saving={saving}
          missingAssignedItem={missingAssignedItem}
          onRemoveItem={removeItem}
          onClientSearch={onClientSearch}
          onSetAssignedClient={setAssignedClient}
          onClearAssignedClient={clearAssignedClient}
          onOpenCreateClient={openCreateClient}
          onUpdateItemQuantity={updateItemQuantity}
          onMedioPagoChange={setMedioPagoId}
          onConfirmVenta={() => { void handleConfirmVenta() }}
        />
      </Row>

      <PuntoVentaCreateClientModal
        open={createClientOpen}
        creatingClient={creatingClient}
        tiposCliente={tiposCliente}
        form={createClientForm}
        onCancel={() => {
          setCreateClientOpen(false)
          setCreateClientTargetItemId(null)
          createClientForm.resetFields()
        }}
        onSubmit={() => createClientForm.submit()}
        onFinish={handleCreateClient}
        isValidRut={isValidRut}
      />
    </div>
  )
}
