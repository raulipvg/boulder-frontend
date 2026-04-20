export type ReportePeriodo = 'diario' | 'mensual' | 'anual'

export const DEFAULT_REPORTE_PERIODO: ReportePeriodo = 'diario'

export const REPORTE_PERIODO_OPTIONS: Array<{ label: string; value: ReportePeriodo }> = [
  { label: 'Diario', value: 'diario' },
  { label: 'Mensual', value: 'mensual' },
  { label: 'Anual', value: 'anual' },
]
