import { Alert } from 'antd'
import { useAuth } from '../../context/AuthContext'
import { useEmpresa } from '../../context/EmpresaContext'

export function RequireCompanyAlert() {
  const { user } = useAuth()
  const { empresaObjetivoId, isAdminTotal } = useEmpresa()

  if (!isAdminTotal) {
    return null
  }

  if (empresaObjetivoId) {
    return null
  }

  return (
    <Alert
      showIcon
      type="warning"
      message="Selecciona una empresa objetivo"
      description={`El usuario ${user?.FullName ?? ''} es ADMIN_TOTAL y debe elegir una empresa antes de operar en módulos empresariales.`}
      style={{ marginBottom: 16 }}
    />
  )
}
