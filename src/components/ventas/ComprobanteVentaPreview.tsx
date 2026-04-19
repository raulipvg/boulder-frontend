import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { Divider, Space, Tag, Typography } from 'antd'
import type { VentaDto } from '../../types/models'
import { toCapitalCase } from '../../utils/formatPersonName'

interface ComprobanteVentaPreviewProps {
  venta: VentaDto
}

export function ComprobanteVentaPreview({ venta }: ComprobanteVentaPreviewProps) {
  const isAnulada = venta.Estado === 'anulada'

  return (
    <div
      style={{
        margin: '24px auto',
        padding: '32px',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.08), 0 2px 10px rgba(0,0,0,0.03)',
        maxWidth: 600,
        borderTop: `8px solid ${isAnulada ? '#ff4d4f' : '#333'}`,
        position: 'relative',
      }}
    >
      {isAnulada ? (
        <div style={{ position: 'absolute', top: 32, right: 32, opacity: 0.1, pointerEvents: 'none' }}>
          <CloseCircleOutlined style={{ fontSize: 120, color: '#ff4d4f' }} />
        </div>
      ) : (
        <div style={{ position: 'absolute', top: 32, right: 32, opacity: 0.05, pointerEvents: 'none' }}>
          <CheckCircleOutlined style={{ fontSize: 120, color: '#52c41a' }} />
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Typography.Title level={3} style={{ margin: 0, fontWeight: 700, color: '#1f1f1f' }}>
          Comprobante de Venta
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 16 }}>
          #{venta.NumeroComprobante}
        </Typography.Text>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Typography.Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Fecha de emision
          </Typography.Text>
          <br />
          <Typography.Text strong style={{ fontSize: 15 }}>
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
          <div style={{ textAlign: 'right' }}>
            <Typography.Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              Cliente
            </Typography.Text>
            <br />
            <Typography.Text strong style={{ fontSize: 15 }}>
              {toCapitalCase(venta.ClienteNombre)}
            </Typography.Text>
          </div>
        ) : null}
      </div>

      <Divider style={{ margin: '16px 0', borderColor: '#f0f0f0' }} />

      <div style={{ marginBottom: 24 }}>
        <Typography.Text
          strong
          style={{
            display: 'block',
            marginBottom: 12,
            fontSize: 12,
            textTransform: 'uppercase',
            color: '#8c8c8c',
            letterSpacing: 1,
          }}
        >
          Productos / Servicios
        </Typography.Text>
        {venta.Detalles.map((detalle) => (
          <div
            key={detalle.VentaDetalleId}
            style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}
          >
            <div>
              <Typography.Text strong style={{ fontSize: 15 }}>
                {detalle.Cantidad}x {detalle.ProductoNombre}
              </Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                ${detalle.PrecioUnitario.toLocaleString('es-CL')} c/u
              </Typography.Text>
            </div>
            <Typography.Text strong style={{ fontSize: 16 }}>
              ${detalle.Subtotal.toLocaleString('es-CL')}
            </Typography.Text>
          </div>
        ))}
      </div>

      <Divider style={{ margin: '16px 0', borderColor: '#f0f0f0' }} />

      <div style={{ background: '#fafafa', padding: '16px 20px', borderRadius: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Typography.Text type="secondary">Subtotal</Typography.Text>
          <Typography.Text>${venta.Subtotal.toLocaleString('es-CL')}</Typography.Text>
        </div>
        {venta.Descuento > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Typography.Text type="danger">Descuento</Typography.Text>
            <Typography.Text type="danger">-${venta.Descuento.toLocaleString('es-CL')}</Typography.Text>
          </div>
        ) : null}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px dashed #e8e8e8',
          }}
        >
          <Typography.Text style={{ fontSize: 18, fontWeight: 600 }}>Total Final</Typography.Text>
          <Typography.Text style={{ fontSize: 20, fontWeight: 700, color: '#1890ff' }}>
            ${venta.Total.toLocaleString('es-CL')}
          </Typography.Text>
        </div>
      </div>

      {venta.Pagos.length > 0 ? (
        <div style={{ marginBottom: 24 }}>
          <Typography.Text
            strong
            style={{
              display: 'block',
              marginBottom: 12,
              fontSize: 12,
              textTransform: 'uppercase',
              color: '#8c8c8c',
              letterSpacing: 1,
            }}
          >
            Metodos de Pago
          </Typography.Text>
          {venta.Pagos.map((pago) => (
            <div
              key={pago.VentaPagoId}
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}
            >
              <Space>
                <Tag color="blue">{toCapitalCase(pago.MedioPago)}</Tag>
                {pago.Referencia ? (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
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
        <div style={{ background: '#fff2f0', padding: '16px', borderRadius: 12, border: '1px solid #ffccc7' }}>
          <Typography.Text type="danger" strong style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CloseCircleOutlined /> Motivo de Anulacion
          </Typography.Text>
          <div style={{ marginTop: 8, color: '#cf1322' }}>{venta.MotivoAnulacion}</div>
        </div>
      ) : null}
    </div>
  )
}
