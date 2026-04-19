import {
  AppstoreOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { Button, Card, Col, Empty, Input, Row, Segmented, Skeleton, Space } from 'antd'
import type { ReactNode } from 'react'
import type { PosCatalogItemDto } from '../../../types/models'
import { PuntoVentaProductCard } from './PuntoVentaProductCard'

interface PuntoVentaCatalogSectionProps {
  loading: boolean
  productSearch: string
  selectedFamily: string
  familyFilterOptions: Array<{ value: string, label: ReactNode }>
  filteredCatalog: PosCatalogItemDto[]
  onProductSearchChange: (value: string) => void
  onReload: () => void
  onFamilyChange: (value: string) => void
  onClearFilters: () => void
  onAddProduct: (product: PosCatalogItemDto) => void
}

export function PuntoVentaCatalogSection({
  loading,
  productSearch,
  selectedFamily,
  familyFilterOptions,
  filteredCatalog,
  onProductSearchChange,
  onReload,
  onFamilyChange,
  onClearFilters,
  onAddProduct,
}: PuntoVentaCatalogSectionProps) {
  return (
    <Col xs={24} xl={15} xxl={16}>
      <Card
        title={(
          <div className="tms-pos-catalog-head">
            <Space><AppstoreOutlined />Productos disponibles</Space>
            <div className="tms-pos-catalog-head-actions">
              <Input
                size="large"
                value={productSearch}
                onChange={(event) => onProductSearchChange(event.target.value)}
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Buscar por nombre o tipo de producto"
                className="tms-pos-catalog-search"
              />
              <Button size="large" icon={<ReloadOutlined />} onClick={onReload}></Button>
            </div>
          </div>
        )}
        className="tms-page-table-card tms-pos-catalog-card"
      >
        {loading ? (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div className="tms-pos-toolbar">
              <div className="tms-pos-toolbar-controls">
                <div className="tms-pos-filter-wrap">
                  <Skeleton.Button active block size="large" style={{ height: 44, borderRadius: 12 }} />
                </div>
              </div>
            </div>
            <Row gutter={[14, 14]}>
              {Array.from({ length: 9 }).map((_, index) => (
                <Col xs={24} md={12} lg={8} key={`skeleton-${index}`}>
                  <Card className="tms-pos-product-card" bordered={false}>
                    <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: '14px', marginBottom: '16px' }}>
                      <Skeleton.Avatar active shape="square" size={48} style={{ borderRadius: 14 }} />
                      <div style={{ display: 'grid', gap: '8px' }}>
                        <Skeleton.Input active size="small" style={{ width: '80%', height: 16 }} />
                        <Skeleton.Input active size="small" style={{ width: '40%', height: 14 }} />
                      </div>
                    </div>
                    <div className="tms-pos-product-footer">
                      <Skeleton.Input active size="small" style={{ width: '60px', height: 16 }} />
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Space>
        ) : (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div className="tms-pos-toolbar">
              <div className="tms-pos-toolbar-controls">
                <div className="tms-pos-filter-wrap">
                  <Segmented
                    size="large"
                    block
                    value={selectedFamily}
                    onChange={(value) => onFamilyChange(String(value))}
                    options={familyFilterOptions}
                    className="tms-pos-filter-segmented"
                  />
                </div>
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
