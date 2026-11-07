import { describe, it, expect } from 'vitest'
import {
  formatCoordinates,
  formatNanoseconds,
  formatTimeAgo,
} from '../utils/formatters'

describe('Frontend Formatters & Geospatial Helpers', () => {
  it('formats coordinates correctly to 5 decimal precision', () => {
    expect(formatCoordinates(37.774929, -122.419416)).toBe('37.77493, -122.41942')
  })

  it('handles null and undefined coordinates safely without throwing', () => {
    expect(formatCoordinates(null, null)).toBe('No GPS position')
    expect(formatCoordinates(undefined, undefined)).toBe('No GPS position')
  })

  it('formats nanoseconds into human-readable microseconds or milliseconds', () => {
    expect(formatNanoseconds('500')).toBe('500 ns')
    expect(formatNanoseconds('450000')).toBe('450.00 µs')
    expect(formatNanoseconds('12500000')).toBe('12.50 ms')
  })

  it('formats recent relative time correctly', () => {
    const justNow = new Date().toISOString()
    expect(formatTimeAgo(justNow)).toBe('Just now')

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    expect(formatTimeAgo(tenMinutesAgo)).toBe('10m ago')

    expect(formatTimeAgo(null)).toBe('Never')
  })
})
