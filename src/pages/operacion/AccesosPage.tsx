import { CheckCircleOutlined, SafetyCertificateOutlined, SearchOutlined } from '@ant-design/icons'
import { Alert, App as AntdApp, AutoComplete, Avatar, Button, Card, Divider, Empty, Input, List, Space, Spin, Tag, Typography, Grid } from 'antd'
import { useEffect, useState } from 'react'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { operacionService } from '../../services/operacion/operacionService'
import type { AccessOptionDto, AccessPreviewDto, ClienteLookupDto } from '../../types/models'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import { toCapitalCase } from '../../utils/formatPersonName'

const { useBreakpoint } = Grid;

const formatShortDate = (dateString: string) => {
  if (!dateString) return '';
  const parts = dateString.split('T')[0].split('-');
  if (parts.length !== 3) return dateString;
  return `${parts[2]}-${parts[1]}-${parts[0].substring(2)}`;
};

export default function AccesosPage() {
  const { message } = AntdApp.useApp()
  const screens = useBreakpoint();

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
      return { color: 'green', label: 'Disponible Ahora' }
    }

    if (option.YaValidadoHoy) {
      return { color: 'blue', label: 'Validado Hoy' }
    }

    if (!option.DentroBloqueHorario) {
      return { color: 'gold', label: 'Fuera de Horario' }
    }

    return { color: 'default', label: 'No Disponible' }
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
        title="Validación de accesos"
        subtitle="Busca al cliente y selecciona el beneficio a consumir o validar."
      />

      <AutoComplete
        style={{ width: '100%', marginBottom: 16 }}
        value={selectedCliente ? `${toCapitalCase(selectedCliente.NombreCompleto)} (${selectedCliente.Rut})` : search}
        onSearch={setSearch}
        notFoundContent={
          searchLoading ? (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <Spin description="Buscando clientes..." size="small" />
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
              <Avatar size="small" style={{ backgroundColor: '#374151', flexShrink: 0 }}>
                {cliente.NombreCompleto.charAt(0).toUpperCase()}
              </Avatar>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {toCapitalCase(cliente.NombreCompleto)}
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cliente.Rut} · {cliente.TipoCliente}
                </div>
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
          style={{ borderRadius: 12, fontSize: 16, padding: '10px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        />
      </AutoComplete>

      {result && (
        <Alert
          type={result.autorizado ? 'success' : 'error'}
          showIcon
          title={<Typography.Text strong style={{ fontSize: 16 }}>{result.mensaje}</Typography.Text>}
          style={{ marginBottom: 24, padding: 16, borderRadius: 12, border: result.autorizado ? '1px solid #b7eb8f' : '1px solid #ffa39e' }}
        />
      )}

      {preview && (
        <Card
          style={{ borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.06)', overflow: 'hidden' }}
          styles={{ body: { padding: screens.xs ? 16 : 24 } }}
          variant="borderless"
          loading={previewLoading}
        >
          <div style={{ display: 'flex', alignItems: screens.xs ? 'flex-start' : 'center', gap: 16, marginBottom: 8 }}>
            <Avatar size={screens.xs ? 56 : 64} style={{ backgroundColor: '#374151', fontSize: screens.xs ? 20 : 24, flexShrink: 0 }}>
              {preview.ClienteNombre.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <Typography.Title level={4} style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                  {toCapitalCase(preview.ClienteNombre)}
                </Typography.Title>
                {selectedCliente?.Rut && (
                  <Typography.Text type="secondary" style={{ fontSize: 14, whiteSpace: 'nowrap' }}>
                    {selectedCliente.Rut}
                  </Typography.Text>
                )}
              </div>
              <Space style={{ marginTop: 4 }} size="small" wrap>
                {selectedCliente?.TipoCliente && (
                  <Tag color="info" variant="filled">
                    {selectedCliente.TipoCliente.toUpperCase()}
                  </Tag>
                )}
                <Tag color={preview.EstadoCliente === 'activo' ? 'success' : 'error'} variant="filled">
                  {preview.EstadoCliente.toUpperCase()}
                </Tag>
              </Space>
            </div>
          </div>

          <Divider style={{ margin: '20px 0', borderColor: '#f0f0f0' }} />

          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1, fontWeight: 600 }}>
            Beneficios Disponibles
          </Typography.Text>

          {preview.Opciones.length === 0 ? (
            <Alert type="warning" showIcon title="No tiene pases o mensualidades activas" style={{ borderRadius: 8 }} />
          ) : screens.xs ? (
            <div style={{ display: 'grid', gap: 16 }}>
              {preview.Opciones.map((item) => {
                const optionState = getOptionState(item)
                return (
                  <Card
                    key={item.BeneficioClienteId}
                    size="small"
                    style={{ background: '#fafafa', borderRadius: 12, border: '1px solid #f0f0f0' }}
                    styles={{ body: { padding: 16 } }}
                  >
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                      <SafetyCertificateOutlined style={{ fontSize: 28, color: '#52c41a', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <Typography.Text strong style={{ fontSize: 15, lineHeight: 1.3 }}>
                            {item.ProductoNombre}
                          </Typography.Text>
                        </div>

                        <Space size={4} wrap style={{ marginTop: 2, marginBottom: 2 }}>
                          <Tag color={optionState.color} variant="filled" style={{ fontWeight: 500, border: 0, margin: 0 }}>
                            {optionState.label}
                          </Tag>
                          <Tag color="default" variant="filled" style={{ border: 0, margin: 0 }}>
                            {item.Estado.toUpperCase()}
                          </Tag>
                        </Space>

                        <div style={{ paddingTop: 2, borderRadius: 8, fontSize: 13, color: '#595959' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span><strong>Vigencia:</strong></span>
                            <span>{formatShortDate(item.FechaInicio)} al {formatShortDate(item.FechaTermino)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span><strong>Usos:</strong></span>
                            <span>{item.UsosConsumidos} / {item.UsosTotales ?? '∞'}</span>
                          </div>
                        </div>

                        {!item.PuedeValidarAhora && item.MotivoNoValidable && (
                          <div>
                            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                              {item.MotivoNoValidable}
                            </Typography.Text>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => void handleValidar(item, preview)}
                      style={{ borderRadius: 8, height: 44, fontSize: 15, fontWeight: 500 }}
                      disabled={!item.PuedeValidarAhora}
                      loading={validandoBeneficioId === item.BeneficioClienteId}
                      block
                    >
                      {item.PuedeValidarAhora ? 'Validar Acceso' : 'No Disponible'}
                    </Button>
                  </Card>
                )
              })}
            </div>
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
                        {item.PuedeValidarAhora ? 'Validar' : 'No Disponible'}
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<SafetyCertificateOutlined style={{ fontSize: 24, color: '#52c41a', marginTop: 4 }} />}
                      title={(
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Typography.Text strong style={{ fontSize: 15 }}>{item.ProductoNombre}</Typography.Text>
                          <Space size="small" wrap>
                            <Tag color={optionState.color} variant="filled" style={{ fontWeight: 400 }}>{optionState.label}</Tag>
                            <Tag color="default" variant="filled" style={{ fontWeight: 400 }}>{item.Estado.toUpperCase()}</Tag>
                          </Space>
                        </div>
                      )}
                      description={
                        <div style={{ marginTop: 4, display: 'grid', gap: 6 }}>
                          <div style={{ color: '#8c8c8c', fontSize: 13, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <span>Vigencia: {formatShortDate(item.FechaInicio)} al {formatShortDate(item.FechaTermino)}</span>
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
