import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ROLES_ADMIN, ROLES_ADMIN_TOTAL, ROLES_VENTAS_OPERACION } from './constants/roles'
import AuthLayout from './layouts/AuthLayout'
import MainLayout from './layouts/MainLayout'
import PosLayout from './layouts/PosLayout'
import LoginPage from './pages/auth/LoginPage'
import EmpresasPage from './pages/administracion/EmpresasPage'
import ClientesPage from './pages/administracion/ClientesPage'
import UsuariosPage from './pages/administracion/UsuariosPage'
import ConfiguracionComercialPage from './pages/administracion/ConfiguracionComercialPage'
import ClasesPage from './pages/administracion/ClasesPage'
import PuntoVentaPage from './pages/ventas/PuntoVentaPage'
import VentasPage from './pages/ventas/VentasPage'
import AnulacionesPage from './pages/ventas/AnulacionesPage'
import AccesosPage from './pages/operacion/AccesosPage'
import OperacionClasesPage from './pages/operacion/ClasesPage'
import VentasReportPage from './pages/reportes/VentasReportPage'
import AccesosReportPage from './pages/reportes/AccesosReportPage'
import ClasesReportPage from './pages/reportes/ClasesReportPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/ventas/punto-venta" replace />} />
        <Route path="administracion/empresas" element={<ProtectedRoute roles={ROLES_ADMIN_TOTAL}><EmpresasPage /></ProtectedRoute>} />
        <Route path="administracion/clientes" element={<ProtectedRoute roles={ROLES_ADMIN}><ClientesPage /></ProtectedRoute>} />
        <Route path="administracion/usuarios" element={<ProtectedRoute roles={ROLES_ADMIN}><UsuariosPage /></ProtectedRoute>} />
        <Route path="administracion/comercial" element={<ProtectedRoute roles={ROLES_ADMIN}><ConfiguracionComercialPage /></ProtectedRoute>} />
        <Route path="administracion/clases" element={<ProtectedRoute roles={ROLES_ADMIN}><ClasesPage /></ProtectedRoute>} />
        <Route element={<ProtectedRoute roles={ROLES_VENTAS_OPERACION}><PosLayout /></ProtectedRoute>}>
          <Route path="ventas/punto-venta" element={<PuntoVentaPage />} />
        </Route>
        <Route path="ventas/ventas" element={<ProtectedRoute roles={ROLES_VENTAS_OPERACION}><VentasPage /></ProtectedRoute>} />
        <Route path="ventas/anulaciones" element={<ProtectedRoute roles={ROLES_VENTAS_OPERACION}><AnulacionesPage /></ProtectedRoute>} />
        <Route path="operacion/accesos" element={<ProtectedRoute roles={ROLES_VENTAS_OPERACION}><AccesosPage /></ProtectedRoute>} />
        <Route path="operacion/clases" element={<ProtectedRoute roles={ROLES_VENTAS_OPERACION}><OperacionClasesPage /></ProtectedRoute>} />
        <Route path="reportes/ventas" element={<ProtectedRoute roles={ROLES_ADMIN}><VentasReportPage /></ProtectedRoute>} />
        <Route path="reportes/accesos" element={<ProtectedRoute roles={ROLES_ADMIN}><AccesosReportPage /></ProtectedRoute>} />
        <Route path="reportes/clases" element={<ProtectedRoute roles={ROLES_ADMIN}><ClasesReportPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
