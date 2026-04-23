import {
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import {
  App as AntdApp,
  Button,
  Card,
  Form,
  Grid,
} from 'antd'
import { useEffect, useState } from 'react'
import { UsuarioFormModal } from '../../components/administracion/usuarios/UsuarioFormModal'
import { UsuariosMobileList } from '../../components/administracion/usuarios/UsuariosMobileList'
import { UsuarioPasswordModal } from '../../components/administracion/usuarios/UsuarioPasswordModal'
import { UsuariosTable } from '../../components/administracion/usuarios/UsuariosTable'
import { PageHeaderCard } from '../../components/shared/PageHeaderCard'
import { useAuth } from '../../context/AuthContext'
import { administracionService } from '../../services/administracion/administracionService'
import type { EmpresaDto, UsuarioDto } from '../../types/models'
import { toCapitalCase } from '../../utils/formatPersonName'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'

const { useBreakpoint } = Grid

export default function UsuariosPage() {
  const { message } = AntdApp.useApp()
  const { user } = useAuth()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const [items, setItems] = useState<UsuarioDto[]>([])
  const [empresas, setEmpresas] = useState<EmpresaDto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<UsuarioDto | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [passwordTarget, setPasswordTarget] = useState<UsuarioDto | null>(null)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()

  const isAdminTotal = user?.RoleCodes.includes('ADMIN_TOTAL')

  const load = async () => {
    setLoading(true)
    try {
      const [usuarios, empresasData] = await Promise.all([
        administracionService.getUsuarios(),
        isAdminTotal ? administracionService.getEmpresas() : Promise.resolve([]),
      ])
      setItems(usuarios)
      setEmpresas(empresasData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [isAdminTotal])

  const openCreate = () => {
    setEditingItem(null)
    setOpen(true)
  }

  const openEdit = (record: UsuarioDto) => {
    setEditingItem(record)
    setOpen(true)
  }

  const openPassword = (record: UsuarioDto) => {
    setPasswordTarget(record)
    setPasswordOpen(true)
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
      NombreCompleto: editingItem.NombreCompleto,
      Rut: editingItem.Rut,
      EmailLogin: editingItem.EmailLogin,
      Estado: editingItem.Estado === 'activo',
      RolCodigo: editingItem.Roles[0],
      EmpresaId: editingItem.EmpresaId ?? undefined,
    })
  }, [editingItem, form, open])

  useEffect(() => {
    if (passwordOpen) {
      passwordForm.resetFields()
    }
  }, [passwordForm, passwordOpen])

  return (
    <div className="tms-page">
      <PageHeaderCard
        title="Usuarios"
        subtitle="Usuarios internos y sus roles operativos."
        mobileStandard={isMobile}
        actions={(
          <>
            <Button icon={<ReloadOutlined />} onClick={() => void load()} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              {!isMobile && 'Nuevo usuario'}
            </Button>
          </>
        )}
      />

      <Card className="tms-page-table-card" loading={loading} styles={{ body: { padding: isMobile ? '12px' : undefined } }}>
        {isMobile ? (
          <UsuariosMobileList items={items} onEdit={openEdit} onPassword={openPassword} />
        ) : (
          <UsuariosTable items={items} onEdit={openEdit} onPassword={openPassword} />
        )}
      </Card>

      <UsuarioFormModal
        open={open}
        editingItem={editingItem}
        submitting={submitting}
        isAdminTotal={isAdminTotal}
        empresas={empresas}
        form={form}
        onCancel={() => {
          setOpen(false)
          setEditingItem(null)
        }}
        onSubmit={async (values) => {
          setSubmitting(true)
          try {
            const payload = {
              NombreCompleto: values.NombreCompleto,
              Rut: values.Rut,
              EmailLogin: values.EmailLogin,
              Estado: values.Estado ? 'activo' : 'inactivo',
              RolCodigo: values.RolCodigo,
              EmpresaId: values.EmpresaId ?? null,
            }

            if (editingItem) {
              await administracionService.updateUsuario(editingItem.UsuarioId, payload)
              message.success('Usuario actualizado correctamente.')
            } else {
              await administracionService.createUsuario({
                ...payload,
                Password: values.Password,
              })
              message.success('Usuario creado correctamente.')
            }

            setOpen(false)
            setEditingItem(null)
            form.resetFields()
            await load()
          } catch (error) {
            message.error(getApiErrorMessage(error, `No se pudo ${editingItem ? 'actualizar' : 'crear'} el usuario.`))
          } finally {
            setSubmitting(false)
          }
        }}
      />

      <UsuarioPasswordModal
        open={passwordOpen}
        passwordTarget={passwordTarget}
        submitting={passwordSubmitting}
        form={passwordForm}
        onCancel={() => {
          setPasswordOpen(false)
          setPasswordTarget(null)
        }}
        onSubmit={async (values) => {
          if (!passwordTarget) {
            return
          }

          setPasswordSubmitting(true)
          try {
            await administracionService.changePasswordUsuario(passwordTarget.UsuarioId, { NuevaPassword: values.NuevaPassword })
            message.success(`Contrasena actualizada para ${toCapitalCase(passwordTarget.NombreCompleto)}.`)
            setPasswordOpen(false)
            setPasswordTarget(null)
            passwordForm.resetFields()
          } catch (error) {
            message.error(getApiErrorMessage(error, 'No se pudo cambiar la contrasena.'))
          } finally {
            setPasswordSubmitting(false)
          }
        }}
      />
    </div>
  )
}
