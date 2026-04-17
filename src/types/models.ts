export interface AuthUser {
  UserId: number
  FullName: string
  Email: string
  RoleCodes: string[]
  EmpresaId?: number | null
  EmpresaNombre?: string | null
}

export interface AuthResponse {
  AccessToken: string
  RefreshToken: string
  User: AuthUser
}

export interface LookupDto {
  Id: number
  Codigo: string
  Nombre: string
}

export interface IdNombreDto {
  Id: number
  Nombre: string
}

export interface BloqueHorarioDto {
  BloqueHorarioComercialId: number
  Nombre: string
  HoraInicio: string
  HoraFin: string
  Activo: boolean
}

export interface EmpresaDto {
  EmpresaId: number
  NombreComercial: string
  RazonSocial?: string | null
  Rut: string
  Estado: string
  MonedaCodigo: string
  TelefonoContacto?: string | null
  CorreoContacto?: string | null
}

export interface UsuarioDto {
  UsuarioId: number
  NombreCompleto: string
  Rut: string
  EmailLogin: string
  Estado: string
  Roles: string[]
  EmpresaId?: number | null
  EmpresaNombre?: string | null
}

export interface TipoClienteDto {
  TipoClienteId: number
  Codigo: string
  Nombre: string
  Activo: boolean
}

export interface ClienteDto {
  ClienteEmpresaId: number
  PersonaId: number
  NombreCompleto: string
  Rut: string
  FechaNacimiento?: string | null
  Correo?: string | null
  Telefono?: string | null
  TipoClienteId: number
  TipoCliente: string
  Estado: string
}

export interface ProductoDto {
  ProductoEmpresaId: number
  NombreComercial: string
  Descripcion?: string | null
  TipoProductoBaseCodigo: string
  ModoPrecio: string
  PrecioFijo?: number | null
  VisiblePos: boolean
  Activo: boolean
  TarifaAsociada: boolean
  RequiereCliente: boolean
  GeneraBeneficio: boolean
  BloqueHorarioComercialId?: number | null
  ClaseId?: number | null
  VigenciaDias?: number | null
  UsosIncluidos?: number | null
  AccesoIlimitado: boolean
}

export interface TarifaDto {
  TarifaProductoId: number
  ProductoEmpresaId: number
  ProductoNombre: string
  TipoClienteId?: number | null
  TipoClienteNombre?: string | null
  TipoDia?: string | null
  BloqueHorarioComercialId?: number | null
  Precio: number
  VigenciaDesde: string
  VigenciaHasta: string
  Activo: boolean
}

export interface TarifaProductoResumenDto {
  TarifaProductoId: number
  ProductoEmpresaId: number
  TipoClienteId?: number | null
  TipoClienteNombre?: string | null
  TipoDia?: string | null
  BloqueHorarioComercialId?: number | null
  BloqueHorarioNombre?: string | null
  HoraInicio?: string | null
  HoraFin?: string | null
  Precio: number
  VigenciaDesde: string
  VigenciaHasta: string
  Activo: boolean
}

export interface ClaseHorarioDto {
  ClaseHorarioId: number
  DiaSemana: number
  HoraInicio: string
  HoraFin: string
  Activo: boolean
}

export interface ClaseAgendaHorarioDto {
  DiaSemana: number
  HoraInicio: string
  HoraFin: string
  Activo: boolean
}

export interface ClaseAgendaDto {
  ClaseId: number
  Nombre: string
  ProfesorNombre: string
  CupoMaximo: number
  Activo: boolean
  Horarios: ClaseAgendaHorarioDto[]
}

export interface ClaseDto {
  ClaseId: number
  Nombre: string
  ProfesorEmpresaId: number
  ProfesorNombre: string
  CupoMaximo: number
  Activo: boolean
  Horarios: ClaseHorarioDto[]
}

export interface PosCatalogItemDto {
  ProductoEmpresaId: number
  NombreComercial: string
  TipoProductoBaseCodigo: string
  ModoPrecio: string
  PrecioFijo?: number | null
  RequiereCliente: boolean
  GeneraBeneficio: boolean
  VisiblePos: boolean
  TarifaGeneralVigente?: number | null
  TarifaEstudianteVigente?: number | null
  DiasClase?: string[]
}

export interface VentaDetalleDto {
  VentaDetalleId: number
  ProductoEmpresaId: number
  ProductoNombre: string
  Cantidad: number
  PrecioUnitario: number
  Subtotal: number
  FechaInicioVigencia?: string | null
  BeneficioClienteId?: number | null
}

export interface VentaPagoDto {
  VentaPagoId: number
  MedioPago: string
  Monto: number
  Referencia?: string | null
}

export interface VentaDto {
  VentaId: number
  NumeroComprobante: string
  FechaHora: string
  Estado: string
  Subtotal: number
  Descuento: number
  Total: number
  ClienteEmpresaId?: number | null
  ClienteNombre?: string | null
  Detalles: VentaDetalleDto[]
  Pagos: VentaPagoDto[]
  MotivoAnulacion?: string | null
}

export interface ClienteLookupDto {
  ClienteEmpresaId: number
  NombreCompleto: string
  Rut: string
  Estado: string
  TipoCliente: string
}

export interface AccessOptionDto {
  BeneficioClienteId: number
  ProductoNombre: string
  Estado: string
  FechaInicio: string
  FechaTermino: string
  UsosTotales?: number | null
  UsosConsumidos: number
}

export interface AccessPreviewDto {
  ClienteEmpresaId: number
  ClienteNombre: string
  EstadoCliente: string
  Opciones: AccessOptionDto[]
}

export interface AccessValidationResultDto {
  Autorizado: boolean
  Mensaje: string
  AccesoEventoId?: number | null
  BeneficioClienteId?: number | null
  ProductoNombre?: string | null
}

export interface ClaseSesionDto {
  ClaseSesionId: number
  Fecha: string
  HoraInicio: string
  HoraFin: string
  ClaseNombre: string
  ProfesorNombre: string
  CupoMaximo: number
  Estado: string
}

export interface ClaseAsistenciaDto {
  ClaseAsistenciaId: number
  ClaseSesionId: number
  ClienteEmpresaId: number
  Estado: string
  FechaHoraRegistro: string
}

export interface DashboardReportDto {
  VentasTotales: number
  VentasEmitidas: number
  ClientesActivos: number
  MensualidadesActivas: number
  PacksVigentes: number
  AccesosAutorizadosHoy: number
}

export interface SimpleReportItemDto {
  Etiqueta: string
  Valor: number
}
