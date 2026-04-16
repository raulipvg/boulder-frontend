import { Card, Tabs, Typography } from 'antd'
import { ClockCircleOutlined, DollarOutlined, ShoppingOutlined } from '@ant-design/icons'
import BloquesHorariosTab from '../../components/administracion/comercial/BloquesHorariosTab'
import ProductosTab from '../../components/administracion/comercial/ProductosTab'
import TarifasTab from '../../components/administracion/comercial/TarifasTab'

export default function ConfiguracionComercialPage() {
  return (
    <Card>
      <div style={{ marginBottom: 20 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Configuración comercial</Typography.Title>
        <Typography.Text type="secondary">
          Administra los productos, tarifas y bloques horarios de tu empresa.
        </Typography.Text>
      </div>

      <Tabs
        defaultActiveKey="productos"
        type="card"
        size="middle"
        items={[
          {
            key: 'productos',
            label: (
              <span>
                <ShoppingOutlined />
                Productos
              </span>
            ),
            children: <ProductosTab />,
          },
          {
            key: 'tarifas',
            label: (
              <span>
                <DollarOutlined />
                Tarifas
              </span>
            ),
            children: <TarifasTab />,
          },
          {
            key: 'bloques',
            label: (
              <span>
                <ClockCircleOutlined />
                Bloques horarios
              </span>
            ),
            children: <BloquesHorariosTab />,
          },
        ]}
      />
    </Card>
  )
}
