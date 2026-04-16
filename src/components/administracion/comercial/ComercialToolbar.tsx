import { PlusOutlined, SyncOutlined } from '@ant-design/icons'
import { Button, Grid, Segmented, Space } from 'antd'
import type { ClienteFiltro } from './TarifasTab'

export type ComercialTabKey = 'productos' | 'tarifas' | 'bloques'

interface ComercialToolbarProps {
  activeTab: ComercialTabKey
  clienteFiltro: ClienteFiltro
  onClienteFiltroChange: (value: ClienteFiltro) => void
  onReload: () => void
  onCreate: () => void
}

const { useBreakpoint } = Grid

export function ComercialToolbar({
  activeTab,
  clienteFiltro,
  onClienteFiltroChange,
  onReload,
  onCreate,
}: ComercialToolbarProps) {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const isTabletOrSmaller = !screens.lg
  const spacing = isMobile ? ('small' as const) : ('middle' as const)

  if (activeTab === 'tarifas') {
    return (
      <Space wrap size={spacing}>
        <Segmented
          value={clienteFiltro}
          onChange={(value) => onClienteFiltroChange(value as ClienteFiltro)}
          options={[
            { label: 'General', value: 'GENERAL' },
            { label: 'Estudiante', value: 'ESTUDIANTE' },
          ]}
        />
        <Button icon={<SyncOutlined />} onClick={onReload} />
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          {!isTabletOrSmaller && 'Nueva tarifa'}
        </Button>
      </Space>
    )
  }

  if (activeTab === 'bloques') {
    return (
      <Space wrap size={spacing}>
        <Button icon={<SyncOutlined />} onClick={onReload} />
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          {!isTabletOrSmaller && 'Nuevo bloque'}
        </Button>
      </Space>
    )
  }

  return (
    <Space wrap size={spacing}>
      <Button icon={<SyncOutlined />} onClick={onReload} />
      <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
        {!isTabletOrSmaller && 'Nuevo producto'}
      </Button>
    </Space>
  )
}
