import { CheckCircleOutlined, ClockCircleOutlined, LeftOutlined, ReloadOutlined, RightOutlined, UserOutlined } from '@ant-design/icons'
import {
  App as AntdApp,
  Avatar,
  Button,
  Card,
  Empty,
  Grid,
  Modal,
  Spin,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { PageFiltersCard } from '../../components/shared/PageFiltersCard'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { operacionService } from '../../services/operacion/operacionService'
import type { ClaseSesionDto, ClaseSesionInscritoDto } from '../../types/models'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import { toCapitalCase } from '../../utils/formatPersonName'

const { useBreakpoint } = Grid
const DATE_NAVIGATION_DEBOUNCE_MS = 300

export default function OperacionClasesPage() {
  const { message } = AntdApp.useApp()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const [fecha, setFecha] = useState(dayjs())
  const [fechaPendiente, setFechaPendiente] = useState<string | null>(null)
  const [items, setItems] = useState<ClaseSesionDto[]>([])
  const [loading, setLoading] = useState(true)
  const [navegandoFecha, setNavegandoFecha] = useState(false)
  const [sesionSeleccionada, setSesionSeleccionada] = useState<ClaseSesionDto | null>(null)
  const [inscritos, setInscritos] = useState<ClaseSesionInscritoDto[]>([])
  const [inscritosLoading, setInscritosLoading] = useState(false)
  const [registrandoClienteId, setRegistrandoClienteId] = useState<number | null>(null)
  const navigationIntentRef = useRef(0)
  const initialFechaRef = useRef(fecha.format('YYYY-MM-DD'))

  const dateOptions = Array.from({ length: 7 }, (_, i) => fecha.subtract(3, 'day').add(i, 'day'))
  const fechaSeleccionada = fecha.format('YYYY-MM-DD')

  const load = useCallback(async (fechaValue: string) => {
    setLoading(true)
    try {
      setItems(await operacionService.getSesiones(fechaValue))
    } catch (error) {
      setItems([])
      message.error(getApiErrorMessage(error, 'No se pudieron cargar las sesiones.'))
    } finally {
      setLoading(false)
    }
  }, [message])

  const requestFecha = (nextFecha: dayjs.Dayjs) => {
    const nextFechaValue = nextFecha.format('YYYY-MM-DD')
    const currentTarget = fechaPendiente ?? fechaSeleccionada

    if (nextFechaValue === currentTarget) {
      return
    }

    setLoading(true)
    setNavegandoFecha(true)
    setFechaPendiente(nextFechaValue)
  }

  const navigateFecha = (deltaDays: number) => {
    const base = dayjs(fechaPendiente ?? fechaSeleccionada)
    requestFecha(base.add(deltaDays, 'day'))
  }

  const loadInscritos = async (claseSesionId: number) => {
    setInscritosLoading(true)
    try {
      setInscritos(await operacionService.getInscritosSesion(claseSesionId))
    } catch (error) {
      setInscritos([])
      message.error(getApiErrorMessage(error, 'No se pudo cargar la lista de inscritos.'))
    } finally {
      setInscritosLoading(false)
    }
  }

  const abrirAsistenciaSesion = (record: ClaseSesionDto) => {
    setSesionSeleccionada(record)
    void loadInscritos(record.ClaseSesionId)
  }

  const cerrarAsistenciaSesion = () => {
    setSesionSeleccionada(null)
    setInscritos([])
  }

  const handleRegistrarAsistencia = async (inscrito: ClaseSesionInscritoDto) => {
    if (!sesionSeleccionada || inscrito.AsistenciaRegistrada) {
      return
    }

    setRegistrandoClienteId(inscrito.ClienteEmpresaId)
    try {
      await operacionService.registrarAsistencia({
        ClaseSesionId: sesionSeleccionada.ClaseSesionId,
        ClienteEmpresaId: inscrito.ClienteEmpresaId,
        BeneficioClienteId: inscrito.BeneficioClienteId,
      })

      message.success(`Asistencia registrada para ${toCapitalCase(inscrito.ClienteNombre)}`)

      await Promise.all([
        loadInscritos(sesionSeleccionada.ClaseSesionId),
        load(fechaSeleccionada),
      ])
    } catch (error) {
      message.error(getApiErrorMessage(error, 'No se pudo registrar la asistencia.'))
    } finally {
      setRegistrandoClienteId(null)
    }
  }

  const inscritosColumns: ColumnsType<ClaseSesionInscritoDto> = [
    {
      title: 'Cliente',
      key: 'cliente',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{toCapitalCase(record.ClienteNombre)}</div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{record.Rut}</Typography.Text>
        </div>
      ),
    },
    {
      title: 'Beneficio',
      key: 'beneficio',
      render: (_, record) => (
        <div>
          <div>{record.ProductoNombre}</div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.AccesoIlimitado ? 'Usos: ilimitado' : `Usos: ${record.UsosConsumidos}/${record.UsosTotales ?? '∞'}`}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'AsistenciaRegistrada',
      key: 'AsistenciaRegistrada',
      width: 170,
      render: (registrada: boolean) => (
        <Tag color={registrada ? 'green' : 'gold'}>{registrada ? 'Registrada' : 'Pendiente'}</Tag>
      ),
    },
    {
      title: 'Acción',
      key: 'accion',
      width: 180,
      render: (_, record) => (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          disabled={record.AsistenciaRegistrada}
          loading={registrandoClienteId === record.ClienteEmpresaId}
          onClick={() => void handleRegistrarAsistencia(record)}
        >
          {record.AsistenciaRegistrada ? 'Registrada' : 'Marcar asistencia'}
        </Button>
      ),
    },
  ]

  const asistenciasRegistradas = inscritos.filter(x => x.AsistenciaRegistrada).length
  const fechaSesionLabel = sesionSeleccionada
    ? toCapitalCase(dayjs(sesionSeleccionada.Fecha).format('dddd D MMMM'))
    : ''

  useEffect(() => {
    void load(initialFechaRef.current)
  }, [load])

  useEffect(() => {
    if (!fechaPendiente) {
      return
    }

    const intentId = ++navigationIntentRef.current
    const timeout = setTimeout(() => {
      void (async () => {
        try {
          const sesiones = await operacionService.getSesiones(fechaPendiente)

          if (intentId !== navigationIntentRef.current) {
            return
          }

          setItems(sesiones)
          setFecha(dayjs(fechaPendiente))
        } catch (error) {
          if (intentId !== navigationIntentRef.current) {
            return
          }

          message.error(getApiErrorMessage(error, 'No se pudieron cargar las sesiones.'))
        } finally {
          if (intentId !== navigationIntentRef.current) {
            return
          }

          setLoading(false)
          setNavegandoFecha(false)
          setFechaPendiente(null)
        }
      })()
    }, DATE_NAVIGATION_DEBOUNCE_MS)

    return () => clearTimeout(timeout)
  }, [fechaPendiente, message])

  return (
    <div className="tms-page">
      <RequireCompanyAlert />
      <PageHeaderCard
        title="Sesiones de clases"
        subtitle="Sesiones generadas desde los horarios de clases."
        mobileStandard={isMobile}
        actions={<Button icon={<ReloadOutlined />} onClick={() => void load(fecha.format('YYYY-MM-DD'))} />}
      />

      <PageFiltersCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
          <Tooltip title="Día anterior">
            <Button type="text" icon={navegandoFecha ? <Spin size="small" /> : <LeftOutlined />} onClick={() => navigateFecha(-1)} />
          </Tooltip>

          <div style={{ display: 'flex', overflowX: 'auto', gap: 8, padding: '4px', flex: 1, msOverflowStyle: 'none', scrollbarWidth: 'none', justifyContent: 'center' }}>
            {dateOptions.map(d => {
              const dateValue = d.format('YYYY-MM-DD')
              const isSelected = dateValue === fechaSeleccionada
              const isPending = dateValue === fechaPendiente

              return (
                <div
                  key={d.toISOString()}
                  onClick={() => requestFecha(d)}
                  style={{
                    minWidth: 64,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 12,
                    padding: '8px 4px',
                    backgroundColor: isSelected ? '#374151' : isPending ? '#eceff3' : 'transparent',
                    color: isSelected ? '#ffffff' : '#595959',
                    transition: 'all 0.2s ease',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ textTransform: 'capitalize', fontSize: 11, opacity: isSelected ? 0.9 : 0.6 }}>{d.format('ddd')}</div>
                  <div style={{ fontSize: 18, fontWeight: isSelected ? 700 : 500, margin: '2px 0', minHeight: 27, display: 'grid', placeItems: 'center' }}>
                    {isPending ? <Spin size="small" /> : d.format('DD')}
                  </div>
                  <div style={{ textTransform: 'capitalize', fontSize: 10, opacity: isSelected ? 0.9 : 0.6 }}>{d.format('MMM')}</div>
                </div>
              )
            })}
          </div>

          <Tooltip title="Día siguiente">
            <Button type="text" icon={navegandoFecha ? <Spin size="small" /> : <RightOutlined />} onClick={() => navigateFecha(1)} />
          </Tooltip>
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
                onClick={() => abrirAsistenciaSesion(record)}
                style={{ borderRadius: 16, overflow: 'hidden', borderLeft: record.Estado === 'programada' ? '4px solid #374151' : '4px solid #ff4d4f' }}
                styles={{ body: { padding: 20 } }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151', backgroundColor: '#eceff3', padding: '2px 4px', borderRadius: 8, fontWeight: 600 }}>
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
                  <span style={{ color: '#8c8c8c', fontSize: 13 }}>Cupo</span>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{record.CupoMaximo} personas</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(sesionSeleccionada)}
        onCancel={cerrarAsistenciaSesion}
        footer={null}
        width={isMobile ? '100%' : 980}
        style={isMobile ? { top: 12 } : undefined}
        title={sesionSeleccionada ? `Asistencia · ${sesionSeleccionada.ClaseNombre}` : 'Asistencia'}
      >
        {sesionSeleccionada ? (
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <Typography.Text type="secondary">
                  {fechaSesionLabel} · {sesionSeleccionada.HoraInicio.slice(0, 5)} - {sesionSeleccionada.HoraFin.slice(0, 5)} · Profesor {toCapitalCase(sesionSeleccionada.ProfesorNombre)}
                </Typography.Text>
                <div style={{ marginTop: 4 }}>
                  <Tag color="blue" style={{ marginInlineEnd: 8 }}>{`Inscritos ${inscritos.length}`}</Tag>
                  <Tag color="green">{`Registradas ${asistenciasRegistradas}`}</Tag>
                </div>
              </div>
              <Button
                icon={<ReloadOutlined />}
                loading={inscritosLoading}
                onClick={() => void loadInscritos(sesionSeleccionada.ClaseSesionId)}
              >
                Actualizar
              </Button>
            </div>

            {inscritosLoading ? (
              <Card loading={true} />
            ) : inscritos.length === 0 ? (
              <Empty description="No hay clientes inscritos con beneficio vigente" />
            ) : isMobile ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {inscritos.map((record) => (
                  <Card size="small" key={record.ClienteEmpresaId}>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <strong>{toCapitalCase(record.ClienteNombre)}</strong>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{record.Rut}</Typography.Text>
                      <span>{record.ProductoNombre}</span>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {record.AccesoIlimitado ? 'Usos: ilimitado' : `Usos: ${record.UsosConsumidos}/${record.UsosTotales ?? '∞'}`}
                      </Typography.Text>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Tag color={record.AsistenciaRegistrada ? 'green' : 'gold'}>{record.AsistenciaRegistrada ? 'Registrada' : 'Pendiente'}</Tag>
                        <Button
                          size="small"
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          disabled={record.AsistenciaRegistrada}
                          loading={registrandoClienteId === record.ClienteEmpresaId}
                          onClick={() => void handleRegistrarAsistencia(record)}
                        >
                          {record.AsistenciaRegistrada ? 'Registrada' : 'Marcar asistencia'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Table
                rowKey="ClienteEmpresaId"
                columns={inscritosColumns}
                dataSource={inscritos}
                pagination={false}
                scroll={{ x: 860 }}
                tableLayout="auto"
              />
            )}
          </Space>
        ) : null}
      </Modal>
    </div>
  )
}
