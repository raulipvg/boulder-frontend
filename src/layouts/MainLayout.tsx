import { BarChartOutlined, CoffeeOutlined, SettingOutlined, ToolOutlined } from '@ant-design/icons'
import { Button, Layout, Menu, Select, Space, Tag, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ROLES_ADMIN, ROLES_ADMIN_TOTAL, ROLES_VENTAS_OPERACION } from '../constants/roles'
import { useAuth } from '../context/AuthContext'
import { useEmpresa } from '../context/EmpresaContext'
import { toCapitalCase } from '../utils/formatPersonName'

const { Header, Content, Sider } = Layout

export default function MainLayout() {
  const { user, logout, hasRole } = useAuth()
  const { empresas, empresaObjetivoId, setEmpresaObjetivoId, isAdminTotal } = useEmpresa()
  const location = useLocation()
  const navigate = useNavigate()

  const menuConfig = useMemo(() => [
    {
      key: 'ventas',
      label: 'Ventas',
      icon: <CoffeeOutlined />,
      children: [
        { key: '/ventas/punto-venta', label: 'Punto de venta', roles: ROLES_VENTAS_OPERACION },
        { key: '/ventas/ventas', label: 'Ventas', roles: ROLES_VENTAS_OPERACION },
        { key: '/ventas/anulaciones', label: 'Anulaciones', roles: ROLES_VENTAS_OPERACION },
      ],
    },
    {
      key: 'operacion',
      label: 'Operacion',
      icon: <ToolOutlined />,
      children: [
        { key: '/operacion/accesos', label: 'Accesos', roles: ROLES_VENTAS_OPERACION },
        { key: '/operacion/clases', label: 'Clases', roles: ROLES_VENTAS_OPERACION },
        { key: '/operacion/asistencias', label: 'Asistencias', roles: ROLES_VENTAS_OPERACION },
      ],
    },
    {
      key: 'administracion',
      label: 'Administracion',
      icon: <SettingOutlined />,
      children: [
        { key: '/administracion/clientes', label: 'Clientes', roles: ROLES_ADMIN },
        { key: '/administracion/usuarios', label: 'Usuarios', roles: ROLES_ADMIN },
        { key: '/administracion/comercial', label: 'Productos y tarifas', roles: ROLES_ADMIN },
        { key: '/administracion/clases', label: 'Clases Admin', roles: ROLES_ADMIN },
        { key: '/administracion/empresas', label: 'Empresas', roles: ROLES_ADMIN_TOTAL },
      ],
    },
    {
      key: 'reportes',
      label: 'Reportes',
      icon: <BarChartOutlined />,
      children: [
        { key: '/reportes/ventas', label: 'Reportes de ventas', roles: ROLES_ADMIN },
        { key: '/reportes/accesos', label: 'Reportes de accesos', roles: ROLES_ADMIN },
        { key: '/reportes/clases', label: 'Reportes de clases', roles: ROLES_ADMIN },
      ],
    },
  ], [])

  const items = useMemo<MenuProps['items']>(() => {
    return menuConfig
      .map((group) => ({
        key: group.key,
        icon: group.icon,
        label: group.label,
        children: group.children
          .filter((item) => hasRole(...item.roles))
          .map((item) => ({ key: item.key, label: <Link to={item.key}>{item.label}</Link> })),
      }))
      .filter((group) => (group.children?.length ?? 0) > 0)
  }, [hasRole, menuConfig])

  const selectedKey = useMemo(() => {
    const entries = menuConfig.flatMap((group) => group.children)
    return entries.find((item) => location.pathname.startsWith(item.key) && hasRole(...item.roles))?.key
  }, [hasRole, location.pathname, menuConfig])

  const openKey = useMemo(() => {
    const group = menuConfig.find((entry) => entry.children.some((item) => location.pathname.startsWith(item.key) && hasRole(...item.roles)))
    return group?.key
  }, [hasRole, location.pathname, menuConfig])

  const menuGroupKeys = useMemo(() => items?.map((group) => String(group?.key)) ?? [], [items])
  const [openKeys, setOpenKeys] = useState<string[]>(openKey ? [openKey] : [])

  useEffect(() => {
    setOpenKeys(openKey ? [openKey] : [])
  }, [openKey])

  const handleOpenChange: MenuProps['onOpenChange'] = (nextOpenKeys) => {
    const latestOpenKey = nextOpenKeys.find((key) => !openKeys.includes(key))

    if (!latestOpenKey) {
      setOpenKeys([])
      return
    }

    if (menuGroupKeys.includes(latestOpenKey)) {
      setOpenKeys([latestOpenKey])
      return
    }

    setOpenKeys(nextOpenKeys)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={260} theme="light" breakpoint="lg" collapsedWidth="0">
        <div style={{ padding: 20 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>ERP Boulder</Typography.Title>
          <Typography.Text type="secondary">Centro de escalada</Typography.Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKey ? [selectedKey] : []}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          items={items}
        />
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Typography.Text strong>{toCapitalCase(user?.FullName)}</Typography.Text>
            {user?.EmpresaNombre && <Tag color="blue">{user.EmpresaNombre}</Tag>}
            {isAdminTotal && (
              <Select
                style={{ width: 240 }}
                placeholder="Empresa objetivo"
                value={empresaObjetivoId ?? undefined}
                options={empresas.map((empresa) => ({ value: empresa.EmpresaId, label: empresa.NombreComercial }))}
                onChange={(value) => {
                  setEmpresaObjetivoId(value)
                  navigate('/ventas/punto-venta')
                }}
              />
            )}
          </Space>
          <Button onClick={logout}>Cerrar sesión</Button>
        </Header>

        <Content style={{ padding: 20 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
