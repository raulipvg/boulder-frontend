import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { Divider, Space, Tag, Typography } from 'antd'
import type { VentaDto } from '../../types/models'
import { toCapitalCase } from '../../utils/formatPersonName'
import styles from './ComprobanteVentaPreview.module.css'

interface ComprobanteVentaPreviewProps {
  venta: VentaDto
}

export function ComprobanteVentaPreview({ venta }: ComprobanteVentaPreviewProps) {
  const isAnulada = venta.Estado === 'anulada'
  const containerClassName = `${styles.container} ${isAnulada ? styles.containerAnulada : styles.containerEmitida}`
  const watermarkClassName = `${styles.watermark} ${isAnulada ? styles.watermarkAnulada : styles.watermarkEmitida}`
  const watermarkIconClassName = `${styles.watermarkIcon} ${isAnulada ? styles.watermarkIconAnulada : styles.watermarkIconEmitida}`

  return (
    <div className={containerClassName}>
      {isAnulada ? (
        <div className={watermarkClassName}>
          <CloseCircleOutlined className={watermarkIconClassName} />
        </div>
      ) : (
        <div className={watermarkClassName}>
          <CheckCircleOutlined className={watermarkIconClassName} />
        </div>
      )}

      <div className={styles.header}>
        <Typography.Title level={3} className={styles.title}>
          Comprobante de Venta
        </Typography.Title>
        <Typography.Text type="secondary" className={styles.comprobanteNumber}>
          #{venta.NumeroComprobante}
        </Typography.Text>
      </div>

      <div className={styles.metaRow}>
        <div>
          <Typography.Text type="secondary" className={styles.labelCaps}>
            Fecha de emision
          </Typography.Text>
          <br />
          <Typography.Text strong className={styles.metaValue}>
            {new Date(venta.FechaHora).toLocaleString('es-CL', {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })}
          </Typography.Text>
        </div>
        {venta.ClienteNombre ? (
          <div className={styles.metaRight}>
            <Typography.Text type="secondary" className={styles.labelCaps}>
              Cliente
            </Typography.Text>
            <br />
            <Typography.Text strong className={styles.metaValue}>
              {toCapitalCase(venta.ClienteNombre)}
            </Typography.Text>
          </div>
        ) : null}
      </div>

      <Divider className={styles.sectionDivider} />

      <div className={styles.section}>
        <Typography.Text strong className={styles.labelCapsBlock}>
          Productos / Servicios
        </Typography.Text>
        {venta.Detalles.map((detalle) => (
          <div key={detalle.VentaDetalleId} className={styles.detailRow}>
            <div>
              <Typography.Text strong className={styles.detailTitle}>
                {detalle.Cantidad}x {detalle.ProductoNombre}
              </Typography.Text>
              <br />
              <Typography.Text type="secondary" className={styles.detailUnitPrice}>
                ${detalle.PrecioUnitario.toLocaleString('es-CL')} c/u
              </Typography.Text>
            </div>
            <Typography.Text strong className={styles.detailSubtotal}>
              ${detalle.Subtotal.toLocaleString('es-CL')}
            </Typography.Text>
          </div>
        ))}
      </div>

      <Divider className={styles.sectionDivider} />

      <div className={styles.totalsBox}>
        <div className={styles.rowBetweenWithGap8}>
          <Typography.Text type="secondary">Subtotal</Typography.Text>
          <Typography.Text>${venta.Subtotal.toLocaleString('es-CL')}</Typography.Text>
        </div>
        {venta.Descuento > 0 ? (
          <div className={styles.rowBetweenWithGap8}>
            <Typography.Text type="danger">Descuento</Typography.Text>
            <Typography.Text type="danger">-${venta.Descuento.toLocaleString('es-CL')}</Typography.Text>
          </div>
        ) : null}
        <div className={styles.totalRow}>
          <Typography.Text className={styles.totalLabel}>Total Final</Typography.Text>
          <Typography.Text className={styles.totalValue}>
            ${venta.Total.toLocaleString('es-CL')}
          </Typography.Text>
        </div>
      </div>

      {venta.Pagos.length > 0 ? (
        <div className={styles.section}>
          <Typography.Text strong className={styles.labelCapsBlock}>
            Metodos de Pago
          </Typography.Text>
          {venta.Pagos.map((pago) => (
            <div key={pago.VentaPagoId} className={styles.paymentRow}>
              <Space>
                <Tag color="blue">{toCapitalCase(pago.MedioPago)}</Tag>
                {pago.Referencia ? (
                  <Typography.Text type="secondary" className={styles.paymentRef}>
                    Ref: {pago.Referencia}
                  </Typography.Text>
                ) : null}
              </Space>
              <Typography.Text strong>${pago.Monto.toLocaleString('es-CL')}</Typography.Text>
            </div>
          ))}
        </div>
      ) : null}

      {isAnulada && venta.MotivoAnulacion ? (
        <div className={styles.cancelReasonBox}>
          <Typography.Text type="danger" strong className={styles.cancelReasonTitle}>
            <CloseCircleOutlined /> Motivo de Anulacion
          </Typography.Text>
          <div className={styles.cancelReasonValue}>{venta.MotivoAnulacion}</div>
        </div>
      ) : null}
    </div>
  )
}
