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
import type { ClienteLookupDto } from '../../types/models'
import styles from './PuntoVentaCartItem.module.css'

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
    <div className={styles.cartItem}>
      <div className={styles.itemHead}>
        <div className={styles.itemCopy}>
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
        <div className={styles.clientBox}>
          <div className={styles.clientBoxHeader}>
            <Typography.Text type="secondary">Cliente</Typography.Text>
            <div className={styles.clientBoxInput}>
              <Space.Compact className={styles.clientCompact}>
                <AutoComplete
                  className={styles.clientAutoComplete}
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
                    className={styles.clientInput}
                    suffix={
                      assignedClient ? (
                        <CloseCircleFilled
                          className={styles.clearClientIcon}
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
            <div className={styles.assignedClientMeta}>
              <Tag color="info" className={styles.assignedClientTag}>{assignedClient.TipoCliente} · {assignedClient.Estado}</Tag>
            </div>
          ) : (
            <Alert
              showIcon
              type="warning"
              icon={<ExclamationCircleFilled />}
              title="Este producto requiere cliente asignado."
              className={styles.clientWarning}
            />
          )}
        </div>
      ) : null}

      <div className={styles.itemFoot}>
        {requiresClient ? (
          <div />
        ) : (
          <div className={styles.quantityControl}>
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

        <div className={styles.lineTotal}>
          <Typography.Text type="secondary">Subtotal linea</Typography.Text>
          <Typography.Text strong>{lineSubtotal == null ? 'Se cotiza en tarifa' : formatCurrency(lineSubtotal)}</Typography.Text>
        </div>
      </div>
    </div>
  )
}
