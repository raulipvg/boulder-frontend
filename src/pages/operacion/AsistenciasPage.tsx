import { CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import {
  App as AntdApp,
  AutoComplete,
  Button,
  Card,
  Empty,
  Grid,
  InputNumber,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { operacionService } from '../../services/operacion/operacionService'
import type { AccessOptionDto, AccessPreviewDto, ClaseSesionDto, ClienteLookupDto } from '../../types/models'
import { toCapitalCase } from '../../utils/formatPersonName'

const { useBreakpoint } = Grid

export default function AsistenciasPage() {
  const { message } = AntdApp.useApp()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const [sesiones, setSesiones] = useState<ClaseSesionDto[]>([])
  const [search, setSearch] = useState('')
  const [clientes, setClientes] = useState<ClienteLookupDto[]>([])
  const [selectedCliente, setSelectedCliente] = useState<ClienteLookupDto | null>(null)
  const [preview, setPreview] = useState<AccessPreviewDto | null>(null)
  const [selectedSesionId, setSelectedSesionId] = useState<number | null>(null)

  const loadSesiones = async () => {
    const data = await operacionService.getSesiones(dayjs().format('YYYY-MM-DD'))
    setSesiones(data)
  }

  useEffect(() => {
    void loadSesiones()
  }, [])

  useEffect(() => {
    if (!search || search.length < 2) return
    const timeout = setTimeout(async () => {
      setClientes(await operacionService.buscarClientes(search))
    }, 250)
    return () => clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    if (!selectedCliente) {
      setPreview(null)
      return
    }
    void operacionService.previewAcceso(selectedCliente.ClienteEmpresaId).then(setPreview)
  }, [selectedCliente])

  const handleRegistrar = async (option: AccessOptionDto) => {
    if (!selectedSesionId || !selectedCliente) return

    await operacionService.registrarAsistencia({
      ClaseSesionId: selectedSesionId,
      ClienteEmpresaId: selectedCliente.ClienteEmpresaId,
      BeneficioClienteId: option.BeneficioClienteId,
    })
    message.success('Asistencia registrada')
    setPreview(await operacionService.previewAcceso(selectedCliente.ClienteEmpresaId))
  }

  const sesionesColumns: ColumnsType<ClaseSesionDto> = [
    { title: 'ID sesion', dataIndex: 'ClaseSesionId', key: 'ClaseSesionId' },
    { title: 'Clase', dataIndex: 'ClaseNombre', key: 'ClaseNombre' },
    { title: 'Profesor', key: 'ProfesorNombre', render: (_, record) => toCapitalCase(record.ProfesorNombre), responsive: ['md'] },
    { title: 'Hora', key: 'Hora', render: (_, record) => `${record.HoraInicio} - ${record.HoraFin}` },
    {
      title: 'Seleccion',
      key: 'select',
      render: (_, record) => (
        <Button
          size="small"
          type={selectedSesionId === record.ClaseSesionId ? 'primary' : 'default'}
          onClick={() => setSelectedSesionId(record.ClaseSesionId)}
        >
          Usar
        </Button>
      ),
    },
  ]

  const opcionesColumns: ColumnsType<AccessOptionDto> = [
    { title: 'Beneficio', dataIndex: 'ProductoNombre', key: 'ProductoNombre' },
    { title: 'Usos', key: 'Usos', render: (_, record) => `${record.UsosConsumidos}/${record.UsosTotales ?? '∞'}` },
    {
      title: 'Accion',
      key: 'Accion',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          disabled={!selectedSesionId || !selectedCliente}
          onClick={() => void handleRegistrar(record)}
        >
          Registrar
        </Button>
      ),
    },
  ]

  return (
    <div className="tms-page">
      <RequireCompanyAlert />
      <PageHeaderCard
        title="Registro de asistencias"
        subtitle="Asocia cliente, sesion y beneficio para registrar asistencia."
        actions={<Button icon={<ReloadOutlined />} onClick={() => void loadSesiones()} />}
      />

      <Card className="tms-page-table-card">
        <Space orientation="vertical" style={{ width: '100%' }} size="large">
          <InputNumber
            placeholder="ID sesion"
            style={{ width: isMobile ? '100%' : 220 }}
            value={selectedSesionId ?? undefined}
            onChange={(value) => setSelectedSesionId(Number(value) || null)}
          />

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
            options={clientes.map((cliente) => ({
              value: `${cliente.ClienteEmpresaId}`,
              label: `${toCapitalCase(cliente.NombreCompleto)} (${cliente.Rut})`,
            }))}
            style={{ width: isMobile ? '100%' : 420 }}
          />

          {isMobile ? (
            sesiones.length > 0 ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {sesiones.map((record) => (
                  <Card size="small" key={record.ClaseSesionId}>
                    <div style={{ display: 'grid', gap: 4 }}>
                      <strong>#{record.ClaseSesionId} · {record.ClaseNombre}</strong>
                      <span style={{ color: '#6b7280', fontSize: 12 }}>{toCapitalCase(record.ProfesorNombre)}</span>
                      <span style={{ color: '#6b7280', fontSize: 12 }}>{record.HoraInicio} - {record.HoraFin}</span>
                      <Button
                        size="small"
                        type={selectedSesionId === record.ClaseSesionId ? 'primary' : 'default'}
                        onClick={() => setSelectedSesionId(record.ClaseSesionId)}
                      >
                        Usar sesion
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Empty description="Sin sesiones disponibles" />
            )
          ) : (
            <Table
              rowKey="ClaseSesionId"
              columns={sesionesColumns}
              dataSource={sesiones}
              pagination={false}
              scroll={{ x: 760 }}
              tableLayout="auto"
            />
          )}

          {preview && (
            <>
              <Typography.Text type="secondary">
                Beneficios de {toCapitalCase(preview.ClienteNombre)} ({preview.EstadoCliente})
              </Typography.Text>

              {isMobile ? (
                preview.Opciones.length > 0 ? (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {preview.Opciones.map((option) => (
                      <Card size="small" key={option.BeneficioClienteId}>
                        <div style={{ display: 'grid', gap: 6 }}>
                          <strong>{option.ProductoNombre}</strong>
                          <span style={{ color: '#6b7280', fontSize: 12 }}>
                            Usos: {option.UsosConsumidos}/{option.UsosTotales ?? '∞'}
                          </span>
                          <Tag color={option.Estado === 'vigente' ? 'green' : 'orange'}>{option.Estado}</Tag>
                          <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            disabled={!selectedSesionId || !selectedCliente}
                            onClick={() => void handleRegistrar(option)}
                          >
                            Registrar
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Empty description="Sin beneficios vigentes" />
                )
              ) : (
                <Table
                  rowKey="BeneficioClienteId"
                  columns={opcionesColumns}
                  dataSource={preview.Opciones}
                  pagination={false}
                  scroll={{ x: 680 }}
                  tableLayout="auto"
                />
              )}
            </>
          )}
        </Space>
      </Card>
    </div>
  )
}
