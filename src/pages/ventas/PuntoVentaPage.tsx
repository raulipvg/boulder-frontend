import { Alert, AutoComplete, Button, Card, Col, Divider, InputNumber, Row, Select, Space, Typography, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { administracionService } from '../../services/administracion/administracionService'
import { operacionService } from '../../services/operacion/operacionService'
import { ventasService } from '../../services/ventas/ventasService'
import type { ClienteLookupDto, LookupDto, PosCatalogItemDto } from '../../types/models'

interface CartItem {
  product: PosCatalogItemDto
  quantity: number
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

export default function PuntoVentaPage() {
  const [catalog, setCatalog] = useState<PosCatalogItemDto[]>([])
  const [mediosPago, setMediosPago] = useState<LookupDto[]>([])
  const [clientes, setClientes] = useState<ClienteLookupDto[]>([])
  const [selectedClient, setSelectedClient] = useState<ClienteLookupDto | null>(null)
  const [clientSearch, setClientSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [preview, setPreview] = useState<VentaPreviewDto | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [medioPagoId, setMedioPagoId] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [catalogData, medios] = await Promise.all([
          ventasService.getPosCatalog(),
          administracionService.getMediosPago(),
        ])
        setCatalog(catalogData)
        setMediosPago(medios)
        setMedioPagoId(medios[0]?.Id ?? null)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  useEffect(() => {
    if (!clientSearch || clientSearch.length < 2) {
      setClientes([])
      return
    }

    const timeout = setTimeout(async () => {
      setClientes(await operacionService.buscarClientes(clientSearch))
    }, 250)

    return () => clearTimeout(timeout)
  }, [clientSearch])

  useEffect(() => {
    const loadPreview = async () => {
      if (!cart.length) {
        setPreview(null)
        setPreviewError(null)
        return
      }

      try {
        const result = await ventasService.previewVenta({
          ClienteEmpresaId: selectedClient?.ClienteEmpresaId ?? null,
          Items: cart.map((item) => ({
            ProductoEmpresaId: item.product.ProductoEmpresaId,
            Cantidad: item.quantity,
            FechaInicioVigencia: null,
            Observacion: null,
          })),
        })
        setPreview(result)
        setPreviewError(null)
      } catch (error) {
        setPreview(null)
        setPreviewError(error instanceof Error ? error.message : 'No fue posible cotizar la venta.')
      }
    }

    void loadPreview()
  }, [cart, selectedClient])

  const requiresClient = useMemo(() => cart.some((item) => item.product.RequiereCliente), [cart])

  const addProduct = (product: PosCatalogItemDto) => {
    setCart((current) => {
      const existing = current.find((item) => item.product.ProductoEmpresaId === product.ProductoEmpresaId)
      if (existing) {
        return current.map((item) => item.product.ProductoEmpresaId === product.ProductoEmpresaId ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...current, { product, quantity: 1 }]
    })
  }

  return (
    <>
      <RequireCompanyAlert />
      <Row gutter={16}>
        <Col xs={24} xl={15}>
          <Card loading={loading} title="Productos disponibles en caja">
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
          <Card title="Caja">
            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
              <AutoComplete
                value={selectedClient ? `${selectedClient.NombreCompleto} (${selectedClient.Rut})` : clientSearch}
                onSearch={setClientSearch}
                onSelect={(value) => {
                  const cliente = clientes.find((item) => `${item.ClienteEmpresaId}` === value)
                  if (cliente) {
                    setSelectedClient(cliente)
                    setClientSearch(`${cliente.NombreCompleto} (${cliente.Rut})`)
                  }
                }}
                options={clientes.map((cliente) => ({
                  value: `${cliente.ClienteEmpresaId}`,
                  label: `${cliente.NombreCompleto} (${cliente.Rut})`,
                }))}
              >
                <InputNumber style={{ display: 'none' }} />
              </AutoComplete>

              {selectedClient && (
                <Alert
                  showIcon
                  type="info"
                  message={selectedClient.NombreCompleto}
                  description={`${selectedClient.TipoCliente} · ${selectedClient.Estado}`}
                  action={<Button size="small" onClick={() => { setSelectedClient(null); setClientSearch('') }}>Quitar</Button>}
                />
              )}

              {requiresClient && !selectedClient && (
                <Alert showIcon type="warning" message="Hay productos en el carro que requieren cliente." />
              )}

              {cart.length === 0 ? (
                <Typography.Text type="secondary">Sin productos en el carro</Typography.Text>
              ) : (
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 8 }}>
                  {cart.map((item) => (
                    <div key={item.product.ProductoEmpresaId} style={{ padding: '12px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Typography.Text strong>{item.product.NombreComercial}</Typography.Text>
                        <br />
                        <Typography.Text type="secondary">{item.product.ModoPrecio === 'fijo' ? `$ ${item.product.PrecioFijo ?? 0}` : 'Tarifa dinámica'}</Typography.Text>
                      </div>
                      <Space>
                        <InputNumber key="qty" min={1} value={item.quantity} onChange={(value) => setCart((current) => current.map((row) => row.product.ProductoEmpresaId === item.product.ProductoEmpresaId ? { ...row, quantity: Number(value) || 1 } : row))} />
                        <Button danger onClick={() => setCart((current) => current.filter((row) => row.product.ProductoEmpresaId !== item.product.ProductoEmpresaId))}>Quitar</Button>
                      </Space>
                    </div>
                  ))}
                </div>
              )}

              {previewError && <Alert showIcon type="error" message={previewError} />}

              {preview && (
                <Card size="small" title="Previsualización de venta">
                  {preview.Detalles.map((detail) => (
                    <div key={detail.ProductoEmpresaId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
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
                disabled={!preview || !medioPagoId || (requiresClient && !selectedClient)}
                onClick={async () => {
                  if (!preview || !medioPagoId) return
                  setSaving(true)
                  try {
                    const result = await ventasService.createVenta({
                      ClienteEmpresaId: selectedClient?.ClienteEmpresaId ?? null,
                      Items: cart.map((item) => ({
                        ProductoEmpresaId: item.product.ProductoEmpresaId,
                        Cantidad: item.quantity,
                        FechaInicioVigencia: null,
                        Observacion: null,
                      })),
                      Pagos: [{ MedioPagoId: medioPagoId, Monto: preview.Total, Referencia: null }],
                    })
                    message.success(`Venta ${result.NumeroComprobante} creada correctamente.`)
                    setCart([])
                    setPreview(null)
                    setSelectedClient(null)
                    setClientSearch('')
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
    </>
  )
}
