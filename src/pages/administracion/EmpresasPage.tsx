import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { App as AntdApp, Button, Card, Form, Grid } from 'antd'
import { useEffect, useState } from 'react'
import { EmpresaFormModal } from '../../components/administracion/empresas/EmpresaFormModal'
import { EmpresasMobileList } from '../../components/administracion/empresas/EmpresasMobileList'
import { EmpresasTable } from '../../components/administracion/empresas/EmpresasTable'
import { isEstadoActivo } from '../../components/administracion/empresas/empresas'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { administracionService } from '../../services/administracion/administracionService'
import type { EmpresaDto } from '../../types/models'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'

const { useBreakpoint } = Grid

export default function EmpresasPage() {
  const { message } = AntdApp.useApp()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const [items, setItems] = useState<EmpresaDto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<EmpresaDto | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      setItems(await administracionService.getEmpresas())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const openCreate = () => {
    setEditingItem(null)
    setOpen(true)
  }

  const openEdit = (record: EmpresaDto) => {
    setEditingItem(record)
    setOpen(true)
  }

  useEffect(() => {
    if (!open) {
      return
    }

    if (!editingItem) {
      form.resetFields()
      form.setFieldsValue({ Estado: true })
      return
    }

    form.setFieldsValue({
      NombreComercial: editingItem.NombreComercial,
      RazonSocial: editingItem.RazonSocial ?? undefined,
      Rut: editingItem.Rut,
      Estado: isEstadoActivo(editingItem.Estado),
      TelefonoContacto: editingItem.TelefonoContacto ?? undefined,
      CorreoContacto: editingItem.CorreoContacto ?? undefined,
    })
  }, [editingItem, form, open])

  return (
    <div className="tms-page">
      <PageHeaderCard
        title="Empresas"
        subtitle="Administración global de tenants SaaS."
        mobileStandard={isMobile}
        actions={(
          <>
            <Button icon={<ReloadOutlined />} onClick={() => void load()} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              {!isMobile && 'Nueva empresa'}
            </Button>
          </>
        )}
      />

      <Card className="tms-page-table-card" loading={loading} styles={{ body: { padding: isMobile ? '12px' : undefined } }}>
        {isMobile ? (
          <EmpresasMobileList items={items} onEdit={openEdit} />
        ) : (
          <EmpresasTable items={items} onEdit={openEdit} />
        )}
      </Card>

      <EmpresaFormModal
        open={open}
        editingItem={editingItem}
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
              NombreComercial: values.NombreComercial,
              RazonSocial: values.RazonSocial,
              Rut: values.Rut,
              Estado: values.Estado ? 'activo' : 'inactivo',
              TelefonoContacto: values.TelefonoContacto,
              CorreoContacto: values.CorreoContacto,
            }

            if (editingItem) {
              await administracionService.updateEmpresa(editingItem.EmpresaId, payload)
              message.success('Empresa actualizada correctamente.')
            } else {
              await administracionService.createEmpresa(payload)
              message.success('Empresa creada correctamente.')
            }

            setOpen(false)
            setEditingItem(null)
            form.resetFields()
            await load()
          } catch (error) {
            message.error(getApiErrorMessage(error, `No se pudo ${editingItem ? 'actualizar' : 'crear'} la empresa.`))
          } finally {
            setSubmitting(false)
          }
        }}
      />
    </div>
  )
}
