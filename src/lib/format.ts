import { format } from 'date-fns'

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

// Convert dollars to cents (for sending to backend)
export function dollarsToCents(dollars: number | string): number {
  if (typeof dollars === 'string') {
    const parsed = parseFloat(dollars)
    return isNaN(parsed) ? 0 : Math.round(parsed * 100)
  }
  return Math.round(dollars * 100)
}

// Convert cents to dollars (for displaying/editing)
export function centsToDollars(cents: number | undefined | null): number | '' {
  if (cents === undefined || cents === null) return ''
  return cents / 100
}

export function formatDateTime(utcDate: string | Date): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  // Convert UTC to America/Chicago timezone properly
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return formatter.format(date)
}

export function formatDate(utcDate: string | Date): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  const chicagoTime = new Date(date.getTime() - (6 * 60 * 60 * 1000))
  return format(chicagoTime, 'MMM d, yyyy')
}
