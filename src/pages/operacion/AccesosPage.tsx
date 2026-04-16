import { Alert, App as AntdApp, AutoComplete, Button, Card, List, Space, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { operacionService } from '../../services/operacion/operacionService'
import type { AccessPreviewDto, ClienteLookupDto } from '../../types/models'
import { toCapitalCase } from '../../utils/formatPersonName'

export default function AccesosPage() {
  const { message } = AntdApp.useApp()
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

  return (
    <>
      <RequireCompanyAlert />
      <Card>
        <div className="page-actions">
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>Validación de accesos</Typography.Title>
            <Typography.Text type="secondary">Selecciona el cliente y el beneficio a consumir o validar.</Typography.Text>
          </div>
        </div>

        <Space orientation="vertical" style={{ width: '100%' }} size="large">
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

          {preview && (
            <Card size="small" title={`${toCapitalCase(preview.ClienteNombre)} · ${preview.EstadoCliente}`}>
              <List
                dataSource={preview.Opciones}
                locale={{ emptyText: 'El cliente no tiene beneficios vigentes.' }}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        key="validate"
                        type="primary"
                        onClick={async () => {
                          const response = await operacionService.validarAcceso({
                            ClienteEmpresaId: preview.ClienteEmpresaId,
                            BeneficioClienteId: item.BeneficioClienteId,
                          })
                          setResult(response.Mensaje)
                          message[response.Autorizado ? 'success' : 'error'](response.Mensaje)
                          setPreview(await operacionService.previewAcceso(preview.ClienteEmpresaId))
                        }}
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
                )}
              />
            </Card>
          )}

          {result && <Alert type="info" showIcon message={result} />}
        </Space>
      </Card>
    </>
  )
}
