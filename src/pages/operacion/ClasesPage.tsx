import dayjs from 'dayjs'
import { Card, DatePicker, Table, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { operacionService } from '../../services/operacion/operacionService'
import type { ClaseSesionDto } from '../../types/models'
import { toCapitalCase } from '../../utils/formatPersonName'

export default function OperacionClasesPage() {
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

  return (
    <>
      <RequireCompanyAlert />
      <Card>
        <div className="page-actions">
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>Sesiones de clases</Typography.Title>
            <Typography.Text type="secondary">Sesiones generadas desde los horarios de clases.</Typography.Text>
          </div>
          <DatePicker value={fecha} onChange={(value) => value && setFecha(value)} />
        </div>

        <Table
          rowKey="ClaseSesionId"
          loading={loading}
          dataSource={items}
          columns={[
            { title: 'Fecha', dataIndex: 'Fecha' },
            { title: 'Hora inicio', dataIndex: 'HoraInicio' },
            { title: 'Hora fin', dataIndex: 'HoraFin' },
            { title: 'Clase', dataIndex: 'ClaseNombre' },
            { title: 'Profesor', render: (_, record) => toCapitalCase(record.ProfesorNombre) },
            { title: 'Cupo', dataIndex: 'CupoMaximo' },
            { title: 'Estado', dataIndex: 'Estado' },
          ]}
        />
      </Card>
    </>
  )
}
