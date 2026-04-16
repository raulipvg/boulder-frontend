function cleanRut(value: string): string {
  return value.replace(/[^0-9kK]/g, '').toUpperCase()
}

export function normalizeRut(value?: string | null): string {
  if (!value) {
    return ''
  }

  const clean = cleanRut(value)
  if (clean.length < 2) {
    return clean
  }

  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  return `${body}-${dv}`
}

export function isValidRut(value?: string | null): boolean {
  const clean = cleanRut(value ?? '')
  if (clean.length < 2) {
    return false
  }

  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)

  if (!/^\d+$/.test(body)) {
    return false
  }

  let sum = 0
  let multiplier = 2

  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const remainder = 11 - (sum % 11)
  const expected = remainder === 11 ? '0' : remainder === 10 ? 'K' : `${remainder}`

  return dv === expected
}
