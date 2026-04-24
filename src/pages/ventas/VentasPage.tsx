import { Card, Grid, Input, Modal, Space, Tabs, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnulacionesTab } from '../../components/ventas/AnulacionesTab'
import { VentasTab } from '../../components/ventas/VentasTab'
import { VentasToolbar } from '../../components/ventas/VentasToolbar'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { ventasService } from '../../services/ventas/ventasService'
import type { VentaDto, VentaResumenDto } from '../../types/models'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import styles from './VentasPage.module.css'

const { useBreakpoint } = Grid

type VentasTabKey = 'ventas' | 'anulaciones'
type VentaEstadoFiltro = 'emitida' | 'anulada'

const ESTADO_BY_TAB: Record<VentasTabKey, VentaEstadoFiltro> = {
  ventas: 'emitida',
  anulaciones: 'anulada',
}

const getActiveTabFromSearch = (searchParams: URLSearchParams): VentasTabKey =>
  searchParams.get('tab') === 'anulaciones' ? 'anulaciones' : 'ventas'

export default function VentasPage() {
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const [searchParams, setSearchParams] = useSearchParams()
  const [ventasItems, setVentasItems] = useState<VentaResumenDto[]>([])
  const [anulacionesItems, setAnulacionesItems] = useState<VentaResumenDto[]>([])
  const [loadingByTab, setLoadingByTab] = useState<Record<VentasTabKey, boolean>>({
    ventas: false,
    anulaciones: false,
  })
  const [loadedByTab, setLoadedByTab] = useState<Record<VentasTabKey, boolean>>({
    ventas: false,
    anulaciones: false,
  })
  const [ventaDetalleById, setVentaDetalleById] = useState<Record<number, VentaDto>>({})
  const [detalleLoadingById, setDetalleLoadingById] = useState<Record<number, boolean>>({})
  const [detalleErrorById, setDetalleErrorById] = useState<Record<number, string>>({})
  const [selectedSale, setSelectedSale] = useState<VentaResumenDto | null>(null)
  const [motivo, setMotivo] = useState('')

  const activeTab = getActiveTabFromSearch(searchParams)
  const activeLoading = loadingByTab[activeTab]

  const loadTab = async (tabKey: VentasTabKey, force = false) => {
    if (!force && loadedByTab[tabKey]) {
      return
    }

    setLoadingByTab((prev) => ({ ...prev, [tabKey]: true }))
    try {
      const items = await ventasService.getVentas(ESTADO_BY_TAB[tabKey])
      if (tabKey === 'ventas') {
        setVentasItems(items)
      } else {
        setAnulacionesItems(items)
      }
      setLoadedByTab((prev) => ({ ...prev, [tabKey]: true }))
    } finally {
      setLoadingByTab((prev) => ({ ...prev, [tabKey]: false }))
    }
  }

  useEffect(() => {
    void loadTab(activeTab)
  }, [activeTab])

  const loadDetalle = async (ventaId: number, force = false) => {
    if (detalleLoadingById[ventaId]) {
      return
    }

    if (!force && ventaDetalleById[ventaId]) {
      return
    }

    setDetalleLoadingById((prev) => ({ ...prev, [ventaId]: true }))
    setDetalleErrorById((prev) => {
      const next = { ...prev }
      delete next[ventaId]
      return next
    })

    try {
      const detalle = await ventasService.getVenta(ventaId)
      setVentaDetalleById((prev) => ({ ...prev, [ventaId]: detalle }))
    } catch (error) {
      setDetalleErrorById((prev) => ({
        ...prev,
        [ventaId]: getApiErrorMessage(error, 'No se pudo cargar el comprobante.'),
      }))
    } finally {
      setDetalleLoadingById((prev) => ({ ...prev, [ventaId]: false }))
    }
  }

  const handleTabChange = (tabKey: VentasTabKey) => {
    const nextSearchParams = new URLSearchParams(searchParams)

    if (tabKey === 'ventas') {
      nextSearchParams.delete('tab')
    } else {
      nextSearchParams.set('tab', tabKey)
    }

    setSearchParams(nextSearchParams, { replace: true })
  }

  const tabItems = useMemo(
    () => [
      {
        key: 'ventas',
        label: 'Ventas',
        children: (
          <VentasTab
            items={ventasItems}
            loading={loadingByTab.ventas}
            onAnularVenta={(venta) => setSelectedSale(venta)}
            ventaDetalleById={ventaDetalleById}
            detalleLoadingById={detalleLoadingById}
            detalleErrorById={detalleErrorById}
            onLoadDetalle={loadDetalle}
          />
        ),
      },
      {
        key: 'anulaciones',
        label: 'Anulaciones',
        children: (
          <AnulacionesTab
            items={anulacionesItems}
            loading={loadingByTab.anulaciones}
            ventaDetalleById={ventaDetalleById}
            detalleLoadingById={detalleLoadingById}
            detalleErrorById={detalleErrorById}
            onLoadDetalle={loadDetalle}
          />
        ),
      },
    ],
    [
      anulacionesItems,
      detalleErrorById,
      detalleLoadingById,
      loadingByTab.anulaciones,
      loadingByTab.ventas,
      ventaDetalleById,
      ventasItems,
    ],
  )

  return (
    <div className={styles.page}>
      <RequireCompanyAlert />
      <PageHeaderCard
        title="Ventas"
        subtitle="Historial operativo de ventas y anulaciones."
        mobileStandard={isMobile}
        actions={<VentasToolbar loading={activeLoading} onReload={() => void loadTab(activeTab, true)} />}
      />

      <Card className={styles.tableCard}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => handleTabChange(key as VentasTabKey)}
          items={tabItems}
        />
      </Card>

      <Modal
        open={!!selectedSale}
        title={`Anular venta ${selectedSale?.NumeroComprobante ?? ''}`}
        onCancel={() => { setSelectedSale(null); setMotivo('') }}
        onOk={async () => {
          if (!selectedSale) return
          await ventasService.anularVenta(selectedSale.VentaId, motivo)
          setSelectedSale(null)
          setMotivo('')
          setLoadedByTab({ ventas: false, anulaciones: false })
          setVentaDetalleById({})
          setDetalleErrorById({})
          setDetalleLoadingById({})
          await loadTab('ventas', true)
        }}
      >
        <Space orientation="vertical" className={styles.modalForm}>
          <Typography.Text>Motivo de anulación</Typography.Text>
          <Input.TextArea value={motivo} onChange={(event) => setMotivo(event.target.value)} rows={4} />
        </Space>
      </Modal>
    </div>
  )
}
