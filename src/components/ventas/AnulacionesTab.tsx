import { Typography } from 'antd'
import type { TableProps } from 'antd'
import type { VentaDto, VentaResumenDto } from '../../types/models'
import { VentasTable } from './VentasTable'

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
      render: (_, record) => <Typography.Text style={{ color: '#d4380d' }}>{record.MotivoAnulacion}</Typography.Text>,
    },
    {
      title: 'Total',
      render: (_, record) => (
        <Typography.Text strong style={{ color: '#bfbfbf', textDecoration: 'line-through', fontSize: 15 }}>
          ${record.Total.toLocaleString('es-CL')}
        </Typography.Text>
      ),
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
