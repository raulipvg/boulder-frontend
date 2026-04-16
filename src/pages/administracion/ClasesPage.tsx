import { EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import {
  App as AntdApp,
  Button,
  Card,
  Empty,
  Form,
  Grid,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  TimePicker,
  Tooltip,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { administracionService } from '../../services/administracion/administracionService'
import type { ClaseDto, LookupDto } from '../../types/models'
import { toCapitalCase } from '../../utils/formatPersonName'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'

const { useBreakpoint } = Grid

export default function ClasesPage() {
  const { message } = AntdApp.useApp()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const [items, setItems] = useState<ClaseDto[]>([])
  const [profesores, setProfesores] = useState<LookupDto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ClaseDto | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      const [clases, profesoresData] = await Promise.all([
        administracionService.getClases(),
        administracionService.getProfesores(),
      ])
      setItems(clases)
      setProfesores(profesoresData)
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
    form.setFieldsValue({
      Estado: 'activa',
      DiaSemana: 1,
      HoraInicio: dayjs('18:00', 'HH:mm'),
      HoraFin: dayjs('20:00', 'HH:mm'),
      CupoMaximo: 8,
    })
    setOpen(true)
  }

  const openEdit = (record: ClaseDto) => {
    const horario = record.Horarios[0]
    setEditingItem(record)
    form.setFieldsValue({
      Nombre: record.Nombre,
      ProfesorEmpresaId: record.ProfesorEmpresaId,
      CupoMaximo: record.CupoMaximo,
      Estado: record.Estado,
      DiaSemana: horario?.DiaSemana,
      HoraInicio: horario ? dayjs(horario.HoraInicio, 'HH:mm:ss') : undefined,
      HoraFin: horario ? dayjs(horario.HoraFin, 'HH:mm:ss') : undefined,
    })
    setOpen(true)
  }

  const columns: ColumnsType<ClaseDto> = [
    { title: 'Clase', dataIndex: 'Nombre', key: 'Nombre' },
    { title: 'Profesor', key: 'ProfesorNombre', render: (_, record) => toCapitalCase(record.ProfesorNombre), responsive: ['sm'] },
    { title: 'Cupo', dataIndex: 'CupoMaximo', key: 'CupoMaximo', responsive: ['md'] },
    {
      title: 'Estado',
      key: 'Estado',
      responsive: ['sm'],
      render: (_, record) => <Tag color={record.Estado === 'activa' ? 'green' : 'red'}>{record.Estado}</Tag>,
    },
    {
      title: 'Horarios',
      key: 'Horarios',
      render: (_, record) => record.Horarios.map((horario) => `${horario.DiaSemana} ${horario.HoraInicio}-${horario.HoraFin}`).join(', '),
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
    <div className="tms-page">
      <RequireCompanyAlert />
      <PageHeaderCard
        title="Clases"
        subtitle="Programas y horarios asociados a profesor."
        actions={(
          <>
            <Button icon={<ReloadOutlined />} onClick={() => void load()} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Nueva clase
            </Button>
          </>
        )}
      />

      <Card className="tms-page-table-card" loading={loading}>
        {isMobile ? (
          items.length > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {items.map((record) => (
                <Card size="small" key={record.ClaseId}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{record.Nombre}</div>
                      <div style={{ marginTop: 4, color: '#6b7280', fontSize: 12 }}>
                        Profesor: {toCapitalCase(record.ProfesorNombre)}
                      </div>
                      <div style={{ marginTop: 4, color: '#6b7280', fontSize: 12 }}>
                        Cupo: {record.CupoMaximo}
                      </div>
                      <div style={{ marginTop: 4, color: '#374151', fontSize: 12 }}>
                        {record.Horarios.map((horario) => `${horario.DiaSemana} ${horario.HoraInicio}-${horario.HoraFin}`).join(', ')}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <Tag color={record.Estado === 'activa' ? 'green' : 'red'}>{record.Estado}</Tag>
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
            <Empty description="Sin clases registradas" />
          )
        ) : (
          <Table
            rowKey="ClaseId"
            columns={columns}
            dataSource={items}
            scroll={{ x: 980 }}
            tableLayout="auto"
            pagination={false}
          />
        )}
      </Card>

      <Modal
        open={open}
        title={editingItem ? 'Editar clase' : 'Nueva clase'}
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
          initialValues={{
            Estado: 'activa',
            DiaSemana: 1,
            HoraInicio: dayjs('18:00', 'HH:mm'),
            HoraFin: dayjs('20:00', 'HH:mm'),
            CupoMaximo: 8,
          }}
          onFinish={async (values) => {
            setSubmitting(true)
            try {
              const payload = {
                Nombre: values.Nombre,
                ProfesorEmpresaId: values.ProfesorEmpresaId,
                CupoMaximo: Number(values.CupoMaximo),
                Estado: values.Estado,
                Horarios: [
                  {
                    DiaSemana: Number(values.DiaSemana),
                    HoraInicio: values.HoraInicio.format('HH:mm:ss'),
                    HoraFin: values.HoraFin.format('HH:mm:ss'),
                    Activo: true,
                  },
                ],
              }

              if (editingItem) {
                await administracionService.updateClase(editingItem.ClaseId, payload)
                message.success('Clase actualizada correctamente.')
              } else {
                await administracionService.createClase(payload)
                message.success('Clase creada correctamente.')
              }

              setOpen(false)
              setEditingItem(null)
              form.resetFields()
              await load()
            } catch (error) {
              message.error(getApiErrorMessage(error, `No se pudo ${editingItem ? 'actualizar' : 'crear'} la clase.`))
            } finally {
              setSubmitting(false)
            }
          }}
        >
          <Form.Item name="Nombre" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="ProfesorEmpresaId" label="Profesor" rules={[{ required: true }]}>
            <Select options={profesores.map((profesor) => ({ value: profesor.Id, label: profesor.Nombre }))} />
          </Form.Item>
          <Form.Item name="CupoMaximo" label="Cupo maximo" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="Estado" label="Estado" rules={[{ required: true }]}>
            <Select options={[{ value: 'activa', label: 'Activa' }, { value: 'inactiva', label: 'Inactiva' }]} />
          </Form.Item>
          <Form.Item name="DiaSemana" label="Dia semana" rules={[{ required: true }]}>
            <Select options={[1, 2, 3, 4, 5, 6, 7].map((value) => ({ value, label: `Dia ${value}` }))} />
          </Form.Item>
          <Form.Item name="HoraInicio" label="Hora inicio" rules={[{ required: true }]}>
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
          <Form.Item name="HoraFin" label="Hora fin" rules={[{ required: true }]}>
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
