import type { AccessOptionDto, ClienteLookupDto } from '../../../types/models'
import { toCapitalCase } from '../../../utils/formatPersonName'

type AccessOptionState = {
  color: string
  label: string
}

export const formatShortDate = (dateString: string) => {
  if (!dateString) {
    return ''
  }

  const parts = dateString.split('T')[0].split('-')
  if (parts.length !== 3) {
    return dateString
  }

  return `${parts[2]}-${parts[1]}-${parts[0].substring(2)}`
}

export const getOptionState = (option: AccessOptionDto): AccessOptionState => {
  if (option.PuedeValidarAhora) {
    return { color: 'green', label: 'Disponible Ahora' }
  }

  if (option.YaValidadoHoy) {
    return { color: 'blue', label: 'Validado Hoy' }
  }

  if (!option.DentroBloqueHorario) {
    return { color: 'gold', label: 'Fuera de Horario' }
  }

  return { color: 'default', label: 'No Disponible' }
}

export const formatClienteLabel = (cliente: ClienteLookupDto) => `${toCapitalCase(cliente.NombreCompleto)} (${cliente.Rut})`
