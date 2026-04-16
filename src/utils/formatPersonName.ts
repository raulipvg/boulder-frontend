export function toCapitalCase(value?: string | null): string {
  if (!value) {
    return ''
  }

  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return ''
  }

  return normalized.replace(/\p{L}+/gu, (word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
}
