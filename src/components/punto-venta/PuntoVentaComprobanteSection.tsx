import { CheckCircleOutlined } from '@ant-design/icons'
import { Button, Card, Col } from 'antd'
import { useEffect, useRef } from 'react'
import type { VentaDto } from '../../types/models'
import { ComprobanteVentaPreview } from '../ventas/ComprobanteVentaPreview'
import styles from './PuntoVentaComprobanteSection.module.css'

interface PuntoVentaComprobanteSectionProps {
  venta: VentaDto
  onOk: () => void
}

export function PuntoVentaComprobanteSection({ venta, onOk }: PuntoVentaComprobanteSectionProps) {
  const bodyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0
    }
  }, [venta.VentaId])

  return (
    <Col id="punto-venta-caja" xs={24} xl={9} xxl={8} className={styles.sectionCol}>
      <Card className={`${styles.sectionCard} ${styles.sectionSticky}`} styles={{ body: { padding: 0 } }}>
        <div className={styles.layout}>
          <div ref={bodyRef} className={styles.body}>
            <div className={styles.previewCenterWrap}>
              <ComprobanteVentaPreview venta={venta} />
            </div>
          </div>
          <div className={styles.footer}>
            <Button type="primary" size="large" block icon={<CheckCircleOutlined />} onClick={onOk}>
              OK
            </Button>
          </div>
        </div>
      </Card>
    </Col>
  )
}
