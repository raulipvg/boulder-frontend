import { DownOutlined, FileTextOutlined, UpOutlined } from '@ant-design/icons'
import { Alert, Button, Grid, Space, Spin, Table, Typography } from 'antd'
import type { TableProps } from 'antd'
import { useState, type ReactNode } from 'react'
import type { VentaDto, VentaResumenDto } from '../../types/models'
import { toCapitalCase } from '../../utils/formatPersonName'
import { ComprobanteVentaPreview } from './ComprobanteVentaPreview'
import styles from './VentasTable.module.css'

const { useBreakpoint } = Grid

interface VentasTableProps {
  items: VentaResumenDto[]
  loading: boolean
  extraColumns: NonNullable<TableProps<VentaResumenDto>['columns']>
  renderMobileExtra?: (record: VentaResumenDto) => ReactNode
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
        <FileTextOutlined className={styles.comprobanteIcon} />
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

function MobileCard({
  record,
  renderMobileExtra,
  ventaDetalleById,
  detalleLoadingById,
  detalleErrorById,
  onLoadDetalle,
}: {
  record: VentaResumenDto
  renderMobileExtra?: (record: VentaResumenDto) => ReactNode
  ventaDetalleById: Record<number, VentaDto>
  detalleLoadingById: Record<number, boolean>
  detalleErrorById: Record<number, string>
  onLoadDetalle: (ventaId: number, force?: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const ventaId = record.VentaId
  const detalle = ventaDetalleById[ventaId]
  const loadingDetalle = Boolean(detalleLoadingById[ventaId])
  const errorDetalle = detalleErrorById[ventaId]

  const handleToggle = () => {
    const next = !expanded
    setExpanded(next)
    if (next && !detalle) {
      onLoadDetalle(ventaId)
    }
  }

  return (
    <div className={styles.mobileCard}>
      {/* Header row: comprobante + fecha */}
      <div className={styles.mobileCardHeader}>
        <div className={styles.mobileCardTitle}>
          <FileTextOutlined className={styles.comprobanteIcon} />
          <Typography.Text strong>#{record.NumeroComprobante}</Typography.Text>
        </div>
        <Typography.Text type="secondary" className={styles.mobileCardDate}>
          {new Date(record.FechaHora).toLocaleString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })}
        </Typography.Text>
      </div>

      {/* Cliente */}
      <div className={styles.mobileCardCliente}>
        {record.ClienteNombre ? (
          <Typography.Text>{toCapitalCase(record.ClienteNombre)}</Typography.Text>
        ) : (
          <Typography.Text type="secondary">Consumidor Final</Typography.Text>
        )}
      </div>

      {/* Extra info (estado/motivo + total + acciones) */}
      {renderMobileExtra && (
        <div className={styles.mobileCardExtra}>{renderMobileExtra(record)}</div>
      )}

      {/* Toggle comprobante */}
      <button className={styles.mobileCardToggle} onClick={handleToggle}>
        {expanded ? (
          <>
            <UpOutlined className={styles.mobileCardToggleIcon} />
            Ocultar comprobante
          </>
        ) : (
          <>
            <DownOutlined className={styles.mobileCardToggleIcon} />
            Ver comprobante
          </>
        )}
      </button>

      {/* Comprobante expandido */}
      {expanded && (
        <div className={styles.mobileCardExpanded}>
          {loadingDetalle ? (
            <div className={styles.expandedLoading}>
              <Spin />
            </div>
          ) : errorDetalle ? (
            <Alert
              type="error"
              message={errorDetalle}
              action={
                <Button type="link" size="small" onClick={() => onLoadDetalle(ventaId, true)}>
                  Reintentar
                </Button>
              }
            />
          ) : !detalle ? (
            <div className={styles.expandedPlaceholder}>
              <Typography.Text type="secondary">Cargando comprobante...</Typography.Text>
            </div>
          ) : (
            <ComprobanteVentaPreview venta={detalle} />
          )}
        </div>
      )}
    </div>
  )
}

export function VentasTable({
  items,
  loading,
  extraColumns,
  renderMobileExtra,
  ventaDetalleById,
  detalleLoadingById,
  detalleErrorById,
  onLoadDetalle,
}: VentasTableProps) {
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const renderExpandedContent = (record: VentaResumenDto) => {
    const ventaId = record.VentaId
    const detalle = ventaDetalleById[ventaId]
    const loadingDetalle = Boolean(detalleLoadingById[ventaId])
    const errorDetalle = detalleErrorById[ventaId]

    if (loadingDetalle) {
      return (
        <div className={styles.expandedLoading}>
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
        <div className={styles.expandedPlaceholder}>
          <Typography.Text type="secondary">Cargando comprobante...</Typography.Text>
        </div>
      )
    }

    return <ComprobanteVentaPreview venta={detalle} />
  }

  if (isMobile) {
    if (loading) {
      return (
        <div className={styles.mobileLoadingWrapper}>
          <Spin />
        </div>
      )
    }

    if (items.length === 0) {
      return (
        <div className={styles.mobileEmptyWrapper}>
          <Typography.Text type="secondary">Sin registros</Typography.Text>
        </div>
      )
    }

    return (
      <div className={styles.mobileCardList}>
        {items.map((record) => (
          <MobileCard
            key={record.VentaId}
            record={record}
            renderMobileExtra={renderMobileExtra}
            ventaDetalleById={ventaDetalleById}
            detalleLoadingById={detalleLoadingById}
            detalleErrorById={detalleErrorById}
            onLoadDetalle={onLoadDetalle}
          />
        ))}
      </div>
    )
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
