import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0b5fff 0%, #2e8fff 45%, #ecf5ff 100%)' }}>
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <Outlet />
      </div>
    </Layout>
  )
}
