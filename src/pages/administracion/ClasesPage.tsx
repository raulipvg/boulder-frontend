import { Button, Card, Form, Input, Modal, Select, Table, TimePicker, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { administracionService } from '../../services/administracion/administracionService'
import type { ClaseDto, LookupDto } from '../../types/models'

export default function ClasesPage() {
  const [items, setItems] = useState<ClaseDto[]>([])
  const [profesores, setProfesores] = useState<LookupDto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
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

  useEffect(() => { void load() }, [])

  return (
    <>
      <RequireCompanyAlert />
      <Card>
        <div className="page-actions">
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>Clases</Typography.Title>
            <Typography.Text type="secondary">Programas y horarios asociados a profesor.</Typography.Text>
          </div>
          <Button type="primary" onClick={() => setOpen(true)}>Nueva clase</Button>
        </div>

        <Table
          rowKey="ClaseId"
          loading={loading}
          dataSource={items}
          columns={[
            { title: 'Clase', dataIndex: 'Nombre' },
            { title: 'Profesor', dataIndex: 'ProfesorNombre' },
            { title: 'Cupo', dataIndex: 'CupoMaximo' },
            { title: 'Estado', dataIndex: 'Estado' },
            { title: 'Horarios', render: (_, record) => record.Horarios.map((h) => `${h.DiaSemana} ${h.HoraInicio}-${h.HoraFin}`).join(', ') },
          ]}
        />

        <Modal open={open} title="Nueva clase" onCancel={() => setOpen(false)} onOk={() => form.submit()} destroyOnHidden>
          <Form
            form={form}
            layout="vertical"
            initialValues={{ Estado: 'activa', DiaSemana: 1, HoraInicio: dayjs('18:00', 'HH:mm'), HoraFin: dayjs('20:00', 'HH:mm'), CupoMaximo: 8 }}
            onFinish={async (values) => {
              await administracionService.createClase({
                Nombre: values.Nombre,
                ProfesorEmpresaId: values.ProfesorEmpresaId,
                CupoMaximo: Number(values.CupoMaximo),
                Estado: values.Estado,
                Horarios: [{
                  DiaSemana: Number(values.DiaSemana),
                  HoraInicio: values.HoraInicio.format('HH:mm:ss'),
                  HoraFin: values.HoraFin.format('HH:mm:ss'),
                  Activo: true,
                }],
              })
              setOpen(false)
              form.resetFields()
              await load()
            }}
          >
            <Form.Item name="Nombre" label="Nombre" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="ProfesorEmpresaId" label="Profesor" rules={[{ required: true }]}>
              <Select options={profesores.map((p) => ({ value: p.Id, label: p.Nombre }))} />
            </Form.Item>
            <Form.Item name="CupoMaximo" label="Cupo máximo" rules={[{ required: true }]}><Input type="number" /></Form.Item>
            <Form.Item name="Estado" label="Estado" rules={[{ required: true }]}>
              <Select options={[{ value: 'activa', label: 'Activa' }, { value: 'inactiva', label: 'Inactiva' }]} />
            </Form.Item>
            <Form.Item name="DiaSemana" label="Día semana" rules={[{ required: true }]}>
              <Select options={[1,2,3,4,5,6,7].map((value) => ({ value, label: `Día ${value}` }))} />
            </Form.Item>
            <Form.Item name="HoraInicio" label="Hora inicio" rules={[{ required: true }]}><TimePicker style={{ width: '100%' }} format="HH:mm" /></Form.Item>
            <Form.Item name="HoraFin" label="Hora fin" rules={[{ required: true }]}><TimePicker style={{ width: '100%' }} format="HH:mm" /></Form.Item>
          </Form>
        </Modal>
      </Card>
    </>
  )
}
