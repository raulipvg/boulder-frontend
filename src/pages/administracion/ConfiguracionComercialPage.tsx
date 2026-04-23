import { ClockCircleOutlined, DollarOutlined, ShoppingOutlined } from '@ant-design/icons'
import { Card, Grid, Segmented, Tabs } from 'antd'
import { useMemo, useRef, useState } from 'react'
import BloquesHorariosTab, { type BloquesHorariosTabHandle } from '../../components/administracion/comercial/BloquesHorariosTab'
import {
  ComercialToolbar,
  type ComercialTabKey,
} from '../../components/administracion/comercial/ComercialToolbar'
import ProductosTab, { type ProductosTabHandle } from '../../components/administracion/comercial/ProductosTab'
import TarifasTab, {
  type ClienteFiltro,
  type TarifasTabHandle,
} from '../../components/administracion/comercial/TarifasTab'
import { PageFiltersCard } from '../../components/shared/PageFiltersCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'

const { useBreakpoint } = Grid

export default function ConfiguracionComercialPage() {
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const [activeTab, setActiveTab] = useState<ComercialTabKey>('productos')
  const [clienteFiltro, setClienteFiltro] = useState<ClienteFiltro>('GENERAL')

  const productosRef = useRef<ProductosTabHandle>(null)
  const tarifasRef = useRef<TarifasTabHandle>(null)
  const bloquesRef = useRef<BloquesHorariosTabHandle>(null)

  const handleReload = () => {
    if (activeTab === 'productos') {
      void productosRef.current?.reload()
      return
    }

    if (activeTab === 'tarifas') {
      void tarifasRef.current?.reload()
      return
    }

    void bloquesRef.current?.reload()
  }

  const handleCreate = () => {
    if (activeTab === 'productos') {
      productosRef.current?.openCreate()
      return
    }

    if (activeTab === 'tarifas') {
      tarifasRef.current?.openCreate()
      return
    }

    bloquesRef.current?.openCreate()
  }

  const toolbar = (
    <ComercialToolbar
      activeTab={activeTab}
      clienteFiltro={clienteFiltro}
      onClienteFiltroChange={setClienteFiltro}
      onReload={handleReload}
      onCreate={handleCreate}
      showClienteFiltro={!(isMobile && activeTab === 'tarifas')}
    />
  )

  const tabItems = useMemo(
    () => [
      {
        key: 'productos',
        label: (
          <span>
            <ShoppingOutlined /> Productos
          </span>
        ),
        children: <ProductosTab ref={productosRef} />,
      },
      {
        key: 'tarifas',
        label: (
          <span>
            <DollarOutlined /> Tarifas
          </span>
        ),
        children: <TarifasTab ref={tarifasRef} clienteFiltro={clienteFiltro} />,
      },
      {
        key: 'bloques',
        label: (
          <span>
            <ClockCircleOutlined /> Bloques
          </span>
        ),
        children: <BloquesHorariosTab ref={bloquesRef} />,
      },
    ],
    [clienteFiltro],
  )

  return (
    <div className="tms-page">
      <RequireCompanyAlert />

      <PageHeaderCard
        title="Comercial"
        subtitle="Administra productos, tarifas y bloques horarios de tu empresa."
        mobileStandard={isMobile}
        actions={toolbar}
      />

      {isMobile && activeTab === 'tarifas' ? (
        <PageFiltersCard>
          <Segmented
            block
            value={clienteFiltro}
            onChange={(value) => setClienteFiltro(value as ClienteFiltro)}
            options={[
              { label: 'General', value: 'GENERAL' },
              { label: 'Estudiante', value: 'ESTUDIANTE' },
            ]}
          />
        </PageFiltersCard>
      ) : null}

      <Card
        className="tms-page-table-card"
        variant="borderless"
        styles={{ body: { padding: isMobile ? '12px' : '8px 12px' } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as ComercialTabKey)}
          items={tabItems}
        />
      </Card>
    </div>
  )
}
