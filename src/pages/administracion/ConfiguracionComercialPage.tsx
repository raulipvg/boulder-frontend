import { ClockCircleOutlined, DollarOutlined, ShoppingOutlined } from '@ant-design/icons'
import { Card, Tabs } from 'antd'
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
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'

export default function ConfiguracionComercialPage() {
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
        title="Configuracion comercial"
        subtitle="Administra productos, tarifas y bloques horarios de tu empresa."
        actions={toolbar}
      />

      <Card
        className="tms-page-table-card"
        variant="borderless"
        styles={{ body: { paddingTop: 8, paddingBottom: 8 } }}
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
