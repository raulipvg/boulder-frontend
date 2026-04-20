import type { Dayjs } from 'dayjs'
import { DatePicker, Select, Typography } from 'antd'
import type { ReactNode } from 'react'
import {
  DEFAULT_REPORTE_PERIODO,
  REPORTE_PERIODO_OPTIONS,
  type ReportePeriodo,
} from '../../constants/reportes'
import { PageFiltersCard } from '../shared/PageFiltersCard'

type DatePickerMode = 'date' | 'month' | 'year'

const DATE_PICKER_CONFIG: Record<ReportePeriodo, { picker: DatePickerMode; format: string; placeholder: string }> = {
  diario: { picker: 'date', format: 'DD/MM/YYYY', placeholder: 'Selecciona una fecha' },
  mensual: { picker: 'month', format: 'MM/YYYY', placeholder: 'Selecciona un mes' },
  anual: { picker: 'year', format: 'YYYY', placeholder: 'Selecciona un anio' },
}

export function normalizeFechaReferencia(periodo: ReportePeriodo, fecha: Dayjs): Dayjs {
  if (periodo === 'mensual') {
    return fecha.startOf('month')
  }

  if (periodo === 'anual') {
    return fecha.startOf('year')
  }

  return fecha.startOf('day')
}

export function buildFechaReferenciaParam(periodo: ReportePeriodo, fecha: Dayjs): string {
  return normalizeFechaReferencia(periodo, fecha).format('YYYY-MM-DD')
}

interface ReportesPeriodoFilterProps {
  periodo: ReportePeriodo
  fechaReferencia: Dayjs
  onPeriodoChange: (periodo: ReportePeriodo) => void
  onFechaChange: (fecha: Dayjs) => void
  actions?: ReactNode
}

export function ReportesPeriodoFilter({
  periodo,
  fechaReferencia,
  onPeriodoChange,
  onFechaChange,
  actions,
}: ReportesPeriodoFilterProps) {
  const config = DATE_PICKER_CONFIG[periodo] ?? DATE_PICKER_CONFIG[DEFAULT_REPORTE_PERIODO]

  return (
    <PageFiltersCard>
      <Typography.Text type="secondary">Periodo</Typography.Text>
      <Select
        style={{ minWidth: 140 }}
        value={periodo}
        options={REPORTE_PERIODO_OPTIONS}
        onChange={(value) => onPeriodoChange(value as ReportePeriodo)}
      />

      <Typography.Text type="secondary">Fecha base</Typography.Text>
      <DatePicker
        allowClear={false}
        picker={config.picker}
        format={config.format}
        placeholder={config.placeholder}
        value={fechaReferencia}
        onChange={(value) => {
          if (value) {
            onFechaChange(value)
          }
        }}
      />

      {actions ? <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 8 }}>{actions}</div> : null}
    </PageFiltersCard>
  )
}
