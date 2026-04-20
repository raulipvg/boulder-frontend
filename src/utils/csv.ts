export interface CsvColumn<T> {
  header: string
  value: (row: T) => unknown
}

interface DownloadCsvOptions<T> {
  fileName: string
  columns: CsvColumn<T>[]
  rows: T[]
  delimiter?: string
}

function normalizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  const raw = String(value)
  const escaped = raw.replace(/"/g, '""')
  return `"${escaped}"`
}

export function buildCsvContent<T>(columns: CsvColumn<T>[], rows: T[], delimiter = ';'): string {
  const headerRow = columns.map((column) => normalizeCsvCell(column.header)).join(delimiter)
  const dataRows = rows.map((row) => columns.map((column) => normalizeCsvCell(column.value(row))).join(delimiter))
  return [headerRow, ...dataRows].join('\n')
}

export function downloadCsv<T>({ fileName, columns, rows, delimiter = ';' }: DownloadCsvOptions<T>) {
  const csvContent = buildCsvContent(columns, rows, delimiter)
  const csvWithBom = `\uFEFF${csvContent}`
  const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
