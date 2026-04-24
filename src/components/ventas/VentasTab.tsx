import { Button, Grid, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import type { VentaDto, VentaResumenDto } from '../../types/models'
import { VentasMobileList } from './VentasMobileList'
import { VentasTable } from './VentasTable'
import styles from '../../styles/components/ventas/VentasTab.module.css'

const { useBreakpoint } = Grid

interface VentasTabProps {
  items: VentaResumenDto[]
  loading: boolean
  onAnularVenta: (venta: VentaResumenDto) => void
  ventaDetalleById: Record<number, VentaDto>
  detalleLoadingById: Record<number, boolean>
  detalleErrorById: Record<number, string>
  onLoadDetalle: (ventaId: number, force?: boolean) => void
}

export function VentasTab({
  items,
  loading,
  onAnularVenta,
  ventaDetalleById,
  detalleLoadingById,
  detalleErrorById,
  onLoadDetalle,
}: VentasTabProps) {
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const extraColumns: NonNullable<TableProps<VentaResumenDto>['columns']> = [
    {
      title: 'Estado',
      render: (_, record) => (
        <Tag color={record.Estado === 'emitida' ? 'success' : 'error'} variant="filled">
          {record.Estado.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Total',
      render: (_, record) => (
        <Typography.Text strong className={styles.totalValue}>
          ${record.Total.toLocaleString('es-CL')}
        </Typography.Text>
      ),
    },
    {
      title: 'Acciones',
      align: 'right',
      render: (_, record) =>
        record.Estado === 'emitida' ? (
          <Button
            size="small"
            type="primary"
            danger
            ghost
            onClick={(event) => {
              event.stopPropagation()
              onAnularVenta(record)
            }}
          >
            Anular venta
          </Button>
        ) : null,
    },
  ]

  if (isMobile) {
    return (
      <VentasMobileList
        items={items}
        loading={loading}
        ventaDetalleById={ventaDetalleById}
        detalleLoadingById={detalleLoadingById}
        detalleErrorById={detalleErrorById}
        onLoadDetalle={onLoadDetalle}
        renderHeaderAside={(record) => (
          <div className={styles.mobileHeaderActions}>
            <Tag color={record.Estado === 'emitida' ? 'success' : 'error'} variant="filled">
              {record.Estado.toUpperCase()}
            </Tag>
            {record.Estado === 'emitida' && (
              <Button
                size="small"
                type="primary"
                danger
                ghost
                onClick={(event) => {
                  event.stopPropagation()
                  onAnularVenta(record)
                }}
              >
                Anular
              </Button>
            )}
          </div>
        )}
      />
    )
  }

  return (
    <VentasTable
      items={items}
      loading={loading}
      extraColumns={extraColumns}
      ventaDetalleById={ventaDetalleById}
      detalleLoadingById={detalleLoadingById}
      detalleErrorById={detalleErrorById}
      onLoadDetalle={onLoadDetalle}
    />
  )
}
