import {
  BarChartOutlined,
  CloseOutlined,
  CoffeeOutlined,
  LogoutOutlined,
  MenuOutlined,
  SettingOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Drawer, Dropdown, Grid, Layout, Menu, Select, Space, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ROLES_ADMIN, ROLES_ADMIN_TOTAL, ROLES_VENTAS_OPERACION } from '../constants/roles'
import { useAuth } from '../context/AuthContext'
import { useEmpresa } from '../context/EmpresaContext'
import { useHeaderContent } from '../context/HeaderContentContext'
import { toCapitalCase } from '../utils/formatPersonName'

const { Header, Content, Sider } = Layout
const { Text } = Typography
const { useBreakpoint } = Grid

export default function MainLayout() {
  const { user, logout, hasRole } = useAuth()
  const { empresas, empresaObjetivoId, setEmpresaObjetivoId, isAdminTotal } = useEmpresa()
  const { headerContent } = useHeaderContent()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const [collapsed, setCollapsed] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)

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
      ],
    },
    {
      key: 'operacion',
      label: 'Acceso',
      icon: <ToolOutlined />,
      children: [
        { key: '/operacion/accesos', label: 'Libre', roles: ROLES_VENTAS_OPERACION },
        { key: '/operacion/clases', label: 'Clases', roles: ROLES_VENTAS_OPERACION },
      ],
    },
    {
      key: 'administracion',
      label: 'Administracion',
      icon: <SettingOutlined />,
      children: [
        { key: '/administracion/clientes', label: 'Clientes', roles: ROLES_ADMIN },
        { key: '/administracion/usuarios', label: 'Usuarios', roles: ROLES_ADMIN },
        { key: '/administracion/comercial', label: 'Comercial', roles: ROLES_ADMIN },
        { key: '/administracion/clases', label: 'Clases Admin', roles: ROLES_ADMIN },
        { key: '/administracion/empresas', label: 'Empresas', roles: ROLES_ADMIN_TOTAL },
      ],
    },
    {
      key: 'reportes',
      label: 'Reportes',
      icon: <BarChartOutlined />,
      children: [
        { key: '/reportes/ventas', label: 'Ventas', roles: ROLES_ADMIN },
        { key: '/reportes/accesos', label: 'Accesos', roles: ROLES_ADMIN },
        { key: '/reportes/clases', label: 'Clases', roles: ROLES_ADMIN },
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
          .map((item) => ({ key: item.key, label: item.label })),
      }))
      .filter((group) => (group.children?.length ?? 0) > 0)
  }, [hasRole, menuConfig])

  const routeByKey = useMemo(() => {
    return menuConfig.flatMap((group) => group.children)
      .filter((item) => hasRole(...item.roles))
      .reduce<Record<string, string>>((map, item) => {
        map[item.key] = item.key
        return map
      }, {})
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

  useEffect(() => {
    if (!isMobile) {
      setDrawerVisible(false)
    }
  }, [isMobile])

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

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    const route = routeByKey[String(key)]
    if (route) {
      navigate(route)
    }
    if (isMobile) {
      setDrawerVisible(false)
    }
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: toCapitalCase(user?.FullName) || user?.Email,
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar sesión',
      danger: true,
      onClick: logout,
    },
  ]

  const menuContent = (
    <Menu
      theme="dark"
      mode="inline"
      style={{ background: 'var(--tms-sider-bg)' }}
      selectedKeys={selectedKey ? [selectedKey] : []}
      openKeys={openKeys}
      onOpenChange={handleOpenChange}
      items={items}
      onClick={handleMenuClick}
    />
  )

  const userDropdown = (
    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
      <Space style={{ cursor: 'pointer' }}>
        <Avatar style={{ backgroundColor: 'var(--tms-avatar-bg)' }} icon={<UserOutlined />} />
        {!isMobile && (
          <Text style={{ color: 'var(--tms-header-desktop-text)' }}>
            {toCapitalCase(user?.FullName) || user?.Email}
          </Text>
        )}
      </Space>
    </Dropdown>
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider
          className="tms-main-sider"
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="dark"
          style={{ background: 'var(--tms-sider-bg)' }}
        >
          <div className="tms-logo">
            <CoffeeOutlined style={{ fontSize: 22 }} />
            {!collapsed && <span>ERP Boulder</span>}
          </div>
          {menuContent}
        </Sider>
      )}

      <Layout>
        <Header
          style={{
            background: isMobile ? 'var(--tms-header-mobile-bg)' : 'var(--tms-header-desktop-bg)',
            color: isMobile ? 'var(--tms-header-mobile-text)' : 'var(--tms-header-desktop-text)',
            padding: isMobile ? '0 12px' : '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: isMobile ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
            gap: 12,
          }}
        >
          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 8 }}>
              <Button
                type="text"
                icon={drawerVisible ? <CloseOutlined /> : <MenuOutlined />}
                onClick={() => setDrawerVisible((value) => !value)}
                style={{ color: 'var(--tms-header-mobile-text)' }}
              />

              {headerContent ?? (
                <>
                  {isAdminTotal && (
                    <Select
                      style={{ flex: 1, minWidth: 140 }}
                      placeholder="Empresa objetivo"
                      value={empresaObjetivoId ?? undefined}
                      options={empresas.map((empresa) => ({ value: empresa.EmpresaId, label: empresa.NombreComercial }))}
                      onChange={(value) => {
                        setEmpresaObjetivoId(value)
                        navigate('/ventas/punto-venta')
                      }}
                    />
                  )}
                  {!isAdminTotal && <div style={{ flex: 1 }} />}
                </>
              )}

              {headerContent && isAdminTotal && (
                <Select
                  style={{ minWidth: 140 }}
                  placeholder="Empresa objetivo"
                  value={empresaObjetivoId ?? undefined}
                  options={empresas.map((empresa) => ({ value: empresa.EmpresaId, label: empresa.NombreComercial }))}
                  onChange={(value) => {
                    setEmpresaObjetivoId(value)
                    navigate('/ventas/punto-venta')
                  }}
                />
              )}

              {userDropdown}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                {headerContent ?? (
                  <Text strong style={{ fontSize: 16, color: 'var(--tms-header-desktop-text)' }}>
                    Centro de escalada
                  </Text>
                )}
                {isAdminTotal ? (
                  <Select
                    style={{ minWidth: 240 }}
                    placeholder="Empresa objetivo"
                    value={empresaObjetivoId ?? undefined}
                    options={empresas.map((empresa) => ({ value: empresa.EmpresaId, label: empresa.NombreComercial }))}
                    onChange={(value) => {
                      setEmpresaObjetivoId(value)
                      navigate('/ventas/punto-venta')
                    }}
                  />
                ) : (
                  <Text type="secondary">{user?.EmpresaNombre || 'Sin empresa'}</Text>
                )}
              </div>
              {userDropdown}
            </>
          )}
        </Header>

        <Content style={{ padding: isMobile ? '6px' : '16px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Outlet />
        </Content>
      </Layout>

      <Drawer
        placement="top"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        closable={false}
        styles={{
          wrapper: { height: 'calc(100vh - 64px)', marginTop: 64 },
          body: { padding: 0, background: 'var(--tms-drawer-bg)' },
        }}
      >
        {menuContent}
      </Drawer>
    </Layout>
  )
}
