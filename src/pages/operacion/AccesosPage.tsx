import { CheckCircleOutlined } from '@ant-design/icons'
import { Alert, App as AntdApp, AutoComplete, Button, Card, Grid, List, Space } from 'antd'
import { useEffect, useState } from 'react'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { operacionService } from '../../services/operacion/operacionService'
import type { AccessOptionDto, AccessPreviewDto, ClienteLookupDto } from '../../types/models'
import { toCapitalCase } from '../../utils/formatPersonName'

const { useBreakpoint } = Grid

export default function AccesosPage() {
  const { message } = AntdApp.useApp()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const [search, setSearch] = useState('')
  const [clientes, setClientes] = useState<ClienteLookupDto[]>([])
  const [selectedCliente, setSelectedCliente] = useState<ClienteLookupDto | null>(null)
  const [preview, setPreview] = useState<AccessPreviewDto | null>(null)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    if (!search || search.length < 2) {
      setClientes([])
      return
    }

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

  const handleValidar = async (option: AccessOptionDto, currentPreview: AccessPreviewDto) => {
    const response = await operacionService.validarAcceso({
      ClienteEmpresaId: currentPreview.ClienteEmpresaId,
      BeneficioClienteId: option.BeneficioClienteId,
    })
    setResult(response.Mensaje)
    message[response.Autorizado ? 'success' : 'error'](response.Mensaje)
    setPreview(await operacionService.previewAcceso(currentPreview.ClienteEmpresaId))
  }

  return (
    <div className="tms-page">
      <RequireCompanyAlert />

      <PageHeaderCard
        title="Validacion de accesos"
        subtitle="Selecciona el cliente y el beneficio a consumir o validar."
      />

      <Card className="tms-page-table-card">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
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

          {preview && (
            <Card size="small" title={`${toCapitalCase(preview.ClienteNombre)} · ${preview.EstadoCliente}`}>
              <List
                dataSource={preview.Opciones}
                locale={{ emptyText: 'El cliente no tiene beneficios vigentes.' }}
                renderItem={(item) => {
                  if (isMobile) {
                    return (
                      <List.Item>
                        <div style={{ width: '100%', display: 'grid', gap: 8 }}>
                          <List.Item.Meta
                            title={item.ProductoNombre}
                            description={`Vigente: ${item.FechaInicio} a ${item.FechaTermino} · Usos: ${item.UsosConsumidos}/${item.UsosTotales ?? '∞'}`}
                          />
                          <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => void handleValidar(item, preview)}
                          >
                            Validar
                          </Button>
                        </div>
                      </List.Item>
                    )
                  }

                  return (
                    <List.Item
                      actions={[
                        <Button
                          key="validate"
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          onClick={() => void handleValidar(item, preview)}
                        >
                          Validar
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={item.ProductoNombre}
                        description={`Vigente: ${item.FechaInicio} a ${item.FechaTermino} · Usos: ${item.UsosConsumidos}/${item.UsosTotales ?? '∞'}`}
                      />
                    </List.Item>
                  )
                }}
              />
            </Card>
          )}

          {result && <Alert type="info" showIcon message={result} />}
        </Space>
      </Card>
    </div>
  )
}
