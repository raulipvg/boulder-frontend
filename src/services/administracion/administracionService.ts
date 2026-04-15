import apiClient from '../apiClient'
import type { ClaseDto, ClienteDto, EmpresaDto, LookupDto, ProductoDto, TarifaDto, TipoClienteDto, UsuarioDto } from '../../types/models'

export const administracionService = {
  getEmpresas: async () => (await apiClient.get<EmpresaDto[]>('/administracion/empresas')).data,
  createEmpresa: async (payload: Record<string, unknown>) => (await apiClient.post<EmpresaDto>('/administracion/empresas', payload)).data,
  getUsuarios: async () => (await apiClient.get<UsuarioDto[]>('/administracion/usuarios')).data,
  createUsuario: async (payload: Record<string, unknown>) => (await apiClient.post<UsuarioDto>('/administracion/usuarios', payload)).data,
  getTiposCliente: async () => (await apiClient.get<TipoClienteDto[]>('/administracion/tipos-cliente')).data,
  createTipoCliente: async (payload: Record<string, unknown>) => (await apiClient.post<TipoClienteDto>('/administracion/tipos-cliente', payload)).data,
  getClientes: async (search = '') => (await apiClient.get<ClienteDto[]>('/administracion/clientes', { params: { search } })).data,
  createCliente: async (payload: Record<string, unknown>) => (await apiClient.post<ClienteDto>('/administracion/clientes', payload)).data,
  getProductos: async () => (await apiClient.get<ProductoDto[]>('/administracion/productos')).data,
  createProducto: async (payload: Record<string, unknown>) => (await apiClient.post<ProductoDto>('/administracion/productos', payload)).data,
  getTarifas: async () => (await apiClient.get<TarifaDto[]>('/administracion/tarifas')).data,
  createTarifa: async (payload: Record<string, unknown>) => (await apiClient.post<TarifaDto>('/administracion/tarifas', payload)).data,
  getClases: async () => (await apiClient.get<ClaseDto[]>('/administracion/clases')).data,
  createClase: async (payload: Record<string, unknown>) => (await apiClient.post<ClaseDto>('/administracion/clases', payload)).data,
  getTiposProductoBase: async () => (await apiClient.get<LookupDto[]>('/administracion/catalogos/tipos-producto-base')).data,
  getMediosPago: async () => (await apiClient.get<LookupDto[]>('/administracion/catalogos/medios-pago')).data,
  getBloques: async () => (await apiClient.get<LookupDto[]>('/administracion/catalogos/bloques')).data,
  getProfesores: async () => (await apiClient.get<LookupDto[]>('/administracion/catalogos/profesores')).data,
}
