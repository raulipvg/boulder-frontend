import { LockOutlined, SafetyOutlined, UserOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Form, Input, Space, Typography } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <Card
      style={{
        width: '100%',
        maxWidth: 430,
        borderRadius: 12,
        boxShadow: '0 10px 36px rgba(17, 24, 39, 0.24)',
      }}
    >
      <Space orientation="vertical" size={2} style={{ marginBottom: 20 }}>
        <Typography.Title level={3} style={{ margin: 0, color: '#374151' }}>
          ERP Boulder
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
          Control de acceso, ventas y operación para centros de escalada.
        </Typography.Paragraph>
      </Space>

      {error && <Alert type="error" title={error} showIcon style={{ marginBottom: 16 }} />}

      <Form
        layout="vertical"
        onFinish={async (values) => {
          setLoading(true)
          setError(null)
          try {
            await login(values.email, values.password)
            navigate('/ventas/punto-venta', { replace: true })
          } catch (err) {
            setError(getApiErrorMessage(err, 'Error al iniciar sesión o credenciales incorrectas.'))
          } finally {
            setLoading(false)
          }
        }}
      >
        <Form.Item name="email" label="Correo" rules={[{ required: true, message: 'Ingresa el correo.' }]}>
          <Input size="large" placeholder="admin@ignea.cl" prefix={<UserOutlined />} autoComplete="username" />
        </Form.Item>

        <Form.Item name="password" label="Contraseña" rules={[{ required: true, message: 'Ingresa la contraseña.' }]}>
          <Input.Password size="large" placeholder="••••••••" prefix={<LockOutlined />} autoComplete="current-password" />
        </Form.Item>

        <Button type="primary" htmlType="submit" block size="large" loading={loading}>
          Ingresar
        </Button>

        <Typography.Paragraph type="secondary" style={{ marginTop: 14, marginBottom: 0 }}>
          <SafetyOutlined style={{ marginRight: 6 }} />
          Tu sesión se valida contra perfiles y permisos de empresa.
        </Typography.Paragraph>
      </Form>
    </Card>
  )
}
