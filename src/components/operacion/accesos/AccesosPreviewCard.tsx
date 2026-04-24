import { Alert, Avatar, Card, Divider, Space, Tag, Typography } from 'antd'
import type { AccessOptionDto, AccessPreviewDto, ClienteLookupDto } from '../../../types/models'
import { toCapitalCase } from '../../../utils/formatPersonName'
import { AccesosList } from './AccesosList'
import { AccesosMobileList } from './AccesosMobileList'
import styles from './AccesosPreviewCard.module.css'

interface AccesosPreviewCardProps {
  preview: AccessPreviewDto
  selectedCliente: ClienteLookupDto | null
  isMobile: boolean
  loading: boolean
  validandoBeneficioId: number | null
  onValidar: (option: AccessOptionDto, preview: AccessPreviewDto) => Promise<void>
}

export function AccesosPreviewCard({
  preview,
  selectedCliente,
  isMobile,
  loading,
  validandoBeneficioId,
  onValidar,
}: AccesosPreviewCardProps) {
  return (
    <Card
      className={styles.card}
      styles={{ body: { padding: isMobile ? 16 : 24 } }}
      variant="borderless"
      loading={loading}
    >
      <div className={`${styles.header} ${isMobile ? styles.headerMobile : ''}`}>
        <Avatar size={isMobile ? 56 : 64} className={`${styles.avatar} ${isMobile ? styles.avatarMobile : ''}`}>
          {preview.ClienteNombre.charAt(0).toUpperCase()}
        </Avatar>
        <div className={styles.headerCopy}>
          <div className={styles.nameRow}>
            <Typography.Title level={4} className={styles.clientName}>
              {toCapitalCase(preview.ClienteNombre)}
            </Typography.Title>
            {selectedCliente?.Rut ? (
              <Typography.Text type="secondary" className={styles.rutText}>
                {selectedCliente.Rut}
              </Typography.Text>
            ) : null}
          </div>
          <Space className={styles.tagsWrap} size="small" wrap>
            {selectedCliente?.TipoCliente ? (
              <Tag color="info" variant="filled">
                {selectedCliente.TipoCliente.toUpperCase()}
              </Tag>
            ) : null}
            <Tag color={preview.EstadoCliente === 'activo' ? 'success' : 'error'} variant="filled">
              {preview.EstadoCliente.toUpperCase()}
            </Tag>
          </Space>
        </div>
      </div>

      <Divider className={styles.divider} />

      <Typography.Text type="secondary" className={styles.sectionTitle}>
        Beneficios Disponibles
      </Typography.Text>

      {preview.Opciones.length === 0 ? (
        <Alert type="warning" showIcon title="No tiene pases o mensualidades activas" className={styles.emptyAlert} />
      ) : isMobile ? (
        <AccesosMobileList
          options={preview.Opciones}
          preview={preview}
          validandoBeneficioId={validandoBeneficioId}
          onValidar={onValidar}
        />
      ) : (
        <AccesosList
          options={preview.Opciones}
          preview={preview}
          validandoBeneficioId={validandoBeneficioId}
          onValidar={onValidar}
        />
      )}
    </Card>
  )
}
