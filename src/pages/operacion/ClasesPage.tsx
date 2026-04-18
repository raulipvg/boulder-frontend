import { ClockCircleOutlined, LeftOutlined, ReloadOutlined, RightOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Empty, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { useEffect, useState } from 'react'

dayjs.locale('es')
import { PageFiltersCard } from '../../components/shared/PageFiltersCard'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { operacionService } from '../../services/operacion/operacionService'
import type { ClaseSesionDto } from '../../types/models'
import { toCapitalCase } from '../../utils/formatPersonName'

export default function OperacionClasesPage() {
  const [fecha, setFecha] = useState(dayjs())
  const [items, setItems] = useState<ClaseSesionDto[]>([])
  const [loading, setLoading] = useState(true)

  const dateOptions = Array.from({ length: 7 }, (_, i) => fecha.subtract(3, 'day').add(i, 'day'))

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
    <div className="tms-page">
      <RequireCompanyAlert />
      <PageHeaderCard
        title="Sesiones de clases"
        subtitle="Sesiones generadas desde los horarios de clases."
      />

      <PageFiltersCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
          <Button type="text" icon={<LeftOutlined />} onClick={() => setFecha(fecha.subtract(1, 'day'))} />

          <div style={{ display: 'flex', overflowX: 'auto', gap: 8, padding: '4px', flex: 1, msOverflowStyle: 'none', scrollbarWidth: 'none', justifyContent: 'center' }}>
            {dateOptions.map(d => {
              const isSelected = d.format('YYYY-MM-DD') === fecha.format('YYYY-MM-DD');
              return (
                <div
                  key={d.toISOString()}
                  onClick={() => setFecha(d)}
                  style={{
                    minWidth: 64,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 12,
                    padding: '8px 4px',
                    backgroundColor: isSelected ? '#374151' : 'transparent',
                    color: isSelected ? '#ffffff' : '#595959',
                    transition: 'all 0.2s ease',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ textTransform: 'capitalize', fontSize: 11, opacity: isSelected ? 0.9 : 0.6 }}>{d.format('ddd')}</div>
                  <div style={{ fontSize: 18, fontWeight: isSelected ? 700 : 500, margin: '2px 0' }}>{d.format('DD')}</div>
                  <div style={{ textTransform: 'capitalize', fontSize: 10, opacity: isSelected ? 0.9 : 0.6 }}>{d.format('MMM')}</div>
                </div>
              )
            })}
          </div>

          <Button type="text" icon={<RightOutlined />} onClick={() => setFecha(fecha.add(1, 'day'))} />
          <div style={{ width: 1, height: 24, backgroundColor: '#f0f0f0', margin: '0 8px' }} />
          <Button icon={<ReloadOutlined />} onClick={() => void load(fecha.format('YYYY-MM-DD'))} />
        </div>
      </PageFiltersCard>

      <div style={{ marginTop: 24 }}>
        {loading ? (
          <Card loading={true} style={{ borderRadius: 16 }} />
        ) : items.length === 0 ? (
          <Card style={{ borderRadius: 16 }}>
            <Empty description="No hay sesiones programadas para este día" />
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {items.map(record => (
              <Card
                key={record.ClaseSesionId}
                hoverable
                style={{ borderRadius: 16, overflow: 'hidden', borderLeft: record.Estado === 'programada' ? '4px solid #374151' : '4px solid #ff4d4f' }}
                bodyStyle={{ padding: 20 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151', backgroundColor: '#eceff3', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>
                    <ClockCircleOutlined />
                    <span>{record.HoraInicio.slice(0, 5)} - {record.HoraFin.slice(0, 5)}</span>
                  </div>
                  <Tag color={record.Estado === 'programada' ? 'success' : 'error'} style={{ margin: 0, borderRadius: 12 }}>
                    {record.Estado.toUpperCase()}
                  </Tag>
                </div>

                <Typography.Title level={4} style={{ margin: '0 0 16px 0', fontSize: 18 }}>
                  {record.ClaseNombre}
                </Typography.Title>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <Avatar style={{ backgroundColor: '#fa8c16' }} icon={<UserOutlined />} />
                  <div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>Profesor</div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{toCapitalCase(record.ProfesorNombre)}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                  <span style={{ color: '#8c8c8c', fontSize: 13 }}>Cupo Máximo</span>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{record.CupoMaximo}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
