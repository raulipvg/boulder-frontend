import { Grid, Typography } from 'antd'
import type { TableProps } from 'antd'
import type { VentaDto, VentaResumenDto } from '../../types/models'
import { VentasMobileList } from './VentasMobileList'
import { VentasTable } from './VentasTable'
import styles from './AnulacionesTab.module.css'

const { useBreakpoint } = Grid

interface AnulacionesTabProps {
  items: VentaResumenDto[]
  loading: boolean
  ventaDetalleById: Record<number, VentaDto>
  detalleLoadingById: Record<number, boolean>
  detalleErrorById: Record<number, string>
  onLoadDetalle: (ventaId: number, force?: boolean) => void
}

export function AnulacionesTab({
  items,
  loading,
  ventaDetalleById,
  detalleLoadingById,
  detalleErrorById,
  onLoadDetalle,
}: AnulacionesTabProps) {
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const extraColumns: NonNullable<TableProps<VentaResumenDto>['columns']> = [
    {
      title: 'Motivo',
      render: (_, record) => <Typography.Text className={styles.motivoValue}>{record.MotivoAnulacion}</Typography.Text>,
    },
    {
      title: 'Total',
      render: (_, record) => (
        <Typography.Text strong className={styles.totalValue}>
          ${record.Total.toLocaleString('es-CL')}
        </Typography.Text>
      ),
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
        renderExtra={(record) => (
          <Typography.Text className={styles.mobileMotivo} ellipsis={{ tooltip: record.MotivoAnulacion ?? undefined }}>
            {record.MotivoAnulacion || 'Sin motivo registrado'}
          </Typography.Text>
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
