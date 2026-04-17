import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import {
  App as AntdApp,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Grid,
  Input,
  Modal,
  Radio,
  Row,
  Segmented,
  Select,
  Spin,
  Switch,
  Tag,
  TimePicker,
  Tooltip,
} from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { administracionService } from '../../services/administracion/administracionService'
import type { ClaseAgendaDto, ClaseDto, IdNombreDto } from '../../types/models'
import { toCapitalCase } from '../../utils/formatPersonName'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'

const { useBreakpoint } = Grid

const DAY_OPTIONS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miercoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sabado' },
  { value: 7, label: 'Domingo' },
]

const HOUR_HEIGHT = 64
const DEFAULT_START_HOUR = 8
const DEFAULT_END_HOUR = 22

type HorarioFormValue = {
  DiaSemana: number
  HoraInicio: dayjs.Dayjs
  HoraFin: dayjs.Dayjs
  Activo?: boolean
}

type ClaseFormValues = {
  Nombre: string
  ProfesorEmpresaId: number
  CupoMaximo: number | string
  EstadoActiva: boolean
  Horarios: HorarioFormValue[]
}

type CalendarEventBase = {
  eventId: string
  claseId: number
  claseNombre: string
  profesorNombre: string
  cupoMaximo: number
  activoClase: boolean
  horarioActivo: boolean
  diaSemana: number
  horaInicio: string
  horaFin: string
  inicioMin: number
  finMin: number
}

type CalendarEvent = CalendarEventBase & {
  column: number
  columns: number
}

type HorarioPayload = {
  DiaSemana: number
  HoraInicio: string
  HoraFin: string
  Activo: boolean
}

type EstadoFiltro = 'activo' | 'inactivo'

const getCurrentDay = () => {
  const currentDay = dayjs().day()
  return currentDay === 0 ? 7 : currentDay
}

const normalizeTimeString = (time: string) => (time.length === 5 ? `${time}:00` : time)

const toTimePickerValue = (time: string) => dayjs(`2000-01-01T${normalizeTimeString(time)}`)

const getDiaSemanaLabel = (diaSemana: number) => DAY_OPTIONS.find((day) => day.value === diaSemana)?.label ?? `Dia ${diaSemana}`

const parseTimeToMinutes = (time: string) => {
  const [hoursRaw, minutesRaw] = normalizeTimeString(time).split(':')
  const hours = Number(hoursRaw)
  const minutes = Number(minutesRaw)
  return hours * 60 + minutes
}

const formatShortTime = (time: string) => normalizeTimeString(time).slice(0, 5)

const findHorarioOverlap = (horarios: HorarioPayload[]) => {
  const activeHorarios = horarios.filter((horario) => horario.Activo)
  const groupedByDay = activeHorarios.reduce<Record<number, HorarioPayload[]>>((acc, horario) => {
    if (!acc[horario.DiaSemana]) {
      acc[horario.DiaSemana] = []
    }
    acc[horario.DiaSemana].push(horario)
    return acc
  }, {})

  for (const [dayKey, dayHorarios] of Object.entries(groupedByDay)) {
    const sorted = [...dayHorarios].sort((a, b) => parseTimeToMinutes(a.HoraInicio) - parseTimeToMinutes(b.HoraInicio))
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1]
      const current = sorted[index]
      if (parseTimeToMinutes(current.HoraInicio) < parseTimeToMinutes(previous.HoraFin)) {
        return {
          DiaSemana: Number(dayKey),
          HoraInicio: current.HoraInicio,
          HoraFin: previous.HoraFin,
        }
      }
    }
  }

  return null
}

const buildDayLayout = (events: CalendarEventBase[]): CalendarEvent[] => {
  if (events.length === 0) {
    return []
  }

  const sorted = [...events].sort((a, b) => a.inicioMin - b.inicioMin || a.finMin - b.finMin)
  const activeColumns: Array<{ column: number; finMin: number }> = []
  let maxColumns = 1

  const withColumns = sorted.map((event) => {
    for (let index = activeColumns.length - 1; index >= 0; index -= 1) {
      if (activeColumns[index].finMin <= event.inicioMin) {
        activeColumns.splice(index, 1)
      }
    }

    const usedColumns = new Set(activeColumns.map((entry) => entry.column))
    let column = 0
    while (usedColumns.has(column)) {
      column += 1
    }

    activeColumns.push({ column, finMin: event.finMin })
    maxColumns = Math.max(maxColumns, activeColumns.length)

    return {
      ...event,
      column,
      columns: 1,
    }
  })

  return withColumns.map((event) => ({ ...event, columns: maxColumns }))
}

const defaultHorarioFormValue = () => ({
  DiaSemana: 1,
  HoraInicio: toTimePickerValue('18:00:00'),
  HoraFin: toTimePickerValue('20:00:00'),
  Activo: true,
})

export default function ClasesPage() {
  const { message } = AntdApp.useApp()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const [items, setItems] = useState<ClaseAgendaDto[]>([])
  const [profesores, setProfesores] = useState<IdNombreDto[]>([])
  const [profesoresLoading, setProfesoresLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ClaseDto | null>(null)
  const [isEditModal, setIsEditModal] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number>(getCurrentDay)
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('activo')
  const [form] = Form.useForm()
  const estadoClaseActiva = Form.useWatch('EstadoActiva', form) ?? true

  const load = async (estado: EstadoFiltro) => {
    setLoading(true)
    try {
      const activo = estado === 'activo'
      const clases = await administracionService.getClases(activo)
      setItems(clases)
    } finally {
      setLoading(false)
    }
  }

  const loadProfesores = async () => {
    if (profesores.length > 0) {
      return
    }

    setProfesoresLoading(true)
    try {
      setProfesores(await administracionService.getProfesores())
    } finally {
      setProfesoresLoading(false)
    }
  }

  useEffect(() => {
    void load(estadoFiltro)
  }, [estadoFiltro])

  const openCreate = async () => {
    setIsEditModal(false)
    setLoadingEdit(false)
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({
      EstadoActiva: true,
      CupoMaximo: 8,
      Horarios: [defaultHorarioFormValue()],
    })
    setOpen(true)

    try {
      await loadProfesores()
    } catch (error) {
      message.error(getApiErrorMessage(error, 'No se pudo cargar el catalogo de profesores.'))
    }
  }

  const setFormFromClase = (record: ClaseDto) => {
    setEditingItem(record)
    form.setFieldsValue({
      Nombre: record.Nombre,
      ProfesorEmpresaId: record.ProfesorEmpresaId,
      CupoMaximo: record.CupoMaximo,
      EstadoActiva: record.Activo,
      Horarios: (record.Horarios.length > 0 ? record.Horarios : [{ DiaSemana: 1, HoraInicio: '18:00:00', HoraFin: '20:00:00', Activo: true }])
        .map((horario) => ({
          DiaSemana: horario.DiaSemana,
          HoraInicio: toTimePickerValue(horario.HoraInicio),
          HoraFin: toTimePickerValue(horario.HoraFin),
          Activo: horario.Activo,
        })),
    })
  }

  const openEditFromClaseId = async (claseId: number) => {
    setIsEditModal(true)
    setLoadingEdit(true)
    setEditingItem(null)
    form.resetFields()
    setOpen(true)

    try {
      const [claseDetalle] = await Promise.all([
        administracionService.getClaseById(claseId),
        loadProfesores(),
      ])
      setFormFromClase(claseDetalle)
    } catch (error) {
      message.error(getApiErrorMessage(error, 'No se pudo cargar el detalle de la clase.'))
      setOpen(false)
      setIsEditModal(false)
      setEditingItem(null)
    } finally {
      setLoadingEdit(false)
    }
  }

  const calendarEvents = useMemo<CalendarEventBase[]>(() => {
    return items.flatMap((record) =>
      record.Horarios.map((horario, horarioIndex) => {
        const inicioMin = parseTimeToMinutes(horario.HoraInicio)
        const finMin = parseTimeToMinutes(horario.HoraFin)
        return {
          eventId: `${record.ClaseId}-${horario.DiaSemana}-${horario.HoraInicio}-${horario.HoraFin}-${horarioIndex}`,
          claseId: record.ClaseId,
          claseNombre: record.Nombre,
          profesorNombre: toCapitalCase(record.ProfesorNombre),
          cupoMaximo: record.CupoMaximo,
          activoClase: record.Activo,
          horarioActivo: horario.Activo,
          diaSemana: horario.DiaSemana,
          horaInicio: horario.HoraInicio,
          horaFin: horario.HoraFin,
          inicioMin,
          finMin,
        }
      }),
    ).filter((event) => Number.isFinite(event.inicioMin) && Number.isFinite(event.finMin) && event.finMin > event.inicioMin)
  }, [items])

  const eventsByDay = useMemo<Record<number, CalendarEvent[]>>(() => {
    const grouped: Record<number, CalendarEvent[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
    }

    DAY_OPTIONS.forEach((day) => {
      grouped[day.value] = buildDayLayout(calendarEvents.filter((event) => event.diaSemana === day.value))
    })

    return grouped
  }, [calendarEvents])

  const calendarBounds = useMemo(() => {
    if (calendarEvents.length === 0) {
      const startMinute = DEFAULT_START_HOUR * 60
      const endMinute = DEFAULT_END_HOUR * 60
      return {
        startMinute,
        endMinute,
        hourTicks: Array.from({ length: DEFAULT_END_HOUR - DEFAULT_START_HOUR + 1 }, (_, index) => startMinute + index * 60),
        height: (DEFAULT_END_HOUR - DEFAULT_START_HOUR) * HOUR_HEIGHT,
      }
    }

    const minMinute = Math.min(...calendarEvents.map((event) => event.inicioMin))
    const maxMinute = Math.max(...calendarEvents.map((event) => event.finMin))
    const startHour = Math.max(6, Math.floor(minMinute / 60) - 1)
    const endHour = Math.min(23, Math.ceil(maxMinute / 60) + 1)
    const startMinute = startHour * 60
    const endMinute = Math.max((startHour + 1) * 60, endHour * 60)
    const hourTicks: number[] = []

    for (let minute = startMinute; minute <= endMinute; minute += 60) {
      hourTicks.push(minute)
    }

    return {
      startMinute,
      endMinute,
      hourTicks,
      height: ((endMinute - startMinute) / 60) * HOUR_HEIGHT,
    }
  }, [calendarEvents])

  const selectedDayEvents = useMemo(
    () => [...(eventsByDay[selectedDay] ?? [])].sort((a, b) => a.inicioMin - b.inicioMin || a.finMin - b.finMin),
    [eventsByDay, selectedDay],
  )

  return (
    <div className="tms-page">
      <RequireCompanyAlert />
      <PageHeaderCard
        title="Clases"
        subtitle="Programas y horarios asociados a profesor."
        actions={(
          <>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={estadoFiltro}
              onChange={(event) => setEstadoFiltro(event.target.value as EstadoFiltro)}
              options={[
                { label: 'Activo', value: 'activo' },
                { label: 'Inactivo', value: 'inactivo' },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={() => void load(estadoFiltro)} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => void openCreate()}>
              Nueva clase
            </Button>
          </>
        )}
      />

      <Card className="tms-page-table-card" loading={loading}>
        {calendarEvents.length > 0 ? (
          isMobile ? (
            <div className="tms-clases-mobile-calendar">
              <Segmented
                block
                value={selectedDay}
                onChange={(value) => setSelectedDay(Number(value))}
                options={DAY_OPTIONS.map((day) => ({ value: day.value, label: day.label.slice(0, 3) }))}
              />

              {selectedDayEvents.length > 0 ? (
                <div className="tms-clases-mobile-list">
                  {selectedDayEvents.map((event) => (
                    <Card
                      key={event.eventId}
                      size="small"
                      hoverable
                      className="tms-clases-mobile-card"
                      onClick={() => openEditFromClaseId(event.claseId)}
                    >
                      <div className="tms-clases-mobile-card-title">{event.claseNombre}</div>
                      <div className="tms-clases-mobile-card-line">
                        Profesor: {event.profesorNombre}
                      </div>
                      <div className="tms-clases-mobile-card-line">
                        Horario: {formatShortTime(event.horaInicio)} - {formatShortTime(event.horaFin)}
                      </div>
                      <div className="tms-clases-mobile-card-line">Cupo: {event.cupoMaximo}</div>
                      <div className="tms-clases-mobile-card-tags">
                        <Tag color={event.activoClase ? 'green' : 'red'}>{event.activoClase ? 'activa' : 'inactiva'}</Tag>
                        {!event.horarioActivo ? <Tag color="default">Horario inactivo</Tag> : null}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`Sin horarios para ${getDiaSemanaLabel(selectedDay)}`} />
              )}
            </div>
          ) : (
            <div className="tms-clases-calendar">
              <div className="tms-clases-calendar-header">
                <div className="tms-clases-calendar-time-head">Hora</div>
                {DAY_OPTIONS.map((day) => (
                  <div key={day.value} className="tms-clases-calendar-day-head">
                    {day.label}
                  </div>
                ))}
              </div>

              <div className="tms-clases-calendar-body" style={{ height: calendarBounds.height }}>
                <div className="tms-clases-calendar-time-col">
                  {calendarBounds.hourTicks.map((tickMinute) => (
                    (() => {
                      const rawTop = ((tickMinute - calendarBounds.startMinute) / 60) * HOUR_HEIGHT
                      const top = Math.min(Math.max(rawTop - 8, 0), Math.max(calendarBounds.height - 16, 0))
                      return (
                        <div
                          key={`time-${tickMinute}`}
                          className="tms-clases-calendar-time-label"
                          style={{ top }}
                        >
                          {String(Math.floor(tickMinute / 60)).padStart(2, '0')}:00
                        </div>
                      )
                    })()
                  ))}
                </div>

                {DAY_OPTIONS.map((day) => (
                  <div key={`day-${day.value}`} className="tms-clases-calendar-day-col">
                    {calendarBounds.hourTicks.map((tickMinute) => (
                      <div
                        key={`line-${day.value}-${tickMinute}`}
                        className="tms-clases-calendar-hour-line"
                        style={{ top: ((tickMinute - calendarBounds.startMinute) / 60) * HOUR_HEIGHT }}
                      />
                    ))}

                    {(eventsByDay[day.value] ?? []).map((event) => {
                      const top = ((event.inicioMin - calendarBounds.startMinute) / 60) * HOUR_HEIGHT
                      const height = Math.max(((event.finMin - event.inicioMin) / 60) * HOUR_HEIGHT, 28)
                      const eventWidth = 100 / event.columns
                      const left = event.column * eventWidth
                      const isEnabled = event.activoClase && event.horarioActivo

                      return (
                        <button
                          type="button"
                          key={event.eventId}
                          className={`tms-clases-calendar-event ${isEnabled ? '' : 'tms-clases-calendar-event--inactive'}`.trim()}
                          style={{
                            top,
                            height,
                            left: `calc(${left}% + 4px)`,
                            width: `calc(${eventWidth}% - 8px)`,
                          }}
                          onClick={() => openEditFromClaseId(event.claseId)}
                        >
                          <div className="tms-clases-calendar-event-title">{event.claseNombre}</div>
                          <div className="tms-clases-calendar-event-meta">{event.profesorNombre}</div>
                          <div className="tms-clases-calendar-event-meta">
                            {formatShortTime(event.horaInicio)} - {formatShortTime(event.horaFin)}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          <Empty description="Sin horarios de clases registrados" />
        )}
      </Card>

      <Modal
        open={open}
        title={isEditModal ? 'Editar clase' : 'Nueva clase'}
        width={isMobile ? '100%' : 920}
        style={isMobile ? undefined : { top: 24 }}
        onCancel={() => {
          setOpen(false)
          setIsEditModal(false)
          setLoadingEdit(false)
          setEditingItem(null)
        }}
        onOk={() => {
          if (!loadingEdit) {
            form.submit()
          }
        }}
        confirmLoading={submitting || loadingEdit}
        okButtonProps={{ disabled: loadingEdit }}
        destroyOnHidden
      >
        <Spin spinning={loadingEdit} description="Cargando clase...">
          <Form<ClaseFormValues>
            form={form}
            layout="vertical"
            initialValues={{
              EstadoActiva: true,
              CupoMaximo: 8,
              Horarios: [defaultHorarioFormValue()],
            }}
            onFinish={async (values) => {
              setSubmitting(true)
              try {
                if (!values.Horarios || values.Horarios.length === 0) {
                  message.error('Debes agregar al menos un horario.')
                  return
                }

                const horariosPayload: HorarioPayload[] = values.Horarios.map((horario) => ({
                  DiaSemana: Number(horario.DiaSemana),
                  HoraInicio: horario.HoraInicio.format('HH:mm:ss'),
                  HoraFin: horario.HoraFin.format('HH:mm:ss'),
                  Activo: horario.Activo ?? true,
                }))

                for (const horario of horariosPayload) {
                  if (parseTimeToMinutes(horario.HoraFin) <= parseTimeToMinutes(horario.HoraInicio)) {
                    message.error(`El horario ${getDiaSemanaLabel(horario.DiaSemana)} ${formatShortTime(horario.HoraInicio)}-${formatShortTime(horario.HoraFin)} es invalido.`)
                    return
                  }
                }

                const overlap = findHorarioOverlap(horariosPayload)
                if (overlap) {
                  message.error(`Hay horarios cruzados el ${getDiaSemanaLabel(overlap.DiaSemana)} entre ${formatShortTime(overlap.HoraInicio)} y ${formatShortTime(overlap.HoraFin)}.`)
                  return
                }

                const payload = {
                  Nombre: values.Nombre,
                  ProfesorEmpresaId: values.ProfesorEmpresaId,
                  CupoMaximo: Number(values.CupoMaximo),
                  Activo: values.EstadoActiva,
                  Horarios: horariosPayload,
                }

                if (editingItem) {
                  await administracionService.updateClase(editingItem.ClaseId, payload)
                  message.success('Clase actualizada correctamente.')
                } else {
                  await administracionService.createClase(payload)
                  message.success('Clase creada correctamente.')
                }

                setOpen(false)
                setIsEditModal(false)
                setEditingItem(null)
                form.resetFields()
                await load(estadoFiltro)
              } catch (error) {
                message.error(getApiErrorMessage(error, `No se pudo ${editingItem ? 'actualizar' : 'crear'} la clase.`))
              } finally {
                setSubmitting(false)
              }
            }}
          >
          <Row gutter={12} align="bottom">
            <Col xs={24} md={9}>
              <Form.Item name="Nombre" label="Nombre" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={7}>
              <Form.Item name="ProfesorEmpresaId" label="Profesor" rules={[{ required: true }]}>
                <Select
                  loading={profesoresLoading}
                  options={profesores.map((profesor) => ({ value: profesor.Id, label: profesor.Nombre }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item name="CupoMaximo" label="Cupo" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col xs={24} md={4} className="tms-clases-estado-col">
              <Form.Item name="EstadoActiva" label="Estado" valuePropName="checked" className="tms-clases-estado-item">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

            <Form.List
            name="Horarios"
            rules={[
              {
                validator: async (_, value) => {
                  if (Array.isArray(value) && value.length > 0) {
                    return
                  }

                  throw new Error('Debes agregar al menos un horario.')
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                <div className="tms-clases-horario-header">
                  <strong>Horarios</strong>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add(defaultHorarioFormValue())}
                  >
                    Agregar horario
                  </Button>
                </div>

                <div className="tms-clases-horario-list">
                  {fields.map((field) => (
                    <div key={field.key} className="tms-clases-horario-row">
                      <Form.Item
                        name={[field.name, 'DiaSemana']}
                        label="Dia"
                        rules={[{ required: true, message: 'Selecciona un dia.' }]}
                      >
                        <Select
                          options={DAY_OPTIONS.map((day) => ({ value: day.value, label: day.label }))}
                        />
                      </Form.Item>

                      <Form.Item
                        name={[field.name, 'HoraInicio']}
                        label="Hora inicio"
                        rules={[{ required: true, message: 'Selecciona hora inicio.' }]}
                      >
                        <TimePicker style={{ width: '100%' }} format="HH:mm" />
                      </Form.Item>

                      <Form.Item
                        name={[field.name, 'HoraFin']}
                        label="Hora fin"
                        rules={[{ required: true, message: 'Selecciona hora fin.' }]}
                      >
                        <TimePicker style={{ width: '100%' }} format="HH:mm" />
                      </Form.Item>

                      <Form.Item name={[field.name, 'Activo']} label="Activo" valuePropName="checked">
                        <Switch
                          onChange={(checked) => {
                            if (checked || !estadoClaseActiva) {
                              return
                            }

                            const horarios = (form.getFieldValue('Horarios') ?? []) as Array<{ Activo?: boolean }>
                            const activeCountAfter = horarios.reduce((count, horario, index) => {
                              const activeValue = index === field.name ? checked : (horario?.Activo ?? false)
                              return count + (activeValue ? 1 : 0)
                            }, 0)

                            if (activeCountAfter === 0) {
                              message.warning('La clase activa debe tener al menos un horario activo.')
                              form.setFieldValue(['Horarios', field.name, 'Activo'], true)
                            }
                          }}
                        />
                      </Form.Item>

                      <div className="tms-clases-horario-actions">
                        <Tooltip title="Eliminar horario">
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(field.name)}
                          />
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>

                <Form.ErrorList errors={errors} />
              </>
            )}
            </Form.List>
          </Form>
        </Spin>
      </Modal>
    </div>
  )
}
