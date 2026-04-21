import dayjs from 'dayjs'
import updateLocale from 'dayjs/plugin/updateLocale'
import 'dayjs/locale/es'

dayjs.extend(updateLocale)
dayjs.updateLocale('es', { weekStart: 1 })
dayjs.locale('es')
