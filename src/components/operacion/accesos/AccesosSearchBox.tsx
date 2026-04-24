import { SearchOutlined } from '@ant-design/icons'
import { AutoComplete, Avatar, Empty, Input, Spin } from 'antd'
import type { ClienteLookupDto } from '../../../types/models'
import { toCapitalCase } from '../../../utils/formatPersonName'
import styles from './AccesosSearchBox.module.css'

interface AccesosSearchBoxProps {
  value: string
  search: string
  loading: boolean
  clientes: ClienteLookupDto[]
  onSearch: (value: string) => void
  onSelectCliente: (cliente: ClienteLookupDto) => void
  onClear: () => void
}

export function AccesosSearchBox({
  value,
  search,
  loading,
  clientes,
  onSearch,
  onSelectCliente,
  onClear,
}: AccesosSearchBoxProps) {
  return (
    <AutoComplete
      className={styles.autoComplete}
      value={value}
      onSearch={onSearch}
      notFoundContent={
        loading ? (
          <div className={styles.loadingWrap}>
            <Spin description="Buscando clientes..." size="small" />
          </div>
        ) : search.length >= 2 && clientes.length === 0 ? (
          <div className={styles.emptyWrap}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No se encontró ningún cliente" />
          </div>
        ) : null
      }
      onSelect={(selectedValue) => {
        const cliente = clientes.find((item) => `${item.ClienteEmpresaId}` === selectedValue)
        if (cliente) {
          onSelectCliente(cliente)
        }
      }}
      options={clientes.map((cliente) => ({
        value: `${cliente.ClienteEmpresaId}`,
        label: (
          <div className={styles.optionRow}>
            <Avatar size="small" className={styles.optionAvatar}>
              {cliente.NombreCompleto.charAt(0).toUpperCase()}
            </Avatar>
            <div className={styles.optionCopy}>
              <div className={styles.optionName}>{toCapitalCase(cliente.NombreCompleto)}</div>
              <div className={styles.optionMeta}>{cliente.Rut} · {cliente.TipoCliente}</div>
            </div>
          </div>
        ),
      }))}
    >
      <Input
        size="large"
        placeholder="Buscar y seleccionar cliente..."
        prefix={<SearchOutlined className={styles.searchPrefix} />}
        allowClear
        className={styles.input}
        onChange={(event) => {
          if (!event.target.value) {
            onClear()
          }
        }}
      />
    </AutoComplete>
  )
}
