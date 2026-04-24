import { Alert, App as AntdApp, Grid, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { AccesosPreviewCard } from '../../components/operacion/accesos/AccesosPreviewCard'
import { AccesosSearchBox } from '../../components/operacion/accesos/AccesosSearchBox'
import { formatClienteLabel } from '../../components/operacion/accesos/accesos.helpers'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { operacionService } from '../../services/operacion/operacionService'
import type { AccessOptionDto, AccessPreviewDto, ClienteLookupDto } from '../../types/models'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import styles from './AccesosPage.module.css'

const { useBreakpoint } = Grid

export default function AccesosPage() {
  const { message } = AntdApp.useApp()
  const screens = useBreakpoint()
  const isMobile = Boolean(screens.xs)

  const [search, setSearch] = useState('')
  const [clientes, setClientes] = useState<ClienteLookupDto[]>([])
  const [selectedCliente, setSelectedCliente] = useState<ClienteLookupDto | null>(null)
  const [preview, setPreview] = useState<AccessPreviewDto | null>(null)
  const [result, setResult] = useState<{ autorizado: boolean; mensaje: string } | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [validandoBeneficioId, setValidandoBeneficioId] = useState<number | null>(null)

  const searchValue = selectedCliente ? formatClienteLabel(selectedCliente) : search

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

  const handleSelectCliente = (cliente: ClienteLookupDto) => {
    setSelectedCliente(cliente)
    setSearch(formatClienteLabel(cliente))
    setResult(null)
  }

  const handleClearCliente = () => {
    setSelectedCliente(null)
    setPreview(null)
    setResult(null)
  }

  return (
    <div className="tms-page">
      <RequireCompanyAlert />

      <PageHeaderCard
        title="Validación de accesos"
        subtitle="Busca al cliente y selecciona el beneficio a consumir o validar."
      />

      <AccesosSearchBox
        value={searchValue}
        search={search}
        loading={searchLoading}
        clientes={clientes}
        onSearch={setSearch}
        onSelectCliente={handleSelectCliente}
        onClear={handleClearCliente}
      />

      {result && (
        <Alert
          type={result.autorizado ? 'success' : 'error'}
          showIcon
          title={<Typography.Text strong className={styles.resultTitle}>{result.mensaje}</Typography.Text>}
          className={`${styles.resultAlert} ${result.autorizado ? styles.resultAlertSuccess : styles.resultAlertError}`}
        />
      )}

      {preview && (
        <AccesosPreviewCard
          preview={preview}
          selectedCliente={selectedCliente}
          isMobile={isMobile}
          loading={previewLoading}
          validandoBeneficioId={validandoBeneficioId}
          onValidar={handleValidar}
        />
      )}
    </div>
  )
}
