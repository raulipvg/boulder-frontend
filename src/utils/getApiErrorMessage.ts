import { isAxiosError } from 'axios'

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data

    if (typeof data === 'string' && data.trim().length > 0) {
      return data
    }

    if (typeof data === 'object' && data !== null) {
      const message = (data as { message?: unknown }).message
      if (typeof message === 'string' && message.trim().length > 0) {
        return message
      }

      const title = (data as { title?: unknown }).title
      if (typeof title === 'string' && title.trim().length > 0) {
        return title
      }
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallbackMessage
}
