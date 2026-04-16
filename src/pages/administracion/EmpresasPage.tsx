import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { App as AntdApp, Button, Card, Form, Input, Modal, Space, Table } from 'antd'
import { useEffect, useState } from 'react'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { administracionService } from '../../services/administracion/administracionService'
import type { EmpresaDto } from '../../types/models'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'

export default function EmpresasPage() {
  const { message } = AntdApp.useApp()
  const [items, setItems] = useState<EmpresaDto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<EmpresaDto | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      setItems(await administracionService.getEmpresas())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="tms-page">
      <PageHeaderCard
        title="Empresas"
        subtitle="Administración global de tenants SaaS."
        actions={(
          <>
            <Button icon={<ReloadOutlined />} onClick={() => void load()} />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingItem(null)
                form.resetFields()
                setOpen(true)
              }}
            >
              Nueva empresa
            </Button>
          </>
        )}
      />

      <Card className="tms-page-table-card">
        <Table
          rowKey="EmpresaId"
          loading={loading}
          dataSource={items}
          columns={[
            { title: 'Nombre comercial', dataIndex: 'NombreComercial' },
            { title: 'RUT', dataIndex: 'Rut' },
            { title: 'Estado', dataIndex: 'Estado' },
            { title: 'Moneda', dataIndex: 'MonedaCodigo' },
            { title: 'Correo', dataIndex: 'CorreoContacto' },
            {
              title: 'Acciones',
              render: (_, record) => (
                <Button
                  type="link"
                  onClick={() => {
                    setEditingItem(record)
                    form.setFieldsValue({
                      NombreComercial: record.NombreComercial,
                      RazonSocial: record.RazonSocial ?? undefined,
                      Rut: record.Rut,
                      TelefonoContacto: record.TelefonoContacto ?? undefined,
                      CorreoContacto: record.CorreoContacto ?? undefined,
                    })
                    setOpen(true)
                  }}
                >
                  Editar
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={open}
        title={editingItem ? 'Editar empresa' : 'Nueva empresa'}
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
          onFinish={async (values) => {
            setSubmitting(true)
            try {
              const payload = {
                NombreComercial: values.NombreComercial,
                RazonSocial: values.RazonSocial,
                Rut: values.Rut,
                TelefonoContacto: values.TelefonoContacto,
                CorreoContacto: values.CorreoContacto,
              }

              if (editingItem) {
                await administracionService.updateEmpresa(editingItem.EmpresaId, payload)
                message.success('Empresa actualizada correctamente.')
              } else {
                await administracionService.createEmpresa(payload)
                message.success('Empresa creada correctamente.')
              }

              setOpen(false)
              setEditingItem(null)
              form.resetFields()
              await load()
            } catch (error) {
              message.error(getApiErrorMessage(error, `No se pudo ${editingItem ? 'actualizar' : 'crear'} la empresa.`))
            } finally {
              setSubmitting(false)
            }
          }}
        >
          <Form.Item name="NombreComercial" label="Nombre comercial" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="RazonSocial" label="Razón social">
            <Input />
          </Form.Item>
          <Form.Item name="Rut" label="RUT" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="TelefonoContacto" label="Teléfono" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="CorreoContacto" label="Correo" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}
