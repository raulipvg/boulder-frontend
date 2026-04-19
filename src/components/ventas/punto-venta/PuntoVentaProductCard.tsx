import { Card, Col, Typography } from 'antd'
import type { PosCatalogItemDto } from '../../../types/models'
import {
  DUAL_TARIFA_CODES,
  formatCurrency,
  getProductTypeMeta,
  normalizeTypeCode,
  toDayCapitalCase,
} from './puntoVenta.helpers'

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
      <Card hoverable className="tms-pos-product-card" onClick={() => onAddProduct(product)}>
        <div className="tms-pos-product-card-head">
          <div className="tms-pos-product-icon">
            {typeMeta.icon}
          </div>
          <div className="tms-pos-product-copy">
            <Typography.Text strong className="tms-pos-product-name">
              {product.NombreComercial}
            </Typography.Text>
            <div className="tms-pos-product-family-row">
              <Typography.Text type="secondary" className="tms-pos-product-family">
                {typeMeta.label}
              </Typography.Text>
              {classDaysLabel ? (
                <Typography.Text type="secondary" className="tms-pos-product-days">
                  {classDaysLabel}
                </Typography.Text>
              ) : null}
            </div>
          </div>
        </div>

        {isDualTarifaProduct ? (
          <div className="tms-pos-product-footer tms-pos-product-footer--class">
            {hasClassTarifas ? (
              classPriceRows.map((row) => (
                <div key={row.label} className="tms-pos-class-price-block">
                  <div className="tms-pos-class-price-label-row">
                    <Typography.Text type="secondary" className="tms-pos-class-price-label">{row.label}</Typography.Text>

                  </div>
                  <Typography.Text strong className="tms-pos-product-price">{formatCurrency(row.value)}</Typography.Text>
                </div>
              ))
            ) : (
              <Typography.Text type="secondary">Sin tarifa activa</Typography.Text>
            )}
          </div>
        ) : (
          <div className="tms-pos-product-footer">
            <Typography.Text strong className="tms-pos-product-price">{priceLabel}</Typography.Text>
          </div>
        )}
      </Card>
    </Col>
  )
}
