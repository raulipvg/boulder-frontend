import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Grid, Segmented, Space } from 'antd'
import type { ClienteFiltro } from './TarifasTab'

export type ComercialTabKey = 'productos' | 'tarifas' | 'bloques'

interface ComercialToolbarProps {
  activeTab: ComercialTabKey
  clienteFiltro: ClienteFiltro
  onClienteFiltroChange: (value: ClienteFiltro) => void
  onReload: () => void
  onCreate: () => void
  showClienteFiltro?: boolean
}

const { useBreakpoint } = Grid

export function ComercialToolbar({
  activeTab,
  clienteFiltro,
  onClienteFiltroChange,
  onReload,
  onCreate,
  showClienteFiltro = true,
}: ComercialToolbarProps) {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const isTabletOrSmaller = !screens.lg
  const spacing = isMobile ? ('small' as const) : ('middle' as const)
  const allowWrap = !isMobile

  if (activeTab === 'tarifas') {
    return (
      <Space wrap={allowWrap} size={spacing}>
        {showClienteFiltro ? (
          <Segmented
            value={clienteFiltro}
            onChange={(value) => onClienteFiltroChange(value as ClienteFiltro)}
            options={[
              { label: 'General', value: 'GENERAL' },
              { label: 'Estudiante', value: 'ESTUDIANTE' },
            ]}
          />
        ) : null}
        <Button icon={<ReloadOutlined />} onClick={onReload} />
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          {!isTabletOrSmaller && 'Nueva tarifa'}
        </Button>
      </Space>
    )
  }

  if (activeTab === 'bloques') {
    return (
      <Space wrap={allowWrap} size={spacing}>
        <Button icon={<ReloadOutlined />} onClick={onReload} />
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          {!isTabletOrSmaller && 'Nuevo bloque'}
        </Button>
      </Space>
    )
  }

  return (
    <Space wrap={allowWrap} size={spacing}>
      <Button icon={<ReloadOutlined />} onClick={onReload} />
      <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
        {!isTabletOrSmaller && 'Nuevo producto'}
      </Button>
    </Space>
  )
}
