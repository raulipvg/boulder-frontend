import { Form, Input, Modal, Select } from 'antd'
import type { FormInstance } from 'antd'
import type { TipoClienteDto } from '../../types/models'
import type { CreateClientFormValues } from './puntoVenta.types'

interface PuntoVentaCreateClientModalProps {
  open: boolean
  creatingClient: boolean
  tiposCliente: TipoClienteDto[]
  form: FormInstance<CreateClientFormValues>
  onCancel: () => void
  onSubmit: () => void
  onFinish: (values: CreateClientFormValues) => Promise<void>
  isValidRut: (value: string) => boolean
}

export function PuntoVentaCreateClientModal({
  open,
  creatingClient,
  tiposCliente,
  form,
  onCancel,
  onSubmit,
  onFinish,
  isValidRut,
}: PuntoVentaCreateClientModalProps) {
  return (
    <Modal
      open={open}
      title="Crear cliente"
      onCancel={onCancel}
      onOk={onSubmit}
      confirmLoading={creatingClient}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="NombreCompleto" label="Nombre completo" rules={[{ required: true, whitespace: true, message: 'Ingresa el nombre del cliente.' }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="Rut"
          label="RUT"
          rules={[
            { required: true, message: 'Ingresa el RUT del cliente.' },
            {
              validator: (_, value) => {
                if (!value || isValidRut(value)) {
                  return Promise.resolve()
                }

                return Promise.reject(new Error('Ingresa un RUT válido.'))
              },
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="TipoClienteId" label="Tipo de cliente" rules={[{ required: true, message: 'Selecciona el tipo de cliente.' }]}>
          <Select options={tiposCliente.map((item) => ({ value: item.TipoClienteId, label: item.Nombre }))} />
        </Form.Item>
        <Form.Item name="Telefono" label="Teléfono">
          <Input />
        </Form.Item>
        <Form.Item name="Correo" label="Correo">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}
