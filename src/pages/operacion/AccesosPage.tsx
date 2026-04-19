import { CheckCircleOutlined, SafetyCertificateOutlined, SearchOutlined } from '@ant-design/icons'
import { Alert, App as AntdApp, AutoComplete, Avatar, Button, Card, Divider, Empty, Input, List, Space, Spin, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { operacionService } from '../../services/operacion/operacionService'
import type { AccessOptionDto, AccessPreviewDto, ClienteLookupDto } from '../../types/models'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import { toCapitalCase } from '../../utils/formatPersonName'

export default function AccesosPage() {
  const { message } = AntdApp.useApp()

  const [search, setSearch] = useState('')
  const [clientes, setClientes] = useState<ClienteLookupDto[]>([])
  const [selectedCliente, setSelectedCliente] = useState<ClienteLookupDto | null>(null)
  const [preview, setPreview] = useState<AccessPreviewDto | null>(null)
  const [result, setResult] = useState<{ autorizado: boolean; mensaje: string } | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [validandoBeneficioId, setValidandoBeneficioId] = useState<number | null>(null)

  const loadPreview = async (clienteEmpresaId: number) => {
    setPreviewLoading(true)
    try {
      setPreview(await operacionService.previewAcceso(clienteEmpresaId))
    } catch (error) {
      setPreview(null)
      message.error(getApiErrorMessage(error, 'No se pudieron cargar los beneficios del cliente.'))
    } finally {
      setPreviewLoading(false)
    }
  }

  const getOptionState = (option: AccessOptionDto): { color: string; label: string } => {
    if (option.PuedeValidarAhora) {
      return { color: 'green', label: 'Disponible ahora' }
    }

    if (option.YaValidadoHoy) {
      return { color: 'blue', label: 'Ya validado hoy' }
    }

    if (!option.DentroBloqueHorario) {
      return { color: 'gold', label: 'Fuera de horario' }
    }

    return { color: 'default', label: 'No disponible' }
  }

  useEffect(() => {
    if (!search || search.length < 2) {
      setClientes([])
      setSearchLoading(false)
      return
    }

    setSearchLoading(true)
    const timeout = setTimeout(async () => {
      try {
        setClientes(await operacionService.buscarClientes(search))
      } catch (error) {
        setClientes([])
        message.error(getApiErrorMessage(error, 'No fue posible buscar clientes.'))
      } finally {
        setSearchLoading(false)
      }
    }, 250)

    return () => clearTimeout(timeout)
  }, [message, search])

  useEffect(() => {
    if (!selectedCliente) {
      setPreview(null)
      setPreviewLoading(false)
      return
    }

    void loadPreview(selectedCliente.ClienteEmpresaId)
  }, [selectedCliente])

  const handleValidar = async (option: AccessOptionDto, currentPreview: AccessPreviewDto) => {
    if (!option.PuedeValidarAhora) {
      message.warning(option.MotivoNoValidable || 'Este beneficio no puede validarse ahora.')
      return
    }

    setValidandoBeneficioId(option.BeneficioClienteId)
    try {
      const response = await operacionService.validarAcceso({
        ClienteEmpresaId: currentPreview.ClienteEmpresaId,
        BeneficioClienteId: option.BeneficioClienteId,
      })

      setResult({ autorizado: response.Autorizado, mensaje: response.Mensaje })
      message[response.Autorizado ? 'success' : 'error'](response.Mensaje)
      await loadPreview(currentPreview.ClienteEmpresaId)
    } catch (error) {
      message.error(getApiErrorMessage(error, 'No fue posible validar el acceso.'))
    } finally {
      setValidandoBeneficioId(null)
    }
  }

  return (
    <div className="tms-page">
      <RequireCompanyAlert />

      <PageHeaderCard
        title="Validacion de accesos"
        subtitle="Selecciona el cliente y el beneficio a consumir o validar."
      />


      <AutoComplete
        style={{ width: '100%' }}
        value={selectedCliente ? `${toCapitalCase(selectedCliente.NombreCompleto)} (${selectedCliente.Rut})` : search}
        onSearch={setSearch}
        notFoundContent={
          searchLoading ? (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <Spin tip="Buscando clientes..." size="small" />
            </div>
          ) : search.length >= 2 && clientes.length === 0 ? (
            <div style={{ padding: '16px' }}>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No se encontró ningún cliente" />
            </div>
          ) : null
        }
        onSelect={(value) => {
          const cliente = clientes.find((item) => `${item.ClienteEmpresaId}` === value)
          if (cliente) {
            setSelectedCliente(cliente)
            setSearch(`${toCapitalCase(cliente.NombreCompleto)} (${cliente.Rut})`)
            setResult(null)
          }
        }}
        options={clientes.map((cliente) => ({
          value: `${cliente.ClienteEmpresaId}`,
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar size="small" style={{ backgroundColor: '#374151' }}>{cliente.NombreCompleto.charAt(0).toUpperCase()}</Avatar>
              <div>
                <div style={{ fontWeight: 500 }}>{toCapitalCase(cliente.NombreCompleto)}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>{cliente.Rut} · {cliente.TipoCliente}</div>
              </div>
            </div>
          ),
        }))}
      >
        <Input
          size="large"
          placeholder="Buscar y seleccionar cliente..."
          prefix={<SearchOutlined style={{ color: '#bfbfbf', fontSize: 18 }} />}
          allowClear
          onChange={(e) => {
            if (!e.target.value) {
              setSelectedCliente(null)
              setPreview(null)
              setResult(null)
            }
          }}
          style={{ borderRadius: 12, fontSize: 16, padding: '8px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        />
      </AutoComplete>

      {result && (
        <Alert
          type={result.autorizado ? 'success' : 'error'}
          showIcon
          message={<Typography.Text strong style={{ fontSize: 16 }}>{result.mensaje}</Typography.Text>}
          style={{ marginTop: 24, padding: 16, borderRadius: 12, border: result.autorizado ? '1px solid #b7eb8f' : '1px solid #ffa39e' }}
        />
      )}

      {preview && (
        <Card style={{ marginTop: 24, borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }} bordered={false} loading={previewLoading}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <Avatar size={64} style={{ backgroundColor: '#374151', fontSize: 24 }}>{preview.ClienteNombre.charAt(0).toUpperCase()}</Avatar>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {toCapitalCase(preview.ClienteNombre)}
                </Typography.Title>
                {selectedCliente?.Rut && (
                  <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                    {selectedCliente.Rut}
                  </Typography.Text>
                )}
              </div>
              <Space style={{ marginTop: 4 }} size="small" wrap>
                {selectedCliente?.TipoCliente && (
                  <Tag color="info" bordered={false}>
                    {selectedCliente.TipoCliente.toUpperCase()}
                  </Tag>
                )}
                <Tag color={preview.EstadoCliente === 'activo' ? 'success' : 'error'} bordered={false}>
                  {preview.EstadoCliente.toUpperCase()}
                </Tag>
              </Space>
            </div>
          </div>

          <Divider style={{ margin: '20px 0', borderColor: '#f0f0f0' }} />

          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1, fontWeight: 600 }}>Beneficios Disponibles</Typography.Text>

          {preview.Opciones.length === 0 ? (
            <Alert type="warning" showIcon message="No tiene pases o mensualidades activas" style={{ borderRadius: 8 }} />
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={preview.Opciones}
              renderItem={(item) => {
                const optionState = getOptionState(item)
                return (
                  <List.Item
                    style={{ background: '#fafafa', borderRadius: 10, padding: '12px 16px', marginBottom: 12, border: '1px solid #f0f0f0' }}
                    actions={[
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={() => void handleValidar(item, preview)}
                        style={{ borderRadius: 8 }}
                        disabled={!item.PuedeValidarAhora}
                        loading={validandoBeneficioId === item.BeneficioClienteId}
                      >
                        Validar
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<SafetyCertificateOutlined style={{ fontSize: 24, color: '#52c41a', marginTop: 4 }} />}
                      title={(
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                          <Typography.Text strong style={{ fontSize: 15 }}>{item.ProductoNombre}</Typography.Text>
                          <Space size="small" wrap>
                            <Tag color={optionState.color} bordered={false}>{optionState.label}</Tag>
                            <Tag color="default" bordered={false}>{item.Estado.toUpperCase()}</Tag>
                          </Space>
                        </div>
                      )}
                      description={
                        <div style={{ marginTop: 4, display: 'grid', gap: 6 }}>
                          <div style={{ color: '#8c8c8c', fontSize: 13, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <span>Vigencia: {new Date(`${item.FechaInicio}T00:00:00`).toLocaleDateString('es-CL')} al {new Date(`${item.FechaTermino}T00:00:00`).toLocaleDateString('es-CL')}</span>
                            <span>Usos: {item.UsosConsumidos} / {item.UsosTotales ?? '∞'}</span>
                          </div>
                          {!item.PuedeValidarAhora && item.MotivoNoValidable && (
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              {item.MotivoNoValidable}
                            </Typography.Text>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )
              }}
            />
          )}
        </Card>
      )}
    </div>
  )
}
