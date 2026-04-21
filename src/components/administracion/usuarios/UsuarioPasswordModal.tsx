import { Form, Input, Modal } from 'antd'
import type { FormInstance } from 'antd'
import type { UsuarioDto } from '../../../types/models'
import { toCapitalCase } from '../../../utils/formatPersonName'

type UsuarioPasswordModalProps = {
  open: boolean
  passwordTarget: UsuarioDto | null
  submitting: boolean
  form: FormInstance
  onCancel: () => void
  onSubmit: (values: any) => Promise<void>
}

export function UsuarioPasswordModal({ open, passwordTarget, submitting, form, onCancel, onSubmit }: UsuarioPasswordModalProps) {
  return (
    <Modal
      open={open}
      title={`Cambiar contrasena${passwordTarget ? ` · ${toCapitalCase(passwordTarget.NombreCompleto)}` : ''}`}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      destroyOnHidden
      mask={{ closable: false }}
      keyboard={false}
      width={400}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item name="NuevaPassword" label="Nueva contrasena" rules={[{ required: true, min: 8 }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item
          name="ConfirmPassword"
          label="Confirmar contrasena"
          dependencies={['NuevaPassword']}
          rules={[
            { required: true },
            ({ getFieldValue }) => ({
              validator: (_, value) => {
                if (!value || getFieldValue('NuevaPassword') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('Las contrasenas no coinciden'))
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>
      </Form>
    </Modal>
  )
}
