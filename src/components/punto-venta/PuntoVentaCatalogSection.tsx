import {
  ReloadOutlined,
} from '@ant-design/icons'
import { Button, Card, Col, Empty, Grid, Row, Segmented, Skeleton, Space } from 'antd'
import type { ReactNode } from 'react'
import type { PosCatalogItemDto } from '../../types/models'
import { PuntoVentaProductCard } from './PuntoVentaProductCard'
import styles from './PuntoVentaCatalogSection.module.css'

interface PuntoVentaCatalogSectionProps {
  loading: boolean
  selectedFamily: string
  familyFilterOptions: Array<{ value: string, label: ReactNode }>
  filteredCatalog: PosCatalogItemDto[]
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
  onReload,
  onFamilyChange,
  onClearFilters,
  onAddProduct,
}: PuntoVentaCatalogSectionProps) {
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  return (
    <Col xs={24} xl={15} xxl={16}>
      <Card className={styles.catalogCard} styles={{ body: { padding: 0 } }}>
        {loading ? (
          <Space orientation="vertical" size="large" className={styles.contentStack}>
            <div className={styles.toolbar}>
              <div className={styles.toolbarControls}>
                <div className={styles.filterWrap}>
                  <Skeleton.Button active block size="large" className={styles.skeletonFilterButton} />
                </div>
                {!isMobile && <Button size="large" icon={<ReloadOutlined />} onClick={onReload} />}
              </div>
            </div>
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
          </Space>
        ) : (
          <Space orientation="vertical" size="large" className={styles.contentStack}>
            <div className={styles.toolbar}>
              <div className={styles.toolbarControls}>
                <div className={styles.filterWrap}>
                  <Segmented
                    size="large"
                    block
                    value={selectedFamily}
                    onChange={(value) => onFamilyChange(String(value))}
                    options={familyFilterOptions}
                    className={styles.filterSegmented}
                  />
                </div>
                {!isMobile && <Button size="large" icon={<ReloadOutlined />} onClick={onReload} />}
              </div>
            </div>

            {filteredCatalog.length === 0 ? (
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
          </Space>
        )}
      </Card>
    </Col>
  )
}
