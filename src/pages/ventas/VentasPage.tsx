import { ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Input, Modal, Space, Table, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { ventasService } from '../../services/ventas/ventasService'
import type { VentaDto } from '../../types/models'
import { toCapitalCase } from '../../utils/formatPersonName'

export default function VentasPage() {
  const [items, setItems] = useState<VentaDto[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSale, setSelectedSale] = useState<VentaDto | null>(null)
  const [motivo, setMotivo] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      setItems(await ventasService.getVentas())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  return (
    <div className="tms-page">
      <RequireCompanyAlert />
      <PageHeaderCard
        title="Ventas"
        subtitle="Historial operativo de ventas y anulaciones."
        actions={<Button icon={<ReloadOutlined />} onClick={() => void load()} />}
      />

      <Card className="tms-page-table-card">
        <Table
          rowKey="VentaId"
          loading={loading}
          dataSource={items}
          expandable={{ expandedRowRender: (record) => <pre className="table-json-preview">{JSON.stringify(record.Detalles, null, 2)}</pre> }}
          columns={[
            { title: 'Comprobante', dataIndex: 'NumeroComprobante' },
            { title: 'Fecha', dataIndex: 'FechaHora' },
            { title: 'Cliente', render: (_, record) => toCapitalCase(record.ClienteNombre) },
            { title: 'Estado', dataIndex: 'Estado' },
            { title: 'Total', dataIndex: 'Total' },
            {
              title: 'Acciones',
              render: (_, record) => record.Estado === 'emitida' ? <Button danger onClick={() => setSelectedSale(record)}>Anular</Button> : null,
            },
          ]}
        />
      </Card>

      <Modal
        open={!!selectedSale}
        title={`Anular venta ${selectedSale?.NumeroComprobante ?? ''}`}
        onCancel={() => { setSelectedSale(null); setMotivo('') }}
        onOk={async () => {
          if (!selectedSale) return
          await ventasService.anularVenta(selectedSale.VentaId, motivo)
          setSelectedSale(null)
          setMotivo('')
          await load()
        }}
      >
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Typography.Text>Motivo de anulación</Typography.Text>
          <Input.TextArea value={motivo} onChange={(event) => setMotivo(event.target.value)} rows={4} />
        </Space>
      </Modal>
    </div>
  )
}
