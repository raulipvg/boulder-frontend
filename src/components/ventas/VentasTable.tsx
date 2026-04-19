import { FileTextOutlined } from '@ant-design/icons'
import { Alert, Button, Space, Spin, Table, Typography } from 'antd'
import type { TableProps } from 'antd'
import type { VentaDto, VentaResumenDto } from '../../types/models'
import { toCapitalCase } from '../../utils/formatPersonName'
import { ComprobanteVentaPreview } from './ComprobanteVentaPreview'

interface VentasTableProps {
  items: VentaResumenDto[]
  loading: boolean
  extraColumns: NonNullable<TableProps<VentaResumenDto>['columns']>
  ventaDetalleById: Record<number, VentaDto>
  detalleLoadingById: Record<number, boolean>
  detalleErrorById: Record<number, string>
  onLoadDetalle: (ventaId: number, force?: boolean) => void
}

const BASE_COLUMNS: NonNullable<TableProps<VentaResumenDto>['columns']> = [
  {
    title: 'Comprobante',
    render: (_, record) => (
      <Space>
        <FileTextOutlined style={{ color: '#8c8c8c' }} />
        <Typography.Text strong>#{record.NumeroComprobante}</Typography.Text>
      </Space>
    ),
  },
  {
    title: 'Fecha / Hora',
    render: (_, record) =>
      new Date(record.FechaHora).toLocaleString('es-CL', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),
  },
  {
    title: 'Cliente',
    render: (_, record) =>
      record.ClienteNombre ? (
        toCapitalCase(record.ClienteNombre)
      ) : (
        <Typography.Text type="secondary">Consumidor Final</Typography.Text>
      ),
  },
]

export function VentasTable({
  items,
  loading,
  extraColumns,
  ventaDetalleById,
  detalleLoadingById,
  detalleErrorById,
  onLoadDetalle,
}: VentasTableProps) {
  const renderExpandedContent = (record: VentaResumenDto) => {
    const ventaId = record.VentaId
    const detalle = ventaDetalleById[ventaId]
    const loadingDetalle = Boolean(detalleLoadingById[ventaId])
    const errorDetalle = detalleErrorById[ventaId]

    if (loadingDetalle) {
      return (
        <div style={{ padding: 16, textAlign: 'center' }}>
          <Spin />
        </div>
      )
    }

    if (errorDetalle) {
      return (
        <Alert
          type="error"
          message={errorDetalle}
          action={
            <Button type="link" size="small" onClick={() => onLoadDetalle(ventaId, true)}>
              Reintentar
            </Button>
          }
        />
      )
    }

    if (!detalle) {
      return (
        <div style={{ padding: 16 }}>
          <Typography.Text type="secondary">Cargando comprobante...</Typography.Text>
        </div>
      )
    }

    return <ComprobanteVentaPreview venta={detalle} />
  }

  return (
    <Table
      rowKey="VentaId"
      loading={loading}
      dataSource={items}
      expandable={{
        expandedRowRender: renderExpandedContent,
        onExpand: (expanded, record) => {
          if (expanded) {
            onLoadDetalle(record.VentaId)
          }
        },
      }}
      columns={[...BASE_COLUMNS, ...extraColumns]}
    />
  )
}
