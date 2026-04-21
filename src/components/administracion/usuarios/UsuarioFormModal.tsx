import { Col, Form, Input, Modal, Row, Select, Switch } from 'antd'
import type { FormInstance } from 'antd'
import type { EmpresaDto, UsuarioDto } from '../../../types/models'

type UsuarioFormModalProps = {
  open: boolean
  editingItem: UsuarioDto | null
  submitting: boolean
  isAdminTotal?: boolean
  empresas: EmpresaDto[]
  form: FormInstance
  onCancel: () => void
  onSubmit: (values: any) => Promise<void>
}

export function UsuarioFormModal({
  open,
  editingItem,
  submitting,
  isAdminTotal,
  empresas,
  form,
  onCancel,
  onSubmit,
}: UsuarioFormModalProps) {
  return (
    <Modal
      open={open}
      title={editingItem ? 'Editar usuario' : 'Nuevo usuario'}
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
            <Form.Item name="NombreCompleto" label="Nombre completo" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="Rut" label="RUT" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="EmailLogin" label="Correo" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={12}>
          {!editingItem && (
            <Col xs={24} md={8}>
              <Form.Item name="Password" label="Contrasena" rules={[{ required: true }]}> 
                <Input.Password />
              </Form.Item>
            </Col>
          )}
          <Col xs={24} md={8}>
            <Form.Item name="RolCodigo" label="Rol" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'ADMIN_TOTAL', label: 'Administrador Total' },
                  { value: 'ADMIN_EMPRESA', label: 'Administrador Empresa' },
                  { value: 'VENDEDOR_EMPRESA', label: 'Vendedor Empresa' },
                ].filter((item) => isAdminTotal || item.value !== 'ADMIN_TOTAL')}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="Estado" label="Estado" initialValue={true} valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        {isAdminTotal && (
          <Form.Item name="EmpresaId" label="Empresa asociada">
            <Select allowClear options={empresas.map((empresa) => ({ value: empresa.EmpresaId, label: empresa.NombreComercial }))} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}
