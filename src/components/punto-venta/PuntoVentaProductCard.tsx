import { Card, Col, Typography } from 'antd'
import type { PosCatalogItemDto } from '../../types/models'
import {
  DUAL_TARIFA_CODES,
  formatCurrency,
  getProductTypeMeta,
  normalizeTypeCode,
  toDayCapitalCase,
} from './puntoVenta.helpers'
import styles from './PuntoVentaProductCard.module.css'

interface PuntoVentaProductCardProps {
  product: PosCatalogItemDto
  onAddProduct: (product: PosCatalogItemDto) => void
}

export function PuntoVentaProductCard({ product, onAddProduct }: PuntoVentaProductCardProps) {
  const typeMeta = getProductTypeMeta(product.TipoProductoBaseCodigo)
  const isClassProduct = typeMeta.family === 'CLASES'
  const normalizedProductCode = normalizeTypeCode(product.TipoProductoBaseCodigo)
  const isDualTarifaProduct = DUAL_TARIFA_CODES.has(normalizedProductCode)
  const classDaysLabel = isClassProduct && product.DiasClase?.length
    ? product.DiasClase.map((day) => toDayCapitalCase(day)).join(', ')
    : null
  const classPriceRows = [
    product.TarifaGeneralVigente != null
      ? { label: 'General', value: product.TarifaGeneralVigente }
      : null,
    product.TarifaEstudianteVigente != null
      ? { label: 'Estudiante', value: product.TarifaEstudianteVigente }
      : null,
  ].filter((entry): entry is { label: string, value: number } => Boolean(entry))
  const hasClassTarifas = classPriceRows.length > 0
  const priceLabel = product.ModoPrecio === 'fijo'
    ? formatCurrency(product.PrecioFijo)
    : 'Consultar en caja'

  return (
    <Col xs={24} md={12} lg={8}>
      <Card hoverable className={styles.card} onClick={() => onAddProduct(product)}>
        <div className={styles.cardHead}>
          <div className={styles.iconBox}>
            {typeMeta.icon}
          </div>
          <div className={styles.copy}>
            <Typography.Text strong className={styles.name}>
              {product.NombreComercial}
            </Typography.Text>
            <div className={styles.familyRow}>
              <Typography.Text type="secondary" className={styles.family}>
                {typeMeta.label}
              </Typography.Text>
              {classDaysLabel ? (
                <Typography.Text type="secondary" className={styles.days}>
                  {classDaysLabel}
                </Typography.Text>
              ) : null}
            </div>
          </div>
        </div>

        {isDualTarifaProduct ? (
          <div className={`${styles.footer} ${styles.footerClass}`}>
            {hasClassTarifas ? (
              classPriceRows.map((row) => (
                <div key={row.label} className={styles.classPriceBlock}>
                  <div className={styles.classPriceLabelRow}>
                    <Typography.Text type="secondary" className={styles.classPriceLabel}>{row.label}</Typography.Text>

                  </div>
                  <Typography.Text strong className={styles.price}>{formatCurrency(row.value)}</Typography.Text>
                </div>
              ))
            ) : (
              <Typography.Text type="secondary">Sin tarifa activa</Typography.Text>
            )}
          </div>
        ) : (
          <div className={styles.footer}>
            <Typography.Text strong className={styles.price}>{priceLabel}</Typography.Text>
          </div>
        )}
      </Card>
    </Col>
  )
}
