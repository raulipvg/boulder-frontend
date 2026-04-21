import { Col, DatePicker, Form, Input, Modal, Row, Segmented, Select } from 'antd'
import type { FormInstance } from 'antd'
import type { ClienteDto, TipoClienteDto } from '../../../types/models'
import { isValidRut } from '../../../utils/rut'

type ClienteFormModalProps = {
  open: boolean
  editingItem: ClienteDto | null
  tipos: TipoClienteDto[]
  tiposLoading: boolean
  submitting: boolean
  form: FormInstance
  onCancel: () => void
  onSubmit: (values: any) => Promise<void>
}

export function ClienteFormModal({
  open,
  editingItem,
  tipos,
  tiposLoading,
  submitting,
  form,
  onCancel,
  onSubmit,
}: ClienteFormModalProps) {
  return (
    <Modal
      open={open}
      title={editingItem ? 'Editar cliente' : 'Nuevo cliente'}
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
            <Form.Item name="NombreCompleto" label="Nombre completo" rules={[{ required: true, whitespace: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="Rut"
              label="RUT"
              rules={[
                { required: true },
                {
                  validator: (_, value) => {
                    if (!value || isValidRut(value)) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('Ingresa un RUT valido.'))
                  },
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="TipoClienteId" label="Tipo cliente" rules={[{ required: true }]}>
              <Select loading={tiposLoading} options={tipos.map((tipo) => ({ value: tipo.TipoClienteId, label: tipo.Nombre }))} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} md={8}>
            <Form.Item name="FechaNacimiento" label="Fecha nacimiento">
              <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" placeholder="dd-mm-yyyy" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="Telefono" label="Telefono">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="Correo" label="Correo">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="Estado" label="Estado" initialValue="activo" rules={[{ required: true }]}>
          <Segmented
            options={[
              { label: 'Activo', value: 'activo' },
              { label: 'Inactivo', value: 'inactivo' },
              { label: 'Bloqueado', value: 'bloqueado' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
