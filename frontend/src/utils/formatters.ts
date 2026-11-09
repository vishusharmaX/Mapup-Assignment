export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return 'Never'
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return 'Invalid Date'
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date)
  } catch {
    return 'Invalid Date'
  }
}

export function formatTimeAgo(isoString?: string | null): string {
  if (!isoString) return 'Never'
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)

    if (diffSec < 10) return 'Just now'
    if (diffSec < 60) return `${diffSec}s ago`
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    const diffDay = Math.floor(diffHr / 24)
    return `${diffDay}d ago`
  } catch {
    return 'Unknown'
  }
}

export function formatCoordinates(lat?: number | null, lon?: number | null): string {
  if (lat == null || lon == null) return 'No GPS position'
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`
}

export function formatNanoseconds(nsStr?: string): string {
  if (!nsStr) return '0 ms'
  const ns = parseInt(nsStr, 10)
  if (isNaN(ns)) return nsStr
  if (ns < 1000) return `${ns} ns`
  if (ns < 1000000) return `${(ns / 1000).toFixed(2)} µs`
  return `${(ns / 1000000).toFixed(2)} ms`
}

