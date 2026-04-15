import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { administracionService } from '../services/administracion/administracionService'
import type { EmpresaDto } from '../types/models'
import { getAdminTargetCompanyKey } from '../utils/storage'
import { useAuth } from './AuthContext'

interface EmpresaContextValue {
  empresas: EmpresaDto[]
  empresaObjetivoId: number | null
  setEmpresaObjetivoId: (empresaId: number | null) => void
  isAdminTotal: boolean
}

const EmpresaContext = createContext<EmpresaContextValue | null>(null)

export function EmpresaProvider({ children }: PropsWithChildren) {
  const { user } = useAuth()
  const [empresas, setEmpresas] = useState<EmpresaDto[]>([])
  const [empresaObjetivoId, setEmpresaObjetivoIdState] = useState<number | null>(null)
  const isAdminTotal = !!user?.RoleCodes?.includes('ADMIN_TOTAL')

  useEffect(() => {
    const load = async () => {
      if (!user?.UserId) {
        setEmpresas([])
        setEmpresaObjetivoIdState(null)
        return
      }

      if (!isAdminTotal) {
        setEmpresas([])
        setEmpresaObjetivoIdState(user.EmpresaId ?? null)
        return
      }

      const items = await administracionService.getEmpresas()
      setEmpresas(items)
      const key = getAdminTargetCompanyKey(user.UserId)
      const stored = localStorage.getItem(key)
      const defaultEmpresaId = stored ? Number(stored) : items[0]?.EmpresaId ?? null
      if (!stored && defaultEmpresaId) {
        localStorage.setItem(key, String(defaultEmpresaId))
      }
      setEmpresaObjetivoIdState(defaultEmpresaId)
    }

    void load()
  }, [isAdminTotal, user])

  const value = useMemo<EmpresaContextValue>(() => ({
    empresas,
    empresaObjetivoId,
    setEmpresaObjetivoId: (empresaId) => {
      setEmpresaObjetivoIdState(empresaId)
      if (user?.UserId && isAdminTotal) {
        const key = getAdminTargetCompanyKey(user.UserId)
        if (empresaId) {
          localStorage.setItem(key, String(empresaId))
        } else {
          localStorage.removeItem(key)
        }
      }
    },
    isAdminTotal,
  }), [empresas, empresaObjetivoId, isAdminTotal, user])

  return <EmpresaContext.Provider value={value}>{children}</EmpresaContext.Provider>
}

export function useEmpresa() {
  const context = useContext(EmpresaContext)
  if (!context) throw new Error('useEmpresa debe usarse dentro de EmpresaProvider')
  return context
}
