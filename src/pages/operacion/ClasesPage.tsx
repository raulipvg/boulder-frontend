import { ReloadOutlined } from '@ant-design/icons'
import { Button, Card, DatePicker, Empty, Grid, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { PageFiltersCard } from '../../components/shared/PageFiltersCard'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { operacionService } from '../../services/operacion/operacionService'
import type { ClaseSesionDto } from '../../types/models'
import { toCapitalCase } from '../../utils/formatPersonName'

const { useBreakpoint } = Grid

export default function OperacionClasesPage() {
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const [fecha, setFecha] = useState(dayjs())
  const [items, setItems] = useState<ClaseSesionDto[]>([])
  const [loading, setLoading] = useState(true)

  const load = async (fechaValue: string) => {
    setLoading(true)
    try {
      setItems(await operacionService.getSesiones(fechaValue))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(fecha.format('YYYY-MM-DD'))
  }, [fecha])

  const columns: ColumnsType<ClaseSesionDto> = [
    { title: 'Fecha', dataIndex: 'Fecha', key: 'Fecha' },
    { title: 'Hora inicio', dataIndex: 'HoraInicio', key: 'HoraInicio' },
    { title: 'Hora fin', dataIndex: 'HoraFin', key: 'HoraFin', responsive: ['sm'] },
    { title: 'Clase', dataIndex: 'ClaseNombre', key: 'ClaseNombre' },
    { title: 'Profesor', key: 'ProfesorNombre', render: (_, record) => toCapitalCase(record.ProfesorNombre), responsive: ['md'] },
    { title: 'Cupo', dataIndex: 'CupoMaximo', key: 'CupoMaximo', responsive: ['lg'] },
    {
      title: 'Estado',
      key: 'Estado',
      render: (_, record) => <Tag color={record.Estado === 'activa' ? 'green' : 'red'}>{record.Estado}</Tag>,
    },
  ]

  return (
    <div className="tms-page">
      <RequireCompanyAlert />
      <PageHeaderCard
        title="Sesiones de clases"
        subtitle="Sesiones generadas desde los horarios de clases."
      />

      <PageFiltersCard>
        <DatePicker value={fecha} onChange={(value) => value && setFecha(value)} />
        <Button icon={<ReloadOutlined />} onClick={() => void load(fecha.format('YYYY-MM-DD'))} />
      </PageFiltersCard>

      <Card className="tms-page-table-card" loading={loading}>
        {isMobile ? (
          items.length > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {items.map((record) => (
                <Card size="small" key={record.ClaseSesionId}>
                  <div style={{ display: 'grid', gap: 4 }}>
                    <strong>{record.ClaseNombre}</strong>
                    <span style={{ color: '#6b7280', fontSize: 12 }}>Profesor: {toCapitalCase(record.ProfesorNombre)}</span>
                    <span style={{ color: '#6b7280', fontSize: 12 }}>Fecha: {record.Fecha}</span>
                    <span style={{ color: '#6b7280', fontSize: 12 }}>Hora: {record.HoraInicio} - {record.HoraFin}</span>
                    <span style={{ color: '#6b7280', fontSize: 12 }}>Cupo: {record.CupoMaximo}</span>
                    <Tag color={record.Estado === 'activa' ? 'green' : 'red'}>{record.Estado}</Tag>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Empty description="Sin sesiones" />
          )
        ) : (
          <Table
            rowKey="ClaseSesionId"
            columns={columns}
            dataSource={items}
            scroll={{ x: 820 }}
            tableLayout="auto"
            pagination={false}
          />
        )}
      </Card>
    </div>
  )
}
