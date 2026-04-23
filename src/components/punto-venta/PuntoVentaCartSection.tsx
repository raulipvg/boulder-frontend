import { DollarCircleOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Divider, Empty, Select, Space, Typography } from 'antd'
import type { ClienteLookupDto, LookupDto } from '../../types/models'
import { formatCurrency } from './puntoVenta.helpers'
import { PuntoVentaCartItem } from './PuntoVentaCartItem'
import type { CartItem, VentaPreviewDto } from './puntoVenta.types'
import styles from './PuntoVentaCartSection.module.css'

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
    <Col xs={24} xl={9} xxl={8} className={styles.cartCol}>
      <Card title={<Space><ShoppingCartOutlined />Caja</Space>} className={`${styles.cartCard} ${styles.cartSticky}`}>
        <div className={styles.cartLayout}>
          <div className={styles.cartListWrapper}>
            {cart.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Aun no agregas productos al carro"
              />
            ) : (
              <div className={styles.cartList}>
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

          <div className={styles.cartFooter}>
            <div className={styles.paymentBlock}>
              <Typography.Text type="secondary">Medio de pago</Typography.Text>
              <Select
                size="large"
                placeholder="Selecciona medio de pago"
                value={medioPagoId ?? undefined}
                onChange={(value) => onMedioPagoChange(value ?? null)}
                className={styles.paymentSelect}
                allowClear
                options={mediosPago.map((item) => ({ value: item.Id, label: item.Nombre }))}
              />
            </div>

            {previewError ? <Alert showIcon type="error" title={previewError} /> : null}

            {preview ? (
              <div>
                {preview.Detalles.map((detail, index) => (
                  <div key={`${detail.ProductoEmpresaId}-${index}`} className={styles.previewRow}>
                    <Typography.Text>{detail.ProductoNombre} x {detail.Cantidad}</Typography.Text>
                    <Typography.Text strong>{formatCurrency(detail.Subtotal)}</Typography.Text>
                  </div>
                ))}
                <Divider className={styles.previewDivider} />
                <div className={styles.previewTotal}>
                  <Typography.Text strong>TOTAL</Typography.Text>
                  <Typography.Text strong>{formatCurrency(preview.Total)}</Typography.Text>
                </div>
              </div>
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
