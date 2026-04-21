import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  App as AntdApp,
  Button,
  Card,
  Form,
  Grid,
  Input,
} from 'antd'
import { useEffect, useState } from 'react'
import { ClienteFormModal } from '../../components/administracion/clientes/ClienteFormModal'
import { ClientesMobileList } from '../../components/administracion/clientes/ClientesMobileList'
import { ClientesTable } from '../../components/administracion/clientes/ClientesTable'
import { PageFiltersCard } from '../../components/shared/PageFiltersCard'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { RequireCompanyAlert } from '../../components/shared/RequireCompanyAlert'
import { administracionService } from '../../services/administracion/administracionService'
import type { ClienteDto, TipoClienteDto } from '../../types/models'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import { normalizeRut } from '../../utils/rut'

const { useBreakpoint } = Grid

export default function ClientesPage() {
  const { message } = AntdApp.useApp()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const [items, setItems] = useState<ClienteDto[]>([])
  const [tipos, setTipos] = useState<TipoClienteDto[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ClienteDto | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const load = async (searchValue = '') => {
    setLoading(true)
    try {
      const [clientes, tiposCliente] = await Promise.all([
        administracionService.getClientes(searchValue),
        administracionService.getTiposCliente(),
      ])
      setItems(clientes)
      setTipos(tiposCliente)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(search)
  }, [search])

  useEffect(() => {
    if (!open) {
      return
    }

    if (!editingItem) {
      form.resetFields()
      form.setFieldsValue({ Estado: 'activo' })
      return
    }

    const tipoClienteId = editingItem.TipoClienteId ?? tipos.find((tipo) => tipo.Nombre === editingItem.TipoCliente)?.TipoClienteId

    form.setFieldsValue({
      NombreCompleto: editingItem.NombreCompleto,
      Rut: editingItem.Rut,
      FechaNacimiento: editingItem.FechaNacimiento ? dayjs(editingItem.FechaNacimiento) : undefined,
      Telefono: editingItem.Telefono ?? undefined,
      Correo: editingItem.Correo ?? undefined,
      TipoClienteId: tipoClienteId,
      Estado: editingItem.Estado,
    })
  }, [editingItem, form, open, tipos])

  const openCreate = () => {
    setEditingItem(null)
    setOpen(true)
  }

  const openEdit = (record: ClienteDto) => {
    setEditingItem(record)
    setOpen(true)
  }

  return (
    <div className="tms-page">
      <RequireCompanyAlert />

      <PageHeaderCard
        title="Clientes"
        subtitle="Escaladores registrados por empresa."
        actions={(
          <>
            <Button icon={<ReloadOutlined />} onClick={() => void load(search)} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Nuevo cliente
            </Button>
          </>
        )}
      />

      <PageFiltersCard>
        <Input.Search
          className="tms-inline-search"
          placeholder="Buscar por nombre o RUT"
          prefix={<SearchOutlined />}
          onSearch={setSearch}
          allowClear
        />
      </PageFiltersCard>

      <Card className="tms-page-table-card" loading={loading}>
        {isMobile ? <ClientesMobileList items={items} onEdit={openEdit} /> : <ClientesTable items={items} onEdit={openEdit} />}
      </Card>

      <ClienteFormModal
        open={open}
        editingItem={editingItem}
        tipos={tipos}
        submitting={submitting}
        form={form}
        onCancel={() => {
          setOpen(false)
          setEditingItem(null)
        }}
        onSubmit={async (values) => {
          setSubmitting(true)
          try {
            const payload = {
              ...values,
              NombreCompleto: values.NombreCompleto?.trim(),
              Rut: normalizeRut(values.Rut),
              FechaNacimiento: values.FechaNacimiento ? values.FechaNacimiento.format('YYYY-MM-DD') : null,
            }

            if (editingItem) {
              await administracionService.updateCliente(editingItem.ClienteEmpresaId, payload)
              message.success('Cliente actualizado correctamente.')
            } else {
              await administracionService.createCliente(payload)
              message.success('Cliente creado correctamente.')
            }

            setOpen(false)
            setEditingItem(null)
            form.resetFields()
            await load(search)
          } catch (error) {
            message.error(getApiErrorMessage(error, `No se pudo ${editingItem ? 'actualizar' : 'crear'} el cliente.`))
          } finally {
            setSubmitting(false)
          }
        }}
      />
    </div>
  )
}
