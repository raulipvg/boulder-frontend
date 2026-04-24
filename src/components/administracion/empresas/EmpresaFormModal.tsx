import { Col, Form, Input, Modal, Row, Switch } from 'antd'
import type { FormInstance } from 'antd'
import type { EmpresaDto } from '../../../types/models'

type EmpresaFormModalProps = {
  open: boolean
  editingItem: EmpresaDto | null
  submitting: boolean
  form: FormInstance
  onCancel: () => void
  onSubmit: (values: any) => Promise<void>
}

export function EmpresaFormModal({
  open,
  editingItem,
  submitting,
  form,
  onCancel,
  onSubmit,
}: EmpresaFormModalProps) {
  return (
    <Modal
      open={open}
      title={editingItem ? 'Editar empresa' : 'Nueva empresa'}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      destroyOnHidden
      mask={{ closable: false }}
      keyboard={false}
      width={900}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Row gutter={12}>
          <Col xs={24} md={8}>
            <Form.Item name="NombreComercial" label="Nombre comercial" rules={[{ required: true, whitespace: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="RazonSocial" label="Razón social">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="Rut" label="RUT" rules={[{ required: true, whitespace: true }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item name="TelefonoContacto" label="Teléfono">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="CorreoContacto" label="Correo">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="Estado" label="Estado" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}
