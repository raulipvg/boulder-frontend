import apiClient from '../apiClient'
import type { BloqueHorarioDto, ClaseDto, ClienteDto, EmpresaDto, LookupDto, ProductoDto, TarifaDto, TipoClienteDto, UsuarioDto } from '../../types/models'

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
  createProducto: async (payload: Record<string, unknown>) => (await apiClient.post<ProductoDto>('/administracion/productos', payload)).data,
  updateProducto: async (productoEmpresaId: number, payload: Record<string, unknown>) => (await apiClient.put<ProductoDto>(`/administracion/productos/${productoEmpresaId}`, payload)).data,
  getTarifas: async () => (await apiClient.get<TarifaDto[]>('/administracion/tarifas')).data,
  createTarifa: async (payload: Record<string, unknown>) => (await apiClient.post<TarifaDto>('/administracion/tarifas', payload)).data,
  updateTarifa: async (tarifaProductoId: number, payload: Record<string, unknown>) => (await apiClient.put<TarifaDto>(`/administracion/tarifas/${tarifaProductoId}`, payload)).data,
  getClases: async () => (await apiClient.get<ClaseDto[]>('/administracion/clases')).data,
  createClase: async (payload: Record<string, unknown>) => (await apiClient.post<ClaseDto>('/administracion/clases', payload)).data,
  updateClase: async (claseId: number, payload: Record<string, unknown>) => (await apiClient.put<ClaseDto>(`/administracion/clases/${claseId}`, payload)).data,
  getTiposProductoBase: async () => (await apiClient.get<LookupDto[]>('/administracion/catalogos/tipos-producto-base')).data,
  getMediosPago: async () => (await apiClient.get<LookupDto[]>('/administracion/catalogos/medios-pago')).data,
  getBloques: async () => (await apiClient.get<LookupDto[]>('/administracion/catalogos/bloques')).data,
  getProfesores: async () => (await apiClient.get<LookupDto[]>('/administracion/catalogos/profesores')).data,
  getBloquesHorarios: async () => (await apiClient.get<BloqueHorarioDto[]>('/administracion/bloques-horarios')).data,
  createBloqueHorario: async (payload: Record<string, unknown>) => (await apiClient.post<BloqueHorarioDto>('/administracion/bloques-horarios', payload)).data,
  updateBloqueHorario: async (id: number, payload: Record<string, unknown>) => (await apiClient.put<BloqueHorarioDto>(`/administracion/bloques-horarios/${id}`, payload)).data,
}

