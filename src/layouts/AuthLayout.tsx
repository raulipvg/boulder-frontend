import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--tms-login-bg)' }}>
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <Outlet />
      </div>
    </Layout>
  )
}
