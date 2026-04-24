import { Typography } from 'antd'
import type { TableProps } from 'antd'
import type { ReactNode } from 'react'
import type { VentaDto, VentaResumenDto } from '../../types/models'
import { VentasTable } from './VentasTable'
import styles from './AnulacionesTab.module.css'

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

  const renderMobileExtra = (record: VentaResumenDto): ReactNode => (
    <div className={styles.mobileExtraRow}>
      {record.MotivoAnulacion && (
        <Typography.Text className={styles.motivoValue} ellipsis={{ tooltip: record.MotivoAnulacion }}>
          {record.MotivoAnulacion}
        </Typography.Text>
      )}
    </div>
  )

  return (
    <VentasTable
      items={items}
      loading={loading}
      extraColumns={extraColumns}
      renderMobileExtra={renderMobileExtra}
      ventaDetalleById={ventaDetalleById}
      detalleLoadingById={detalleLoadingById}
      detalleErrorById={detalleErrorById}
      onLoadDetalle={onLoadDetalle}
    />
  )
}
