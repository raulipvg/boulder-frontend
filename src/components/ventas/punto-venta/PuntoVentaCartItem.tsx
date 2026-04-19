import {
  CloseCircleFilled,
  DeleteOutlined,
  ExclamationCircleFilled,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { Alert, AutoComplete, Button, Input, InputNumber, Space, Tag, Typography } from 'antd'
import type { CartItem } from './puntoVenta.types'
import { formatClientLabel, formatCurrency, requiresAssignedClient } from './puntoVenta.helpers'
import type { ClienteLookupDto } from '../../../types/models'

interface PuntoVentaCartItemProps {
  item: CartItem
  knownClientes: Record<number, ClienteLookupDto>
  clientSearchByItem: Record<string, string>
  clientOptionsByItem: Record<string, ClienteLookupDto[]>
  searchingByItem: Record<string, boolean>
  onRemoveItem: (itemId: string) => void
  onClientSearch: (itemId: string, value: string) => void
  onSetAssignedClient: (itemId: string, cliente: ClienteLookupDto) => void
  onClearAssignedClient: (itemId: string) => void
  onOpenCreateClient: (itemId: string) => void
  onUpdateItemQuantity: (itemId: string, value: number) => void
}

export function PuntoVentaCartItem({
  item,
  knownClientes,
  clientSearchByItem,
  clientOptionsByItem,
  searchingByItem,
  onRemoveItem,
  onClientSearch,
  onSetAssignedClient,
  onClearAssignedClient,
  onOpenCreateClient,
  onUpdateItemQuantity,
}: PuntoVentaCartItemProps) {
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
    <div className="tms-pos-cart-item">
      <div className="tms-pos-cart-item-head">
        <div className="tms-pos-cart-item-copy">
          <Typography.Text strong>{item.Product.NombreComercial}</Typography.Text>
        </div>

        <Button
          danger
          size="large"
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => onRemoveItem(item.Id)}
        />
      </div>

      {requiresClient ? (
        <div className="tms-pos-client-box">
          <div className="tms-pos-client-box-header">
            <Typography.Text type="secondary">Cliente</Typography.Text>
            <div className="tms-pos-client-box-input">
              <Space.Compact style={{ width: '100%' }}>
                <AutoComplete
                  style={{ flex: 1, minWidth: 0, width: '100%', backgroundColor: 'transparent', border: 'none' }}
                  value={assignedClient ? formatClientLabel(assignedClient) : searchValue}
                  onSearch={(value) => onClientSearch(item.Id, value)}
                  onSelect={(value) => {
                    const cliente = options.find((entry) => `${entry.ClienteEmpresaId}` === value)
                    if (cliente) {
                      onSetAssignedClient(item.Id, cliente)
                    }
                  }}
                  options={options.map((cliente) => ({
                    value: `${cliente.ClienteEmpresaId}`,
                    label: formatClientLabel(cliente),
                  }))}
                >
                  <Input
                    size="large"
                    placeholder="Buscar por nombre o RUT"
                    readOnly={!!assignedClient}
                    style={{ backgroundColor: 'transparent', border: 'none' }}
                    suffix={
                      assignedClient ? (
                        <CloseCircleFilled
                          style={{ cursor: 'pointer', color: '#bfbfbf', fontSize: '14px' }}
                          onClick={(event) => {
                            event.stopPropagation()
                            onClearAssignedClient(item.Id)
                          }}
                        />
                      ) : null
                    }
                  />
                </AutoComplete>
                {canSuggestCreate ? (
                  <Button
                    size="large"
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => onOpenCreateClient(item.Id)}
                  />
                ) : null}
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
      ) : null}

      <div className="tms-pos-cart-item-foot">
        {requiresClient ? (
          <div />
        ) : (
          <div className="tms-pos-quantity-control">
            <Button
              size="large"
              icon={<MinusOutlined />}
              disabled={item.Quantity <= 1}
              onClick={() => onUpdateItemQuantity(item.Id, item.Quantity - 1)}
            />
            <InputNumber
              min={1}
              controls={false}
              size="large"
              value={item.Quantity}
              onChange={(value) => onUpdateItemQuantity(item.Id, Number(value) || 1)}
            />
            <Button size="large" icon={<PlusOutlined />} onClick={() => onUpdateItemQuantity(item.Id, item.Quantity + 1)} />
          </div>
        )}

        <div className="tms-pos-cart-line-total">
          <Typography.Text type="secondary">Subtotal linea</Typography.Text>
          <Typography.Text strong>{lineSubtotal == null ? 'Se cotiza en tarifa' : formatCurrency(lineSubtotal)}</Typography.Text>
        </div>
      </div>
    </div>
  )
}
