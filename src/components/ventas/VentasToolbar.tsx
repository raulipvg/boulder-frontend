import { ReloadOutlined } from '@ant-design/icons'
import { Button, Space } from 'antd'

interface VentasToolbarProps {
  loading: boolean
  onReload: () => void
}

export function VentasToolbar({ loading, onReload }: VentasToolbarProps) {
  return (
    <Space wrap>
      <Button icon={<ReloadOutlined />} onClick={onReload} loading={loading} />
    </Space>
  )
}
