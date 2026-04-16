import { ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Table } from 'antd'
import { useEffect, useState } from 'react'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { ventasService } from '../../services/ventas/ventasService'
import type { VentaDto } from '../../types/models'
import { toCapitalCase } from '../../utils/formatPersonName'

export default function AnulacionesPage() {
  const [items, setItems] = useState<VentaDto[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const ventas = await ventasService.getVentas()
      setItems(ventas.filter((item) => item.Estado === 'anulada'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="tms-page">
      <RequireCompanyAlert />
      <PageHeaderCard
        title="Anulaciones"
        subtitle="Ventas anuladas y sus motivos registrados."
        actions={<Button icon={<ReloadOutlined />} onClick={() => void load()} />}
      />

      <Card className="tms-page-table-card">
        <Table
          rowKey="VentaId"
          loading={loading}
          dataSource={items}
          columns={[
            { title: 'Comprobante', dataIndex: 'NumeroComprobante' },
            { title: 'Fecha', dataIndex: 'FechaHora' },
            { title: 'Cliente', render: (_, record) => toCapitalCase(record.ClienteNombre) },
            { title: 'Motivo', dataIndex: 'MotivoAnulacion' },
            { title: 'Total', dataIndex: 'Total' },
          ]}
        />
      </Card>
    </div>
  )
}
