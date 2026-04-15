import { Alert, Button, Card, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <Card style={{ width: 420, borderRadius: 16 }}>
      <Typography.Title level={3}>ERP Boulder</Typography.Title>
      <Typography.Paragraph type="secondary">Control de acceso, ventas y operación para centros de escalada.</Typography.Paragraph>
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

      <Form
        layout="vertical"
        onFinish={async (values) => {
          setLoading(true)
          setError(null)
          try {
            await login(values.email, values.password)
            navigate('/ventas/punto-venta', { replace: true })
          } catch (err) {
            setError(err instanceof Error ? err.message : 'No fue posible iniciar sesión.')
          } finally {
            setLoading(false)
          }
        }}
      >
        <Form.Item name="email" label="Correo" rules={[{ required: true, message: 'Ingresa el correo.' }]}>
          <Input size="large" placeholder="admin@ignea.cl" />
        </Form.Item>

        <Form.Item name="password" label="Contraseña" rules={[{ required: true, message: 'Ingresa la contraseña.' }]}>
          <Input.Password size="large" placeholder="••••••••" />
        </Form.Item>

        <Button type="primary" htmlType="submit" block size="large" loading={loading}>
          Ingresar
        </Button>
      </Form>
    </Card>
  )
}
