import apiClient from '../apiClient'
import type { BloqueHorarioDto, ClaseAgendaDto, ClaseDto, ClienteDto, EmpresaDto, IdNombreDto, LookupDto, ProductoDto, TarifaDto, TarifaProductoResumenDto, TipoClienteDto, UsuarioDto } from '../../types/models'
import { getAdminTargetCompanyKey, getStoredAuth } from '../../utils/storage'

const tiposClienteCatalogoByScope = new Map<string, LookupDto[]>()
const tiposClienteCatalogoInFlightByScope = new Map<string, Promise<LookupDto[]>>()
const bloquesCatalogoLiteByScope = new Map<string, IdNombreDto[]>()
const bloquesCatalogoLiteInFlightByScope = new Map<string, Promise<IdNombreDto[]>>()

const resolveEmpresaScopeKey = () => {
  const auth = getStoredAuth()
  const user = auth?.User
  if (!user) {
    return 'anonymous'
  }

  if (user.RoleCodes?.includes('ADMIN_TOTAL')) {
    const targetKey = getAdminTargetCompanyKey(user.UserId)
    const targetCompanyId = localStorage.getItem(targetKey) ?? 'none'
    return `admin-total:${user.UserId}:${targetCompanyId}`
  }

  return `empresa:${user.EmpresaId ?? 'none'}`
}

const getTiposClienteCatalogoCached = async () => {
  const scopeKey = resolveEmpresaScopeKey()

  const cached = tiposClienteCatalogoByScope.get(scopeKey)
  if (cached) {
    return cached
  }

  const inFlight = tiposClienteCatalogoInFlightByScope.get(scopeKey)
  if (inFlight) {
    return inFlight
  }

  const request = apiClient.get<LookupDto[]>('/administracion/catalogos/tipos-cliente')
    .then((response) => {
      tiposClienteCatalogoByScope.set(scopeKey, response.data)
      return response.data
    })
    .finally(() => {
      tiposClienteCatalogoInFlightByScope.delete(scopeKey)
    })

  tiposClienteCatalogoInFlightByScope.set(scopeKey, request)
  return request
}

const getBloquesCatalogoLiteCached = async () => {
  const scopeKey = resolveEmpresaScopeKey()

  const cached = bloquesCatalogoLiteByScope.get(scopeKey)
  if (cached) {
    return cached
  }

  const inFlight = bloquesCatalogoLiteInFlightByScope.get(scopeKey)
  if (inFlight) {
    return inFlight
  }

  const request = apiClient.get<IdNombreDto[]>('/administracion/catalogos/bloques-lite')
    .then((response) => {
      bloquesCatalogoLiteByScope.set(scopeKey, response.data)
      return response.data
    })
    .finally(() => {
      bloquesCatalogoLiteInFlightByScope.delete(scopeKey)
    })

  bloquesCatalogoLiteInFlightByScope.set(scopeKey, request)
  return request
}

const invalidateComercialCatalogosByScope = () => {
  const scopeKey = resolveEmpresaScopeKey()
  tiposClienteCatalogoByScope.delete(scopeKey)
  tiposClienteCatalogoInFlightByScope.delete(scopeKey)
  bloquesCatalogoLiteByScope.delete(scopeKey)
  bloquesCatalogoLiteInFlightByScope.delete(scopeKey)
}

export const administracionService = {
  getEmpresas: async () => (await apiClient.get<EmpresaDto[]>('/administracion/empresas')).data,
  createEmpresa: async (payload: Record<string, unknown>) => (await apiClient.post<EmpresaDto>('/administracion/empresas', payload)).data,
  updateEmpresa: async (empresaId: number, payload: Record<string, unknown>) => (await apiClient.put<EmpresaDto>(`/administracion/empresas/${empresaId}`, payload)).data,
  getUsuarios: async () => (await apiClient.get<UsuarioDto[]>('/administracion/usuarios')).data,
  createUsuario: async (payload: Record<string, unknown>) => (await apiClient.post<UsuarioDto>('/administracion/usuarios', payload)).data,
  updateUsuario: async (usuarioId: number, payload: Record<string, unknown>) => (await apiClient.put<UsuarioDto>(`/administracion/usuarios/${usuarioId}`, payload)).data,
  changePasswordUsuario: async (usuarioId: number, payload: Record<string, unknown>) => (await apiClient.put(`/administracion/usuarios/${usuarioId}/password`, payload)).data,
  getTiposCliente: async () => (await apiClient.get<TipoClienteDto[]>('/administracion/tipos-cliente')).data,
  createTipoCliente: async (payload: Record<string, unknown>) => (await apiClient.post<TipoClienteDto>('/administracion/tipos-cliente', payload)).data,
  getClientes: async (search = '') => {
    const normalizedSearch = search.trim().toLowerCase()
    return (await apiClient.get<ClienteDto[]>('/administracion/clientes', { params: { search: normalizedSearch } })).data
  },
  createCliente: async (payload: Record<string, unknown>) => (await apiClient.post<ClienteDto>('/administracion/clientes', payload)).data,
  updateCliente: async (clienteEmpresaId: number, payload: Record<string, unknown>) => (await apiClient.put<ClienteDto>(`/administracion/clientes/${clienteEmpresaId}`, payload)).data,
  getProductos: async () => (await apiClient.get<ProductoDto[]>('/administracion/productos')).data,
  getProductosCatalogo: async () => (await apiClient.get<IdNombreDto[]>('/administracion/catalogos/productos')).data,
  getTiposClienteCatalogo: async () => getTiposClienteCatalogoCached(),
  getBloquesCatalogoLite: async () => getBloquesCatalogoLiteCached(),
  invalidateComercialCatalogos: () => invalidateComercialCatalogosByScope(),
  getTarifasByProducto: async (productoEmpresaId: number) =>
    (await apiClient.get<TarifaProductoResumenDto[]>(`/administracion/productos/${productoEmpresaId}/tarifas`)).data,
  createProducto: async (payload: Record<string, unknown>) => (await apiClient.post<ProductoDto>('/administracion/productos', payload)).data,
  updateProducto: async (productoEmpresaId: number, payload: Record<string, unknown>) => (await apiClient.put<ProductoDto>(`/administracion/productos/${productoEmpresaId}`, payload)).data,
  getTarifas: async (tipoClienteCodigo: 'GENERAL' | 'ESTUDIANTE' = 'GENERAL') => (await apiClient.get<TarifaDto[]>('/administracion/tarifas', { params: { tipoClienteCodigo } })).data,
  createTarifa: async (payload: Record<string, unknown>) => (await apiClient.post<TarifaDto>('/administracion/tarifas', payload)).data,
  createTarifasBatch: async (payload: Record<string, unknown>) => (await apiClient.post<TarifaDto[]>('/administracion/tarifas/batch', payload)).data,
  updateTarifa: async (tarifaProductoId: number, payload: Record<string, unknown>) => (await apiClient.put<TarifaDto>(`/administracion/tarifas/${tarifaProductoId}`, payload)).data,
  getClases: async (activo?: boolean) => (await apiClient.get<ClaseAgendaDto[]>('/administracion/clases', { params: activo === undefined ? undefined : { activo } })).data,
  getClaseById: async (claseId: number) => (await apiClient.get<ClaseDto>(`/administracion/clases/${claseId}`)).data,
  createClase: async (payload: Record<string, unknown>) => (await apiClient.post<ClaseDto>('/administracion/clases', payload)).data,
  updateClase: async (claseId: number, payload: Record<string, unknown>) => (await apiClient.put<ClaseDto>(`/administracion/clases/${claseId}`, payload)).data,
  getTiposProductoBase: async () => (await apiClient.get<LookupDto[]>('/administracion/catalogos/tipos-producto-base')).data,
  getMediosPago: async () => (await apiClient.get<LookupDto[]>('/administracion/catalogos/medios-pago')).data,
  getBloques: async () => (await apiClient.get<LookupDto[]>('/administracion/catalogos/bloques')).data,
  getProfesores: async () => (await apiClient.get<IdNombreDto[]>('/administracion/catalogos/profesores')).data,
  getBloquesHorarios: async () => (await apiClient.get<BloqueHorarioDto[]>('/administracion/bloques-horarios')).data,
  createBloqueHorario: async (payload: Record<string, unknown>) => (await apiClient.post<BloqueHorarioDto>('/administracion/bloques-horarios', payload)).data,
  updateBloqueHorario: async (id: number, payload: Record<string, unknown>) => (await apiClient.put<BloqueHorarioDto>(`/administracion/bloques-horarios/${id}`, payload)).data,
}
