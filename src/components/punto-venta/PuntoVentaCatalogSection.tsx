import {
  ReloadOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'
import { Button, Card, Col, Empty, Grid, Row, Segmented, Skeleton } from 'antd'
import { useEffect, useState, type ReactNode } from 'react'
import type { PosCatalogItemDto } from '../../types/models'
import { PuntoVentaProductCard } from './PuntoVentaProductCard'
import styles from '../../styles/components/punto-venta/PuntoVentaCatalogSection.module.css'

interface PuntoVentaCatalogSectionProps {
  loading: boolean
  selectedFamily: string
  familyFilterOptions: Array<{ value: string, label: ReactNode }>
  filteredCatalog: PosCatalogItemDto[]
  cartItemsCount: number
  quickCartEnabled: boolean
  onReload: () => void
  onFamilyChange: (value: string) => void
  onClearFilters: () => void
  onAddProduct: (product: PosCatalogItemDto) => void
}

export function PuntoVentaCatalogSection({
  loading,
  selectedFamily,
  familyFilterOptions,
  filteredCatalog,
  cartItemsCount,
  quickCartEnabled,
  onReload,
  onFamilyChange,
  onClearFilters,
  onAddProduct,
}: PuntoVentaCatalogSectionProps) {
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const catalogBodyClassName = isMobile ? `${styles.catalogBody} ${styles.catalogBodyMobile}` : styles.catalogBody
  const [showQuickCart, setShowQuickCart] = useState(false)

  useEffect(() => {
    if (!isMobile || !quickCartEnabled) {
      setShowQuickCart(false)
      return
    }

    const cartSection = document.getElementById('punto-venta-caja')
    if (!cartSection) {
      setShowQuickCart(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowQuickCart(!entry.isIntersecting)
      },
      {
        root: null,
        threshold: 0.15,
      },
    )

    observer.observe(cartSection)

    return () => {
      observer.disconnect()
    }
  }, [isMobile, quickCartEnabled])

  const handleGoToCart = () => {
    document.getElementById('punto-venta-caja')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <Col xs={24} xl={15} xxl={16}>
      <Card className={styles.catalogCard} styles={{ body: { padding: 0 } }}>
        <div className={styles.contentStack}>
          <div className={styles.toolbar}>
            <div className={styles.toolbarControls}>
              <div className={styles.filterWrap}>
                {loading ? (
                  <Skeleton.Button active block size="large" className={styles.skeletonFilterButton} />
                ) : (
                  <Segmented
                    size="large"
                    block
                    value={selectedFamily}
                    onChange={(value) => onFamilyChange(String(value))}
                    options={familyFilterOptions}
                    className={styles.filterSegmented}
                  />
                )}
              </div>
              {!isMobile && <Button size="large" icon={<ReloadOutlined />} onClick={onReload} />}
            </div>
          </div>

          {isMobile && quickCartEnabled && showQuickCart && (
            <Button className={styles.quickCartFab} onClick={handleGoToCart}>
              {cartItemsCount > 0 ? <span className={styles.quickCartCount}>{cartItemsCount}</span> : null}
              <ShoppingCartOutlined />
              Caja
            </Button>
          )}

          <div className={catalogBodyClassName}>
            {loading ? (
              <Row gutter={[14, 14]}>
                {Array.from({ length: 9 }).map((_, index) => (
                  <Col xs={24} md={12} lg={8} key={`skeleton-${index}`}>
                    <Card className={styles.skeletonCard} variant="borderless">
                      <div className={styles.skeletonHeader}>
                        <Skeleton.Avatar active shape="square" size={48} className={styles.skeletonAvatar} />
                        <div className={styles.skeletonHeaderCopy}>
                          <Skeleton.Input active size="small" className={styles.skeletonTitle} />
                          <Skeleton.Input active size="small" className={styles.skeletonSubtitle} />
                        </div>
                      </div>
                      <div className={styles.skeletonFooter}>
                        <Skeleton.Input active size="small" className={styles.skeletonPrice} />
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : filteredCatalog.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No hay coincidencias con los filtros actuales."
              >
                <Button size="large" onClick={onClearFilters}>
                  Limpiar filtros
                </Button>
              </Empty>
            ) : (
              <Row gutter={[14, 14]}>
                {filteredCatalog.map((product) => (
                  <PuntoVentaProductCard
                    key={product.ProductoEmpresaId}
                    product={product}
                    onAddProduct={onAddProduct}
                  />
                ))}
              </Row>
            )}
          </div>
        </div>
      </Card>
    </Col>
  )
}
