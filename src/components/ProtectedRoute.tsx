import { Navigate } from 'react-router-dom'
import type { PropsWithChildren } from 'react'
import { Result, Spin } from 'antd'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps extends PropsWithChildren {
  roles?: string[]
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth()

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles?.length && !hasRole(...roles)) {
    return <Result status="403" title="403" subTitle="No tienes permisos para acceder a esta sección." />
  }

  return <>{children}</>
}
