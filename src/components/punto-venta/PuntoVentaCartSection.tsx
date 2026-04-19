import { DollarCircleOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Divider, Empty, Select, Space, Typography } from 'antd'
import type { ClienteLookupDto, LookupDto } from '../../../types/models'
import { formatCurrency } from './puntoVenta.helpers'
import { PuntoVentaCartItem } from './PuntoVentaCartItem'
import type { CartItem, VentaPreviewDto } from './puntoVenta.types'

interface PuntoVentaCartSectionProps {
  cart: CartItem[]
  knownClientes: Record<number, ClienteLookupDto>
  clientSearchByItem: Record<string, string>
  clientOptionsByItem: Record<string, ClienteLookupDto[]>
  searchingByItem: Record<string, boolean>
  mediosPago: LookupDto[]
  medioPagoId: number | null
  preview: VentaPreviewDto | null
  previewError: string | null
  saving: boolean
  missingAssignedItem?: CartItem
  onRemoveItem: (itemId: string) => void
  onClientSearch: (itemId: string, value: string) => void
  onSetAssignedClient: (itemId: string, cliente: ClienteLookupDto) => void
  onClearAssignedClient: (itemId: string) => void
  onOpenCreateClient: (itemId: string) => void
  onUpdateItemQuantity: (itemId: string, value: number) => void
  onMedioPagoChange: (medioPagoId: number | null) => void
  onConfirmVenta: () => void
}

export function PuntoVentaCartSection({
  cart,
  knownClientes,
  clientSearchByItem,
  clientOptionsByItem,
  searchingByItem,
  mediosPago,
  medioPagoId,
  preview,
  previewError,
  saving,
  missingAssignedItem,
  onRemoveItem,
  onClientSearch,
  onSetAssignedClient,
  onClearAssignedClient,
  onOpenCreateClient,
  onUpdateItemQuantity,
  onMedioPagoChange,
  onConfirmVenta,
}: PuntoVentaCartSectionProps) {
  return (
    <Col xs={24} xl={9} xxl={8}>
      <Card title={<Space><ShoppingCartOutlined />Caja</Space>} className="tms-page-table-card tms-pos-cart-card tms-pos-cart-sticky">
        <div className="tms-pos-cart-layout">
          <div className="tms-pos-cart-list-wrapper">
            {cart.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Aun no agregas productos al carro"
              />
            ) : (
              <div className="tms-pos-cart-list">
                {cart.map((item) => (
                  <PuntoVentaCartItem
                    key={item.Id}
                    item={item}
                    knownClientes={knownClientes}
                    clientSearchByItem={clientSearchByItem}
                    clientOptionsByItem={clientOptionsByItem}
                    searchingByItem={searchingByItem}
                    onRemoveItem={onRemoveItem}
                    onClientSearch={onClientSearch}
                    onSetAssignedClient={onSetAssignedClient}
                    onClearAssignedClient={onClearAssignedClient}
                    onOpenCreateClient={onOpenCreateClient}
                    onUpdateItemQuantity={onUpdateItemQuantity}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="tms-pos-cart-footer">
            <div className="tms-pos-payment-block">
              <Typography.Text type="secondary">Medio de pago</Typography.Text>
              <Select
                size="large"
                placeholder="Selecciona medio de pago"
                value={medioPagoId ?? undefined}
                onChange={(value) => onMedioPagoChange(value ?? null)}
                style={{ backgroundColor: 'transparent', border: 'none', textAlign: 'right' }}
                allowClear
                options={mediosPago.map((item) => ({ value: item.Id, label: item.Nombre }))}
              />
            </div>

            {previewError ? <Alert showIcon type="error" title={previewError} /> : null}

            {preview ? (
              <Card size="small" variant="borderless" style={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
                {preview.Detalles.map((detail, index) => (
                  <div key={`${detail.ProductoEmpresaId}-${index}`} className="tms-pos-preview-row">
                    <Typography.Text>{detail.ProductoNombre} x {detail.Cantidad}</Typography.Text>
                    <Typography.Text strong>{formatCurrency(detail.Subtotal)}</Typography.Text>
                  </div>
                ))}
                <Divider style={{ margin: '12px 0' }} />
                <div className="tms-pos-preview-total">
                  <Typography.Text strong>TOTAL</Typography.Text>
                  <Typography.Text strong>{formatCurrency(preview.Total)}</Typography.Text>
                </div>
              </Card>
            ) : null}

            <Button
              type="primary"
              size="large"
              block
              icon={<DollarCircleOutlined />}
              loading={saving}
              disabled={!preview || !medioPagoId || !!missingAssignedItem}
              onClick={onConfirmVenta}
            >
              CONFIRMAR VENTA
            </Button>
          </div>
        </div>
      </Card>
    </Col>
  )
}
