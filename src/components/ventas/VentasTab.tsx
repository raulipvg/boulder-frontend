import { Button, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import type { VentaDto, VentaResumenDto } from '../../types/models'
import { VentasTable } from './VentasTable'
import styles from './VentasTab.module.css'

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
  const extraColumns: NonNullable<TableProps<VentaResumenDto>['columns']> = [
    {
      title: 'Estado',
      render: (_, record) => (
        <Tag color={record.Estado === 'emitida' ? 'success' : 'error'} bordered={false}>
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
