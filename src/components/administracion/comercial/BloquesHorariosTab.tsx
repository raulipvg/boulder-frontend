import { EditOutlined } from '@ant-design/icons'
import {
  App as AntdApp,
  Button,
  Card,
  Empty,
  Form,
  Grid,
  Input,
  Modal,
  Switch,
  Table,
  Tag,
  TimePicker,
  Tooltip,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { administracionService } from '../../../services/administracion/administracionService'
import type { BloqueHorarioDto } from '../../../types/models'
import { getApiErrorMessage } from '../../../utils/getApiErrorMessage'

const TIME_FORMAT = 'HH:mm'

export interface BloquesHorariosTabHandle {
  openCreate: () => void
  reload: () => Promise<void>
}

const { useBreakpoint } = Grid

const BloquesHorariosTab = forwardRef<BloquesHorariosTabHandle>(function BloquesHorariosTab(_props, ref) {
  const { message } = AntdApp.useApp()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const [items, setItems] = useState<BloqueHorarioDto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BloqueHorarioDto | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      const data = await administracionService.getBloquesHorarios()
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const openCreate = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({ Activo: true })
    setOpen(true)
  }

  const openEdit = (record: BloqueHorarioDto) => {
    setEditingItem(record)
    form.setFieldsValue({
      Nombre: record.Nombre,
      HoraInicio: dayjs(record.HoraInicio, TIME_FORMAT),
      HoraFin: dayjs(record.HoraFin, TIME_FORMAT),
      Activo: record.Activo,
    })
    setOpen(true)
  }

  useImperativeHandle(ref, () => ({
    openCreate,
    reload: load,
  }))

  const columns: ColumnsType<BloqueHorarioDto> = [
    { title: 'Nombre', dataIndex: 'Nombre', key: 'Nombre' },
    {
      title: 'Hora inicio',
      dataIndex: 'HoraInicio',
      key: 'HoraInicio',
      render: (value: string) => value?.substring(0, 5),
    },
    {
      title: 'Hora fin',
      dataIndex: 'HoraFin',
      key: 'HoraFin',
      render: (value: string) => value?.substring(0, 5),
    },
    {
      title: 'Activo',
      key: 'Activo',
      responsive: ['sm'],
      render: (_, record) => <Tag color={record.Activo ? 'green' : 'red'}>{record.Activo ? 'Activo' : 'Inactivo'}</Tag>,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Tooltip title="Editar">
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
        </Tooltip>
      ),
    },
  ]

  return (
    <>
      <Card className="tms-page-table-card" loading={loading}>
        {isMobile ? (
          items.length > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {items.map((record) => (
                <Card size="small" key={record.BloqueHorarioComercialId}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{record.Nombre}</div>
                      <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
                        {record.HoraInicio.substring(0, 5)} - {record.HoraFin.substring(0, 5)}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <Tag color={record.Activo ? 'green' : 'red'}>{record.Activo ? 'Activo' : 'Inactivo'}</Tag>
                      </div>
                    </div>
                    <Tooltip title="Editar">
                      <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
                    </Tooltip>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Empty description="Sin bloques horarios" />
          )
        ) : (
          <Table
            rowKey="BloqueHorarioComercialId"
            columns={columns}
            dataSource={items}
            scroll={{ x: 720 }}
            tableLayout="auto"
            pagination={false}
          />
        )}
      </Card>

      <Modal
        open={open}
        title={editingItem ? 'Editar bloque horario' : 'Nuevo bloque horario'}
        onCancel={() => {
          setOpen(false)
          setEditingItem(null)
        }}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ Activo: true }}
          onFinish={async (values) => {
            setSubmitting(true)
            try {
              const payload = {
                Nombre: values.Nombre,
                HoraInicio: (values.HoraInicio as dayjs.Dayjs).format(TIME_FORMAT),
                HoraFin: (values.HoraFin as dayjs.Dayjs).format(TIME_FORMAT),
                Activo: values.Activo,
              }

              if (editingItem) {
                await administracionService.updateBloqueHorario(editingItem.BloqueHorarioComercialId, payload)
                message.success('Bloque horario actualizado correctamente.')
              } else {
                await administracionService.createBloqueHorario(payload)
                message.success('Bloque horario creado correctamente.')
              }

              setOpen(false)
              setEditingItem(null)
              form.resetFields()
              await load()
            } catch (error) {
              message.error(getApiErrorMessage(error, `No se pudo ${editingItem ? 'actualizar' : 'crear'} el bloque.`))
            } finally {
              setSubmitting(false)
            }
          }}
        >
          <Form.Item name="Nombre" label="Nombre" rules={[{ required: true, message: 'El nombre es obligatorio.' }]}>
            <Input placeholder="Ej: Manana, Tarde, Noche" />
          </Form.Item>

          <div className="grid-two">
            <Form.Item name="HoraInicio" label="Hora inicio" rules={[{ required: true, message: 'Ingresa la hora de inicio.' }]}>
              <TimePicker format={TIME_FORMAT} minuteStep={15} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="HoraFin" label="Hora fin" rules={[{ required: true, message: 'Ingresa la hora de fin.' }]}>
              <TimePicker format={TIME_FORMAT} minuteStep={15} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item name="Activo" label="Activo" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
})

export default BloquesHorariosTab
