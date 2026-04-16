import { App as AntdApp, AutoComplete, Button, Card, InputNumber, Space, Table, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { operacionService } from '../../services/operacion/operacionService'
import type { AccessPreviewDto, ClaseSesionDto, ClienteLookupDto } from '../../types/models'
import { toCapitalCase } from '../../utils/formatPersonName'

export default function AsistenciasPage() {
  const { message } = AntdApp.useApp()
  const [sesiones, setSesiones] = useState<ClaseSesionDto[]>([])
  const [search, setSearch] = useState('')
  const [clientes, setClientes] = useState<ClienteLookupDto[]>([])
  const [selectedCliente, setSelectedCliente] = useState<ClienteLookupDto | null>(null)
  const [preview, setPreview] = useState<AccessPreviewDto | null>(null)
  const [selectedSesionId, setSelectedSesionId] = useState<number | null>(null)

  useEffect(() => {
    void operacionService.getSesiones(dayjs().format('YYYY-MM-DD')).then(setSesiones)
  }, [])

  useEffect(() => {
    if (!search || search.length < 2) return
    const timeout = setTimeout(async () => setClientes(await operacionService.buscarClientes(search)), 250)
    return () => clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    if (!selectedCliente) {
      setPreview(null)
      return
    }
    void operacionService.previewAcceso(selectedCliente.ClienteEmpresaId).then(setPreview)
  }, [selectedCliente])

  return (
    <>
      <RequireCompanyAlert />
      <Card>
        <Typography.Title level={3}>Registro de asistencias</Typography.Title>
        <Space orientation="vertical" style={{ width: '100%' }} size="large">
          <InputNumber placeholder="ID sesión" style={{ width: 220 }} value={selectedSesionId ?? undefined} onChange={(value) => setSelectedSesionId(Number(value) || null)} />
          <AutoComplete
            value={selectedCliente ? `${toCapitalCase(selectedCliente.NombreCompleto)} (${selectedCliente.Rut})` : search}
            onSearch={setSearch}
            onSelect={(value) => {
              const cliente = clientes.find((item) => `${item.ClienteEmpresaId}` === value)
              if (cliente) {
                setSelectedCliente(cliente)
                setSearch(`${toCapitalCase(cliente.NombreCompleto)} (${cliente.Rut})`)
              }
            }}
            options={clientes.map((cliente) => ({ value: `${cliente.ClienteEmpresaId}`, label: `${toCapitalCase(cliente.NombreCompleto)} (${cliente.Rut})` }))}
            style={{ width: 420 }}
          />

          <Table
            rowKey="ClaseSesionId"
            dataSource={sesiones}
            pagination={false}
            columns={[
              { title: 'ID sesión', dataIndex: 'ClaseSesionId' },
              { title: 'Clase', dataIndex: 'ClaseNombre' },
              { title: 'Profesor', render: (_, record) => toCapitalCase(record.ProfesorNombre) },
              { title: 'Hora', render: (_, r) => `${r.HoraInicio} - ${r.HoraFin}` },
            ]}
          />

          {preview && (
            <Table
              rowKey="BeneficioClienteId"
              dataSource={preview.Opciones}
              pagination={false}
              columns={[
                { title: 'Beneficio', dataIndex: 'ProductoNombre' },
                { title: 'Usos', render: (_, record) => `${record.UsosConsumidos}/${record.UsosTotales ?? '∞'}` },
                {
                  title: 'Acción',
                  render: (_, record) => (
                    <Button
                      type="primary"
                      disabled={!selectedSesionId || !selectedCliente}
                      onClick={async () => {
                        if (!selectedSesionId || !selectedCliente) return
                        await operacionService.registrarAsistencia({
                          ClaseSesionId: selectedSesionId,
                          ClienteEmpresaId: selectedCliente.ClienteEmpresaId,
                          BeneficioClienteId: record.BeneficioClienteId,
                        })
                        message.success('Asistencia registrada')
                        setPreview(await operacionService.previewAcceso(selectedCliente.ClienteEmpresaId))
                      }}
                    >
                      Registrar
                    </Button>
                  ),
                },
              ]}
            />
          )}
        </Space>
      </Card>
    </>
  )
}
