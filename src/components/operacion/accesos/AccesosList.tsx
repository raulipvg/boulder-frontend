import { CheckCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Button, List, Space, Tag, Typography } from 'antd'
import type { AccessOptionDto, AccessPreviewDto } from '../../../types/models'
import { formatShortDate, getOptionState } from './accesos.helpers'
import styles from './AccesosList.module.css'

interface AccesosListProps {
  options: AccessOptionDto[]
  preview: AccessPreviewDto
  validandoBeneficioId: number | null
  onValidar: (option: AccessOptionDto, preview: AccessPreviewDto) => Promise<void>
}

export function AccesosList({ options, preview, validandoBeneficioId, onValidar }: AccesosListProps) {
  return (
    <List
      itemLayout="horizontal"
      dataSource={options}
      renderItem={(item) => {
        const optionState = getOptionState(item)

        return (
          <List.Item
            className={styles.listItem}
            actions={[
              <Button
                key={`validar-${item.BeneficioClienteId}`}
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => void onValidar(item, preview)}
                className={styles.validateButton}
                disabled={!item.PuedeValidarAhora}
                loading={validandoBeneficioId === item.BeneficioClienteId}
              >
                {item.PuedeValidarAhora ? 'Validar' : 'No Disponible'}
              </Button>,
            ]}
          >
            <List.Item.Meta
              avatar={<SafetyCertificateOutlined className={styles.optionIcon} />}
              title={(
                <div className={styles.titleRow}>
                  <Typography.Text strong className={styles.productName}>{item.ProductoNombre}</Typography.Text>
                  <Space size="small" wrap>
                    <Tag color={optionState.color} variant="filled" className={styles.optionStateTag}>{optionState.label}</Tag>
                    <Tag color="default" variant="filled" className={styles.statusTag}>{item.Estado.toUpperCase()}</Tag>
                  </Space>
                </div>
              )}
              description={(
                <div className={styles.description}>
                  <div className={styles.metaRow}>
                    <span>Vigencia: {formatShortDate(item.FechaInicio)} al {formatShortDate(item.FechaTermino)}</span>
                    <span>Usos: {item.UsosConsumidos} / {item.UsosTotales ?? '∞'}</span>
                  </div>
                  {!item.PuedeValidarAhora && item.MotivoNoValidable ? (
                    <Typography.Text type="secondary" className={styles.reason}>
                      {item.MotivoNoValidable}
                    </Typography.Text>
                  ) : null}
                </div>
              )}
            />
          </List.Item>
        )
      }}
    />
  )
}
