import { CheckCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Button, Card, Space, Tag, Typography } from 'antd'
import type { AccessOptionDto, AccessPreviewDto } from '../../../types/models'
import { formatShortDate, getOptionState } from './accesos.helpers'
import styles from '../../../styles/components/operacion/accesos/AccesosMobileList.module.css'

interface AccesosMobileListProps {
  options: AccessOptionDto[]
  preview: AccessPreviewDto
  validandoBeneficioId: number | null
  onValidar: (option: AccessOptionDto, preview: AccessPreviewDto) => Promise<void>
}

export function AccesosMobileList({ options, preview, validandoBeneficioId, onValidar }: AccesosMobileListProps) {
  return (
    <div className={styles.list}>
      {options.map((item) => {
        const optionState = getOptionState(item)

        return (
          <Card key={item.BeneficioClienteId} size="small" className={styles.itemCard}>
            <div className={styles.itemContent}>
              <SafetyCertificateOutlined className={styles.optionIcon} />
              <div className={styles.itemBody}>
                <div className={styles.headRow}>
                  <Typography.Text strong className={styles.productName}>
                    {item.ProductoNombre}
                  </Typography.Text>
                </div>

                <Space size={4} wrap className={styles.tagsRow}>
                  <Tag color={optionState.color} variant="filled" className={styles.optionStateTag}>
                    {optionState.label}
                  </Tag>
                  <Tag color="default" variant="filled" className={styles.statusTag}>
                    {item.Estado.toUpperCase()}
                  </Tag>
                </Space>

                <div className={styles.metaBlock}>
                  <div className={styles.metaRow}>
                    <span><strong>Vigencia:</strong></span>
                    <span>{formatShortDate(item.FechaInicio)} al {formatShortDate(item.FechaTermino)}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span><strong>Usos:</strong></span>
                    <span>{item.UsosConsumidos} / {item.UsosTotales ?? '∞'}</span>
                  </div>
                </div>

                {!item.PuedeValidarAhora && item.MotivoNoValidable ? (
                  <Typography.Text type="secondary" className={styles.reason}>
                    {item.MotivoNoValidable}
                  </Typography.Text>
                ) : null}
              </div>
            </div>

            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => void onValidar(item, preview)}
              className={styles.validateButton}
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
  )
}
