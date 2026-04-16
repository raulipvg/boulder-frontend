import apiClient from '../apiClient'
import type { AccessPreviewDto, AccessValidationResultDto, ClaseAsistenciaDto, ClaseSesionDto, ClienteLookupDto } from '../../types/models'

export const operacionService = {
  buscarClientes: async (search = '') => {
    const normalizedSearch = search.trim().toLowerCase()
    return (await apiClient.get<ClienteLookupDto[]>('/operacion/accesos/clientes', { params: { search: normalizedSearch } })).data
  },
  previewAcceso: async (clienteEmpresaId: number) => (await apiClient.get<AccessPreviewDto>(`/operacion/accesos/preview/${clienteEmpresaId}`)).data,
  validarAcceso: async (payload: { ClienteEmpresaId: number; BeneficioClienteId: number }) => (await apiClient.post<AccessValidationResultDto>('/operacion/accesos/validar', payload)).data,
  getSesiones: async (fecha?: string) => (await apiClient.get<ClaseSesionDto[]>('/operacion/clases/sesiones', { params: { fecha } })).data,
  registrarAsistencia: async (payload: { ClaseSesionId: number; ClienteEmpresaId: number; BeneficioClienteId: number }) => (await apiClient.post<ClaseAsistenciaDto>('/operacion/clases/asistencias', payload)).data,
}
