import { Card, Table, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { ventasService } from '../../services/ventas/ventasService'
import type { VentaDto } from '../../types/models'

export default function AnulacionesPage() {
  const [items, setItems] = useState<VentaDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const ventas = await ventasService.getVentas()
        setItems(ventas.filter((item) => item.Estado === 'anulada'))
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  return (
    <>
      <RequireCompanyAlert />
      <Card>
        <Typography.Title level={3}>Anulaciones</Typography.Title>
        <Table
          rowKey="VentaId"
          loading={loading}
          dataSource={items}
          columns={[
            { title: 'Comprobante', dataIndex: 'NumeroComprobante' },
            { title: 'Fecha', dataIndex: 'FechaHora' },
            { title: 'Cliente', dataIndex: 'ClienteNombre' },
            { title: 'Motivo', dataIndex: 'MotivoAnulacion' },
            { title: 'Total', dataIndex: 'Total' },
          ]}
        />
      </Card>
    </>
  )
}
