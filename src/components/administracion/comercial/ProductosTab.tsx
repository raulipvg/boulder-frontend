import { ArrowRightOutlined, CheckOutlined, CloseOutlined, DownOutlined, EditOutlined, RightOutlined } from '@ant-design/icons'
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Empty,
  Form,
  Grid,
  Input,
  Modal,
  Select,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { administracionService } from '../../../services/administracion/administracionService'
import type { ClaseAgendaDto, LookupDto, ProductoDto, TarifaProductoResumenDto, TipoClienteDto } from '../../../types/models'
import { getApiErrorMessage } from '../../../utils/getApiErrorMessage'

export interface ProductosTabHandle {
  openCreate: () => void
  reload: () => Promise<void>
}

const { useBreakpoint } = Grid

const DAY_OPTIONS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM']

const yesNoTag = (value: boolean, yesLabel: string, noLabel: string) => (
  <Tag color={value ? 'green' : 'red'}>{value ? yesLabel : noLabel}</Tag>
)

const currencyFormatter = new Intl.NumberFormat('es-CL')

const formatCurrency = (value?: number | null) => (value == null ? '-' : `$${currencyFormatter.format(value)}`)

const formatVigenciaRange = (desde: string, hasta: string) => {
  const fmt = (value: string) => {
    const [year, month, day] = value.split('-').map(Number)
    return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(year, month - 1, day))
  }
  return { desde: fmt(desde), hasta: fmt(hasta) }
}

const PRODUCT_TYPE_META: Record<string, { label: string; color: string }> = {
  TICKET_INDIVIDUAL: { label: 'Ticket individual', color: 'blue' },
  PACK_TICKETS: { label: 'Pack de tickets', color: 'gold' },
  MENSUALIDAD_POR_HORARIO: { label: 'Mensualidad por horario', color: 'geekblue' },
  MENSUALIDAD_TODO_HORARIO: { label: 'Mensualidad todo horario', color: 'cyan' },
  CLASES: { label: 'Clases', color: 'magenta' },
  ARRIENDO_ZAPATILLAS: { label: 'Arriendo de zapatillas', color: 'volcano' },
  PRODUCTO_CAJA: { label: 'Producto de caja', color: 'green' },
}

const renderTipoProductoTag = (codigo: string) => {
  const meta = PRODUCT_TYPE_META[codigo]
  if (!meta) {
    return <Tag>{codigo}</Tag>
  }
  return <Tag color={meta.color}>{meta.label}</Tag>
}

const getTipoProductoLabel = (codigo: string, nombre: string) => {
  if (codigo === 'CLASES' || codigo === 'CLASES_CON_PROFESOR') {
    return 'Clases'
  }
  return nombre
}

const ProductosTab = forwardRef<ProductosTabHandle>(function ProductosTab(_props, ref) {
  const { message } = AntdApp.useApp()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const [items, setItems] = useState<ProductoDto[]>([])
  const [tipos, setTipos] = useState<LookupDto[]>([])
  const [tiposCliente, setTiposCliente] = useState<TipoClienteDto[]>([])
  const [bloques, setBloques] = useState<LookupDto[]>([])
  const [clases, setClases] = useState<ClaseAgendaDto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ProductoDto | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([])
  const [tarifasByProducto, setTarifasByProducto] = useState<Record<number, TarifaProductoResumenDto[]>>({})
  const [tarifasLoadingByProducto, setTarifasLoadingByProducto] = useState<Record<number, boolean>>({})
  const [tarifasErrorByProducto, setTarifasErrorByProducto] = useState<Record<number, string>>({})
  const [tarifaOpen, setTarifaOpen] = useState(false)
  const [tarifaEditing, setTarifaEditing] = useState<TarifaProductoResumenDto | null>(null)
  const [tarifaSubmitting, setTarifaSubmitting] = useState(false)
  const [tarifaTodoHorario, setTarifaTodoHorario] = useState(false)
  const [tarifasBatchOpen, setTarifasBatchOpen] = useState(false)
  const [tarifasBatchProductoId, setTarifasBatchProductoId] = useState<number | null>(null)
  const [tarifasBatchSubmitting, setTarifasBatchSubmitting] = useState(false)
  const [form] = Form.useForm()
  const [tarifaForm] = Form.useForm()
  const [tarifasBatchForm] = Form.useForm()

  const selectedTipoProductoBaseId = Form.useWatch('TipoProductoBaseId', form)
  const selectedModoPrecio = Form.useWatch('ModoPrecio', form)
  const selectedActivo = Form.useWatch('Activo', form)
  const selectedTipoCodigo = useMemo(
    () => tipos.find((tipo) => tipo.Id === selectedTipoProductoBaseId)?.Codigo,
    [selectedTipoProductoBaseId, tipos],
  )
  const requiresTarifaAsociada = selectedModoPrecio === 'tarifa'
  const hasTarifaAsociada = editingItem?.TarifaAsociada ?? false

  useEffect(() => {
    if (requiresTarifaAsociada && !hasTarifaAsociada) {
      form.setFieldsValue({ VisiblePos: false, Activo: false })
    }
  }, [form, hasTarifaAsociada, requiresTarifaAsociada])

  useEffect(() => {
    if (selectedActivo === false) {
      form.setFieldValue('VisiblePos', false)
    }
  }, [form, selectedActivo])

  const isMensualidadPorHorario = selectedTipoCodigo === 'MENSUALIDAD_POR_HORARIO'
  const isMensualidadTodoHorario = selectedTipoCodigo === 'MENSUALIDAD_TODO_HORARIO'
  const isMensualidad = isMensualidadPorHorario || isMensualidadTodoHorario
  const isPackTickets = selectedTipoCodigo === 'PACK_TICKETS' || selectedTipoCodigo === 'PACK_10_TICKETS'
  const isClases = selectedTipoCodigo === 'CLASES'
  const isProductoCaja = selectedTipoCodigo === 'PRODUCTO_CAJA'
  const isTicketIndividual = selectedTipoCodigo === 'TICKET_INDIVIDUAL'

  const createTarifaBatchRowDefault = () => ({
    TipoClienteId: undefined,
    TipoDias: [] as string[],
    TodoHorario: true,
    BloqueHorarioComercialId: undefined,
    Precio: undefined,
    VigenciaRango: [dayjs(), dayjs().add(1, 'month')],
    Activo: true,
  })

  const load = async () => {
    setLoading(true)
    try {
      const [productos, tiposBase, tiposClienteData, bloquesData, clasesData] = await Promise.all([
        administracionService.getProductos(),
        administracionService.getTiposProductoBase(),
        administracionService.getTiposCliente(),
        administracionService.getBloques(),
        administracionService.getClases(),
      ])
      setItems(productos)
      setTipos(tiposBase)
      setTiposCliente(tiposClienteData)
      setBloques(bloquesData)
      setClases(clasesData)
      setExpandedRowKeys([])
      setTarifasByProducto({})
      setTarifasLoadingByProducto({})
      setTarifasErrorByProducto({})
    } finally {
      setLoading(false)
    }
  }

  const loadTarifasByProducto = async (productoEmpresaId: number, force = false) => {
    if (tarifasLoadingByProducto[productoEmpresaId]) {
      return
    }

    if (tarifasByProducto[productoEmpresaId] && !force) {
      return
    }

    setTarifasLoadingByProducto((prev) => ({ ...prev, [productoEmpresaId]: true }))
    setTarifasErrorByProducto((prev) => {
      const next = { ...prev }
      delete next[productoEmpresaId]
      return next
    })

    try {
      const tarifas = await administracionService.getTarifasByProducto(productoEmpresaId)
      setTarifasByProducto((prev) => ({ ...prev, [productoEmpresaId]: tarifas }))
    } catch (error) {
      setTarifasErrorByProducto((prev) => ({
        ...prev,
        [productoEmpresaId]: getApiErrorMessage(error, 'No se pudieron cargar las tarifas asociadas.'),
      }))
    } finally {
      setTarifasLoadingByProducto((prev) => ({ ...prev, [productoEmpresaId]: false }))
    }
  }

  const toggleExpandedTarifas = (record: ProductoDto) => {
    const productoEmpresaId = record.ProductoEmpresaId
    const isExpanded = expandedRowKeys.includes(productoEmpresaId)

    if (isExpanded) {
      setExpandedRowKeys([])
      return
    }

    setExpandedRowKeys([productoEmpresaId])
    void loadTarifasByProducto(productoEmpresaId)
  }

  const tarifasDetalleColumns: ColumnsType<TarifaProductoResumenDto> = [
    {
      title: 'Escalador',
      key: 'TipoClienteNombre',
      render: (_, tarifa) => tarifa.TipoClienteNombre || 'Sin tipo cliente',
    },
    {
      title: 'Dias',
      key: 'TipoDia',
      render: (_, tarifa) => tarifa.TipoDia || 'Todos los dias',
    },
    {
      title: 'Bloque',
      key: 'BloqueHorario',
      render: (_, tarifa) =>
        tarifa.BloqueHorarioNombre ? (
          <Typography.Text strong>
            {tarifa.BloqueHorarioNombre} ({tarifa.HoraInicio}-{tarifa.HoraFin})
          </Typography.Text>
        ) : (
          'Todo horario'
        ),
    },
    {
      title: 'Precio',
      key: 'Precio',
      align: 'right',
      render: (_, tarifa) => <Typography.Text strong>{formatCurrency(tarifa.Precio)}</Typography.Text>,
    },
    {
      title: 'Vigencia',
      key: 'Vigencia',
      align: 'right',
      render: (_, tarifa) => {
        const { desde, hasta } = formatVigenciaRange(tarifa.VigenciaDesde, tarifa.VigenciaHasta)
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Tag color="blue" style={{ margin: 0 }}>{desde}</Tag>
            <ArrowRightOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
            <Tag color="cyan" style={{ margin: 0 }}>{hasta}</Tag>
          </span>
        )
      },
    },
    {
      title: 'Estado',
      key: 'Activo',
      align: 'center',
      render: (_, tarifa) => <Tag color={tarifa.Activo ? 'green' : 'default'}>{tarifa.Activo ? 'Activa' : 'Inactiva'}</Tag>,
    },
    {
      title: '',
      key: 'acciones',
      align: 'center',
      width: 60,
      render: (_, record) => (
        <Tooltip title="Editar">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openTarifaEdit(record)} />
        </Tooltip>
      ),
    },
  ]

  const renderTarifasSubtable = (record: ProductoDto) => {
    const productoEmpresaId = record.ProductoEmpresaId
    const tarifas = tarifasByProducto[productoEmpresaId] ?? []
    const loadingTarifas = Boolean(tarifasLoadingByProducto[productoEmpresaId])
    const errorTarifas = tarifasErrorByProducto[productoEmpresaId]

    if (errorTarifas) {
      return (
        <Alert
          type="error"
          showIcon
          message={errorTarifas}
          action={(
            <Button type="link" size="small" onClick={() => void loadTarifasByProducto(productoEmpresaId, true)}>
              Reintentar
            </Button>
          )}
        />
      )
    }

    if (!loadingTarifas && !tarifas.length) {
      return (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Sin tarifas asociadas">
          <Button type="primary" onClick={() => openTarifasBatch(record.ProductoEmpresaId)}>Asociar tarifas</Button>
        </Empty>
      )
    }

    return (
      <Table
        rowKey="TarifaProductoId"
        columns={tarifasDetalleColumns}
        dataSource={tarifas}
        loading={loadingTarifas}
        size="small"
        pagination={false}
        tableLayout="auto"
        scroll={{ x: 900 }}
      />
    )
  }

  const openTarifaEdit = (record: TarifaProductoResumenDto) => {
    const isTodoHorario = !record.BloqueHorarioComercialId
    setTarifaEditing(record)
    setTarifaTodoHorario(isTodoHorario)
    tarifaForm.setFieldsValue({
      TipoDias: (record.TipoDia ?? '').split(',').filter(Boolean),
      BloqueHorarioComercialId: record.BloqueHorarioComercialId ?? undefined,
      TodoHorario: isTodoHorario,
      Precio: record.Precio,
      VigenciaRango: [dayjs(record.VigenciaDesde), dayjs(record.VigenciaHasta)],
      Activo: record.Activo,
    })
    setTarifaOpen(true)
  }

  const openTarifasBatch = (productoEmpresaId: number) => {
    setTarifasBatchProductoId(productoEmpresaId)
    tarifasBatchForm.setFieldsValue({
      Tarifas: [createTarifaBatchRowDefault()],
    })
    setTarifasBatchOpen(true)
  }

  const closeTarifasBatchModal = () => {
    setTarifasBatchOpen(false)
    setTarifasBatchProductoId(null)
    tarifasBatchForm.resetFields()
  }

  const closeTarifaModal = () => {
    setTarifaOpen(false)
    setTarifaEditing(null)
    setTarifaTodoHorario(false)
    tarifaForm.resetFields()
  }

  const handleTarifaSubmit = async (values: Record<string, unknown>) => {
    if (!tarifaEditing) return
    setTarifaSubmitting(true)
    try {
      const tipoDiasVal = values.TipoDias as string[] | undefined
      const selectedDays = Array.isArray(tipoDiasVal)
        ? DAY_OPTIONS.filter((day) => tipoDiasVal.includes(day))
        : []

      const payload = {
        ProductoEmpresaId: tarifaEditing.ProductoEmpresaId,
        TipoClienteId: tarifaEditing.TipoClienteId,
        BloqueHorarioComercialId: tarifaTodoHorario ? null : (values.BloqueHorarioComercialId ?? null),
        TipoDia: selectedDays.join(','),
        Precio: values.Precio,
        VigenciaDesde: ((values.VigenciaRango as dayjs.Dayjs[])[0]).format('YYYY-MM-DD'),
        VigenciaHasta: ((values.VigenciaRango as dayjs.Dayjs[])[1]).format('YYYY-MM-DD'),
        Activo: values.Activo,
      }

      await administracionService.updateTarifa(tarifaEditing.TarifaProductoId, payload)
      message.success('Tarifa actualizada correctamente.')

      closeTarifaModal()
      await load()
      setExpandedRowKeys([tarifaEditing.ProductoEmpresaId])
      await loadTarifasByProducto(tarifaEditing.ProductoEmpresaId, true)
    } catch (error) {
      message.error(getApiErrorMessage(error, 'No se pudo actualizar la tarifa.'))
    } finally {
      setTarifaSubmitting(false)
    }
  }

  const handleTarifasBatchSubmit = async (values: Record<string, unknown>) => {
    if (!tarifasBatchProductoId) return

    const tarifasRaw = (values.Tarifas as Array<Record<string, unknown>> | undefined) ?? []
    if (!tarifasRaw.length) {
      message.error('Debes agregar al menos una línea de tarifa.')
      return
    }

    const duplicates = new Set<string>()

    const tarifasPayload = tarifasRaw.map((linea, index) => {
      const lineNumber = index + 1
      const tipoClienteId = Number(linea.TipoClienteId)
      const tipoDiasValue = linea.TipoDias as string[] | undefined
      const tipoDias = Array.isArray(tipoDiasValue) ? DAY_OPTIONS.filter((day) => tipoDiasValue.includes(day)) : []
      const vigenciaRango = linea.VigenciaRango as dayjs.Dayjs[] | undefined
      const todoHorario = Boolean(linea.TodoHorario)
      const bloqueHorarioComercialId = todoHorario ? null : (linea.BloqueHorarioComercialId ?? null)

      if (!Number.isFinite(tipoClienteId) || tipoClienteId <= 0) {
        throw new Error(`Línea ${lineNumber}: Debes seleccionar tipo de cliente.`)
      }

      if (!tipoDias.length) {
        throw new Error(`Línea ${lineNumber}: Debes seleccionar al menos un día.`)
      }

      if (!vigenciaRango || vigenciaRango.length !== 2) {
        throw new Error(`Línea ${lineNumber}: Debes definir vigencia desde y hasta.`)
      }

      const precio = Number(linea.Precio)
      if (!Number.isFinite(precio) || precio <= 0) {
        throw new Error(`Línea ${lineNumber}: El precio debe ser mayor a 0.`)
      }

      if (!todoHorario && !bloqueHorarioComercialId) {
        throw new Error(`Línea ${lineNumber}: Debes seleccionar un bloque horario o marcar Todo horario.`)
      }

      const vigenciaDesde = vigenciaRango[0].format('YYYY-MM-DD')
      const vigenciaHasta = vigenciaRango[1].format('YYYY-MM-DD')
      const duplicateKey = `${tipoClienteId}|${bloqueHorarioComercialId ?? 'ALL'}|${tipoDias.join(',')}|${vigenciaDesde}|${vigenciaHasta}`

      if (duplicates.has(duplicateKey)) {
        throw new Error(`Línea ${lineNumber}: Duplicada con otra línea (tipo cliente, bloque, días y vigencia).`)
      }

      duplicates.add(duplicateKey)

      return {
        TipoClienteId: tipoClienteId,
        TipoDia: tipoDias.join(','),
        BloqueHorarioComercialId: bloqueHorarioComercialId,
        Precio: precio,
        VigenciaDesde: vigenciaDesde,
        VigenciaHasta: vigenciaHasta,
        Activo: linea.Activo ?? true,
      }
    })

    setTarifasBatchSubmitting(true)
    try {
      await administracionService.createTarifasBatch({
        ProductoEmpresaId: tarifasBatchProductoId,
        Tarifas: tarifasPayload,
      })

      message.success('Tarifas asociadas correctamente.')
      closeTarifasBatchModal()
      await load()
      setExpandedRowKeys([tarifasBatchProductoId])
      await loadTarifasByProducto(tarifasBatchProductoId, true)
    } catch (error) {
      message.error(getApiErrorMessage(error, 'No se pudieron asociar las tarifas.'))
    } finally {
      setTarifasBatchSubmitting(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const openCreate = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({
      ModoPrecio: 'fijo',
      VisiblePos: true,
      Activo: true,
      RequiereCliente: false,
      GeneraBeneficio: false,
      AccesoIlimitado: false,
    })
    setOpen(true)
  }

  const openEdit = (record: ProductoDto) => {
    setEditingItem(record)
    form.setFieldsValue({
      TipoProductoBaseId: tipos.find((tipo) => tipo.Codigo === record.TipoProductoBaseCodigo)?.Id,
      NombreComercial: record.NombreComercial,
      Descripcion: record.Descripcion ?? undefined,
      ModoPrecio: record.ModoPrecio,
      PrecioFijo: record.PrecioFijo ?? undefined,
      VigenciaDias: record.VigenciaDias ?? undefined,
      UsosIncluidos: record.UsosIncluidos ?? undefined,
      BloqueHorarioComercialId: record.BloqueHorarioComercialId ?? undefined,
      ClaseId: record.ClaseId ?? undefined,
      VisiblePos: record.VisiblePos,
      Activo: record.Activo,
      RequiereCliente: record.RequiereCliente,
      GeneraBeneficio: record.GeneraBeneficio,
      AccesoIlimitado: record.AccesoIlimitado,
    })
    setOpen(true)
  }

  useImperativeHandle(ref, () => ({
    openCreate,
    reload: load,
  }))

  useEffect(() => {
    if (!isMensualidad) return
    form.setFieldsValue({
      ModoPrecio: 'tarifa',
      PrecioFijo: undefined,
      UsosIncluidos: undefined,
      ClaseId: undefined,
      RequiereCliente: true,
      GeneraBeneficio: true,
      AccesoIlimitado: true,
      VigenciaDias: 30,
      BloqueHorarioComercialId: isMensualidadTodoHorario ? undefined : form.getFieldValue('BloqueHorarioComercialId'),
    })
  }, [form, isMensualidad, isMensualidadTodoHorario])

  useEffect(() => {
    if (!isPackTickets) return
    form.setFieldsValue({
      ModoPrecio: 'tarifa',
      PrecioFijo: undefined,
      ClaseId: undefined,
      RequiereCliente: true,
      GeneraBeneficio: true,
      AccesoIlimitado: false,
      UsosIncluidos: form.getFieldValue('UsosIncluidos') ?? 10,
      VigenciaDias: form.getFieldValue('VigenciaDias') ?? 60,
    })
  }, [form, isPackTickets])

  useEffect(() => {
    if (!isClases) return
    form.setFieldsValue({
      ModoPrecio: 'tarifa',
      PrecioFijo: undefined,
      BloqueHorarioComercialId: undefined,
      RequiereCliente: true,
      GeneraBeneficio: true,
      AccesoIlimitado: false,
      VigenciaDias: 30,
    })
  }, [form, isClases])

  useEffect(() => {
    if (!isProductoCaja) return
    form.setFieldsValue({
      ModoPrecio: 'fijo',
      VigenciaDias: undefined,
      UsosIncluidos: undefined,
      BloqueHorarioComercialId: undefined,
      ClaseId: undefined,
      RequiereCliente: false,
      GeneraBeneficio: false,
      AccesoIlimitado: false,
    })
  }, [form, isProductoCaja])

  useEffect(() => {
    if (!isTicketIndividual) return
    form.setFieldsValue({
      ModoPrecio: 'tarifa',
      PrecioFijo: undefined,
      VigenciaDias: undefined,
      UsosIncluidos: 1,
      ClaseId: undefined,
      RequiereCliente: true,
      GeneraBeneficio: false,
      AccesoIlimitado: false,
    })
  }, [form, isTicketIndividual])

  const showModoPrecio = !isMensualidad && !isPackTickets && !isClases && !isProductoCaja && !isTicketIndividual
  const showPrecioFijo = isProductoCaja || showModoPrecio
  const showVigenciaDias = !isMensualidad && !isProductoCaja && !isTicketIndividual
  const showUsosIncluidos = !isMensualidad && !isProductoCaja && !isTicketIndividual
  const showBloqueHorario = isMensualidadPorHorario || isPackTickets || isTicketIndividual || (!isMensualidad && !isClases && !isProductoCaja)
  const showClase = !isMensualidad && !isPackTickets && !isProductoCaja && !isTicketIndividual
  const showSwitchesCliente = !isMensualidad && !isPackTickets && !isClases && !isProductoCaja && !isTicketIndividual

  const bloqueRequerido = isMensualidadPorHorario || isTicketIndividual

  const buildPayload = (values: Record<string, unknown>, tipoCodigo: string | undefined) => {
    switch (tipoCodigo) {
      case 'MENSUALIDAD_POR_HORARIO':
      case 'MENSUALIDAD_TODO_HORARIO':
        return {
          ...values,
          ModoPrecio: 'tarifa',
          PrecioFijo: null,
          UsosIncluidos: null,
          ClaseId: null,
          RequiereCliente: true,
          GeneraBeneficio: true,
          AccesoIlimitado: true,
          VigenciaDias: 30,
          BloqueHorarioComercialId: tipoCodigo === 'MENSUALIDAD_POR_HORARIO' ? values.BloqueHorarioComercialId ?? null : null,
        }
      case 'PACK_TICKETS':
      case 'PACK_10_TICKETS':
        return {
          ...values,
          ModoPrecio: 'tarifa',
          PrecioFijo: null,
          ClaseId: null,
          RequiereCliente: true,
          GeneraBeneficio: true,
          AccesoIlimitado: false,
        }
      case 'CLASES':
        return {
          ...values,
          ModoPrecio: 'tarifa',
          PrecioFijo: null,
          BloqueHorarioComercialId: null,
          RequiereCliente: true,
          GeneraBeneficio: true,
          AccesoIlimitado: false,
          VigenciaDias: 30,
        }
      case 'PRODUCTO_CAJA':
        return {
          ...values,
          ModoPrecio: 'fijo',
          VigenciaDias: null,
          UsosIncluidos: null,
          BloqueHorarioComercialId: null,
          ClaseId: null,
          RequiereCliente: false,
          GeneraBeneficio: false,
          AccesoIlimitado: false,
        }
      case 'TICKET_INDIVIDUAL':
        return {
          ...values,
          ModoPrecio: 'tarifa',
          PrecioFijo: null,
          VigenciaDias: null,
          UsosIncluidos: 1,
          ClaseId: null,
          RequiereCliente: true,
          GeneraBeneficio: false,
          AccesoIlimitado: false,
        }
      default:
        return values
    }
  }

  const usosLabel = isPackTickets ? 'Cantidad de tickets del pack' : isClases ? 'Cantidad de clases' : 'Usos incluidos'

  const columns: ColumnsType<ProductoDto> = [
    { title: 'Producto', dataIndex: 'NombreComercial', key: 'NombreComercial', render: (value) => <Typography.Text strong>{value}</Typography.Text> },
    {
      title: 'Tipo Producto',
      dataIndex: 'TipoProductoBaseCodigo',
      key: 'TipoProductoBaseCodigo',
      responsive: ['md'],
      render: (value) => renderTipoProductoTag(value),
    },
    {
      title: 'Modo',
      dataIndex: 'ModoPrecio',
      key: 'ModoPrecio',
      responsive: ['lg'],
      render: (value) => <Typography.Text italic>{value}</Typography.Text>,
    },
    {
      title: 'Precio',
      key: 'PrecioFijo',
      responsive: ['lg'],
      render: (_, record) =>
        record.ModoPrecio === 'tarifa' ? (
          <Button
            type="link"
            size="small"
            style={{ padding: 0, height: 'auto', fontWeight: 600 }}
            onClick={(event) => {
              event.stopPropagation()
              toggleExpandedTarifas(record)
            }}
          >
            Varios {expandedRowKeys.includes(record.ProductoEmpresaId) ? <DownOutlined /> : <RightOutlined />}
          </Button>
        ) : (
          <Typography.Text strong>{formatCurrency(record.PrecioFijo)}</Typography.Text>
        ),
    },
    {
      title: 'Tarifa',
      key: 'TarifaAsociada',
      responsive: ['md'],
      align: 'center',
      render: (_, record) =>
        record.TarifaAsociada ? (
          <CheckOutlined style={{ color: '#52c41a', fontSize: 16 }} />
        ) : (
          <CloseOutlined style={{ color: '#999999', fontSize: 16 }} />
        ),
    },
    {
      title: 'POS',
      key: 'VisiblePos',
      responsive: ['sm'],
      align: 'center',
      render: (_, record) =>
        record.VisiblePos ? (
          <CheckOutlined style={{ color: '#52c41a', fontSize: 16 }} />
        ) : (
          <CloseOutlined style={{ color: '#999999', fontSize: 16 }} />
        ),
    },
    {
      title: 'Activo',
      key: 'Activo',
      responsive: ['sm'],
      align: 'center',
      render: (_, record) => yesNoTag(record.Activo, 'Activo', 'Inactivo'),
    },
    {
      title: 'ACCIONES',
      key: 'acciones',
      align: 'center',
      render: (_, record) => (
        <Tooltip title="Editar">
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
        </Tooltip>
      ),
    },
  ]

  return (
    <>
      <Card className="tms-page-table-card" variant="borderless" style={{ boxShadow: 'none' }} loading={loading} >
        {isMobile ? (
          items.length > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {items.map((record) => (
                <Card size="small" key={record.ProductoEmpresaId}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{record.NombreComercial}</div>
                      <div style={{ marginTop: 4 }}>{renderTipoProductoTag(record.TipoProductoBaseCodigo)}</div>
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {record.VisiblePos ? (
                          <CheckOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                        ) : (
                          <CloseOutlined style={{ color: '#999999', fontSize: 16 }} />
                        )}
                        <span style={{ marginLeft: 4 }}>POS</span>
                        {yesNoTag(record.Activo, 'Activo', 'Inactivo')}
                        {record.TarifaAsociada ? (
                          <CheckOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                        ) : (
                          <CloseOutlined style={{ color: '#999999', fontSize: 16 }} />
                        )}
                        <span style={{ marginLeft: 4 }}>Tarifa</span>
                      </div>
                    </div>

                    <Tooltip title="Editar">
                      <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
                    </Tooltip>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Empty description="Sin productos registrados" />
          )
        ) : (
          <Table
            rowKey="ProductoEmpresaId"
            columns={columns}
            dataSource={items}
            expandable={{
              expandedRowKeys,
              expandedRowRender: (record) => renderTarifasSubtable(record),
              rowExpandable: (record) => record.ModoPrecio === 'tarifa',
              showExpandColumn: false,
              expandedRowClassName: () => 'tms-producto-tarifas-row',
            }}
            scroll={{ x: 980 }}
            tableLayout="auto"
            pagination={false}
          />
        )}
      </Card>

      <Modal
        open={open}
        title={editingItem ? 'Editar producto' : 'Nuevo producto'}
        onCancel={() => {
          setOpen(false)
          setEditingItem(null)
        }}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        destroyOnHidden
        width={720}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            ModoPrecio: 'fijo',
            VisiblePos: true,
            Activo: true,
            RequiereCliente: false,
            GeneraBeneficio: false,
            AccesoIlimitado: false,
          }}
          onFinish={async (values) => {
            setSubmitting(true)
            try {
              const tipoCodigo = tipos.find((tipo) => tipo.Id === values.TipoProductoBaseId)?.Codigo
              const payload = buildPayload(values, tipoCodigo)

              if (editingItem) {
                await administracionService.updateProducto(editingItem.ProductoEmpresaId, payload)
                message.success('Producto actualizado correctamente.')
              } else {
                const createdProducto = await administracionService.createProducto(payload)
                message.success('Producto creado correctamente.')
                if (payload.ModoPrecio === 'tarifa') {
                  openTarifasBatch(createdProducto.ProductoEmpresaId)
                }
              }

              setOpen(false)
              setEditingItem(null)
              form.resetFields()
              await load()
            } catch (error) {
              message.error(getApiErrorMessage(error, `No se pudo ${editingItem ? 'actualizar' : 'crear'} el producto.`))
            } finally {
              setSubmitting(false)
            }
          }}
        >
          <div className="grid-two">
            <Form.Item name="TipoProductoBaseId" label="Tipo Producto" rules={[{ required: true }]}>
              <Select options={tipos.map((tipo) => ({ value: tipo.Id, label: getTipoProductoLabel(tipo.Codigo, tipo.Nombre) }))} />
            </Form.Item>

            {selectedTipoCodigo && (
              <Form.Item name="NombreComercial" label="Nombre Producto" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            )}

            {selectedTipoCodigo && (
              <Form.Item name="Descripcion" label="Descripción">
                <Input />
              </Form.Item>
            )}

            {selectedTipoCodigo && showModoPrecio && (
              <Form.Item name="ModoPrecio" label="Modo precio" rules={[{ required: true }]}>
                <Select options={[{ value: 'fijo', label: 'Fijo' }, { value: 'tarifa', label: 'Tarifa' }]} />
              </Form.Item>
            )}

            {selectedTipoCodigo && showPrecioFijo && (
              <Form.Item
                name="PrecioFijo"
                label="Precio fijo"
                rules={isProductoCaja ? [{ required: true, message: 'El precio fijo es obligatorio.' }] : undefined}
              >
                <Input type="number" />
              </Form.Item>
            )}

            {selectedTipoCodigo && showVigenciaDias && (
              <Form.Item name="VigenciaDias" label="Vigencia días">
                <Input type="number" />
              </Form.Item>
            )}

            {selectedTipoCodigo && showUsosIncluidos && (
              <Form.Item name="UsosIncluidos" label={usosLabel}>
                <Input type="number" />
              </Form.Item>
            )}

            {selectedTipoCodigo && showBloqueHorario && (
              <Form.Item
                name="BloqueHorarioComercialId"
                label="Bloque horario"
                rules={bloqueRequerido ? [{ required: true, message: 'Selecciona un bloque horario.' }] : undefined}
              >
                <Select allowClear options={bloques.map((bloque) => ({ value: bloque.Id, label: bloque.Nombre }))} />
              </Form.Item>
            )}

            {selectedTipoCodigo && showClase && (
              <Form.Item
                name="ClaseId"
                label="Clase"
                rules={isClases ? [{ required: true, message: 'Selecciona una clase.' }] : undefined}
              >
                <Select allowClear options={clases.map((clase) => ({ value: clase.ClaseId, label: clase.Nombre }))} />
              </Form.Item>
            )}
          </div>

          <div className="grid-two">
            {selectedTipoCodigo && (
              <Form.Item name="VisiblePos" label="Visible POS" valuePropName="checked">
                <Switch disabled={(requiresTarifaAsociada && !hasTarifaAsociada) || selectedActivo === false} />
              </Form.Item>
            )}
            {selectedTipoCodigo && (
              <Form.Item name="Activo" label="Activo" valuePropName="checked">
                <Switch disabled={requiresTarifaAsociada && !hasTarifaAsociada} />
              </Form.Item>
            )}
            {selectedTipoCodigo && showSwitchesCliente && (
              <>
                <Form.Item name="RequiereCliente" label="Requiere cliente" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name="GeneraBeneficio" label="Genera beneficio" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name="AccesoIlimitado" label="Acceso ilimitado" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </>
            )}
          </div>

          {selectedTipoCodigo && requiresTarifaAsociada && !hasTarifaAsociada && (
            <Alert
              type="warning"
              showIcon
              message="El producto no tiene tarifa activa asociada"
              description="Mientras no tenga una tarifa activa asociada, este producto no puede estar activo ni visible en POS."
              action={editingItem ? <Button type="link" onClick={() => {
                setOpen(false)
                openTarifasBatch(editingItem.ProductoEmpresaId)
              }}>
                Asociar tarifas
              </Button> : undefined}
            />
          )}
        </Form>
      </Modal>

      <Modal
        open={tarifaOpen}
        title={tarifaEditing ? 'Editar tarifa' : 'Asociar tarifa'}
        onCancel={closeTarifaModal}
        onOk={() => tarifaForm.submit()}
        confirmLoading={tarifaSubmitting}
        destroyOnHidden
      >
        <Form form={tarifaForm} layout="vertical" onFinish={handleTarifaSubmit}>
          <Form.Item
            name="TipoDias"
            label="Dias aplicables"
            rules={[{ required: true, type: 'array', min: 1, message: 'Selecciona al menos un dia.' }]}
          >
            <Checkbox.Group options={DAY_OPTIONS.map((day) => ({ value: day, label: day }))} />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <Form.Item name="BloqueHorarioComercialId" label="Bloque horario" style={{ flex: 1, marginBottom: 0 }}>
              <Select
                allowClear
                disabled={tarifaTodoHorario}
                options={bloques.map((bloque) => ({ value: bloque.Id, label: bloque.Nombre }))}
              />
            </Form.Item>
            <Form.Item name="TodoHorario" label="Todo horario" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch
                onChange={(checked) => {
                  setTarifaTodoHorario(checked)
                  if (checked) {
                    tarifaForm.setFieldValue('BloqueHorarioComercialId', undefined)
                  }
                }}
              />
            </Form.Item>
          </div>
          <Form.Item name="Precio" label="Precio" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="VigenciaRango" label="Vigencia" rules={[{ required: true, message: 'Selecciona vigencia desde y hasta.' }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
          </Form.Item>
          <Form.Item name="Activo" label="Activa" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={tarifasBatchOpen}
        title="Asociar tarifas"
        onCancel={closeTarifasBatchModal}
        onOk={() => tarifasBatchForm.submit()}
        confirmLoading={tarifasBatchSubmitting}
        destroyOnHidden
        width={860}
      >
        <Form form={tarifasBatchForm} layout="vertical" onFinish={handleTarifasBatchSubmit}>
          <Form.List name="Tarifas">
            {(fields, { add, remove }) => (
              <div style={{ display: 'grid', gap: 12 }}>
                {fields.map((field) => (
                  <Card key={field.key} size="small" style={{ borderColor: '#e5e7eb' }}>
                    <div style={{ display: 'grid', gap: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Form.Item
                          name={[field.name, 'TipoClienteId']}
                          label="Tipo de cliente"
                          rules={[{ required: true, message: 'Selecciona tipo de cliente.' }]}
                        >
                          <Select options={tiposCliente.map((tipo) => ({ value: tipo.TipoClienteId, label: tipo.Nombre }))} />
                        </Form.Item>

                        <Form.Item
                          name={[field.name, 'Precio']}
                          label="Precio"
                          rules={[
                            { required: true, message: 'Ingresa precio.' },
                            {
                              validator: async (_, value) => {
                                if (value == null || Number(value) > 0) return
                                throw new Error('El precio debe ser mayor a 0.')
                              },
                            },
                          ]}
                        >
                          <Input type="number" />
                        </Form.Item>
                      </div>

                      <Form.Item
                        name={[field.name, 'TipoDias']}
                        label="Días aplicables"
                        rules={[{ required: true, type: 'array', min: 1, message: 'Selecciona al menos un día.' }]}
                      >
                        <Checkbox.Group options={DAY_OPTIONS.map((day) => ({ value: day, label: day }))} />
                      </Form.Item>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'flex-end' }}>
                        <Form.Item shouldUpdate noStyle>
                          {({ getFieldValue }) => {
                            const todoHorario = Boolean(getFieldValue(['Tarifas', field.name, 'TodoHorario']))
                            return (
                              <Form.Item
                                name={[field.name, 'BloqueHorarioComercialId']}
                                label="Bloque horario"
                                rules={todoHorario ? undefined : [{ required: true, message: 'Selecciona un bloque horario.' }]}
                              >
                                <Select
                                  allowClear
                                  disabled={todoHorario}
                                  options={bloques.map((bloque) => ({ value: bloque.Id, label: bloque.Nombre }))}
                                />
                              </Form.Item>
                            )
                          }}
                        </Form.Item>

                        <Form.Item name={[field.name, 'TodoHorario']} label="Todo horario" valuePropName="checked" initialValue={true}>
                          <Switch
                            onChange={(checked) => {
                              if (checked) {
                                tarifasBatchForm.setFieldValue(['Tarifas', field.name, 'BloqueHorarioComercialId'], undefined)
                              }
                            }}
                          />
                        </Form.Item>

                        <Form.Item name={[field.name, 'Activo']} label="Activa" valuePropName="checked" initialValue={true}>
                          <Switch />
                        </Form.Item>
                      </div>

                      <Form.Item
                        name={[field.name, 'VigenciaRango']}
                        label="Vigencia"
                        rules={[{ required: true, message: 'Selecciona vigencia desde y hasta.' }]}
                      >
                        <DatePicker.RangePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
                      </Form.Item>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button
                          onClick={() => {
                            const current = tarifasBatchForm.getFieldValue(['Tarifas', field.name])
                            add({
                              ...createTarifaBatchRowDefault(),
                              ...current,
                              VigenciaRango: current?.VigenciaRango
                                ? [dayjs(current.VigenciaRango[0]), dayjs(current.VigenciaRango[1])]
                                : [dayjs(), dayjs().add(1, 'month')],
                            })
                          }}
                        >
                          Duplicar
                        </Button>
                        <Button danger disabled={fields.length === 1} onClick={() => remove(field.name)}>Eliminar</Button>
                      </div>
                    </div>
                  </Card>
                ))}

                <Button type="dashed" onClick={() => add(createTarifaBatchRowDefault())}>
                  Agregar línea
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </>
  )
})

export default ProductosTab
