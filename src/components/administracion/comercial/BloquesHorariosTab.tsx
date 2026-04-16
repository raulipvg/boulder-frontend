import { App as AntdApp, Button, Form, Input, Modal, Switch, Table, TimePicker, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { RequireCompanyAlert } from '../../../components/shared/RequireCompanyAlert'
import { administracionService } from '../../../services/administracion/administracionService'
import type { BloqueHorarioDto } from '../../../types/models'
import { getApiErrorMessage } from '../../../utils/getApiErrorMessage'

const TIME_FORMAT = 'HH:mm'

export default function BloquesHorariosTab() {
  const { message } = AntdApp.useApp()
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

  useEffect(() => { void load() }, [])

  const openNew = () => {
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

  return (
    <>
      <RequireCompanyAlert />
      <div className="page-actions" style={{ marginBottom: 16 }}>
        <div>
          <Typography.Text type="secondary">
            Define los bloques horarios de tu empresa. Un bloque activo no puede solaparse con otro bloque activo.
          </Typography.Text>
        </div>
        <Button type="primary" onClick={openNew}>
          Nuevo bloque
        </Button>
      </div>

      <Table
        rowKey="BloqueHorarioComercialId"
        loading={loading}
        dataSource={items}
        columns={[
          { title: 'Nombre', dataIndex: 'Nombre' },
          {
            title: 'Hora inicio',
            dataIndex: 'HoraInicio',
            render: (v: string) => v?.substring(0, 5),
          },
          {
            title: 'Hora fin',
            dataIndex: 'HoraFin',
            render: (v: string) => v?.substring(0, 5),
          },
          {
            title: 'Activo',
            dataIndex: 'Activo',
            render: (v: boolean) => (v ? 'Sí' : 'No'),
          },
          {
            title: 'Acciones',
            render: (_, record) => (
              <Button type="link" onClick={() => openEdit(record)}>
                Editar
              </Button>
            ),
          },
        ]}
      />

      <Modal
        open={open}
        title={editingItem ? 'Editar bloque horario' : 'Nuevo bloque horario'}
        onCancel={() => { setOpen(false); setEditingItem(null) }}
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
            <Input placeholder="Ej: Mañana, Tarde, Noche" />
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
}
