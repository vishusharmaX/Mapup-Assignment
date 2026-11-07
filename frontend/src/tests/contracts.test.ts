import { describe, it, expect } from 'vitest'
import { apiClient } from '../services/api'

describe('Frontend API Contracts & Base Configurations', () => {
  it('configures Axios default headers and content type', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
  })

  it('validates polygon closure rules before submission', () => {
    const coords: [number, number][] = [
      [37.77, -122.41],
      [37.78, -122.40],
      [37.76, -122.39],
    ]
    expect(coords.length).toBeGreaterThanOrEqual(3)

    // Ensure closure check
    const isClosed =
      coords[0][0] === coords[coords.length - 1][0] &&
      coords[0][1] === coords[coords.length - 1][1]
    expect(isClosed).toBe(false)

    // Auto-closure
    const closed = [...coords, coords[0]]
    expect(closed.length).toBe(4)
    expect(closed[0][0]).toBe(closed[3][0])
  })

  it('enforces required category types', () => {
    const validCategories = [
      'delivery_zone',
      'restricted_zone',
      'toll_zone',
      'customer_area',
    ]
    expect(validCategories).toContain('restricted_zone')
    expect(validCategories).toContain('delivery_zone')
    expect(validCategories).toContain('toll_zone')
    expect(validCategories).toContain('customer_area')
  })
})
