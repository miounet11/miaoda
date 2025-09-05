import { describe, it, expect, beforeEach, vi } from 'vitest'
import { formatDistanceToNow, formatTimeWithFallback } from '../time'

describe('Time Utilities', () => {
  let mockDate: Date

  beforeEach(() => {
    // Mock current time to January 1, 2024, 12:00:00
    mockDate = new Date('2024-01-01T12:00:00Z')
    vi.setSystemTime(mockDate)
  })

  describe('formatDistanceToNow', () => {
    it('handles null and undefined inputs', () => {
      expect(formatDistanceToNow(null)).toBe('just now')
      expect(formatDistanceToNow(undefined)).toBe('just now')
    })

    it('handles empty string input', () => {
      expect(formatDistanceToNow('')).toBe('just now')
      expect(formatDistanceToNow('   ')).toBe('just now')
    })

    it('handles invalid date strings', () => {
      expect(formatDistanceToNow('invalid-date')).toBe('just now')
      expect(formatDistanceToNow('not a date')).toBe('just now')
    })

    it('handles zero and negative numbers', () => {
      expect(formatDistanceToNow(0)).toBe('just now')
      expect(formatDistanceToNow(-1)).toBe('just now')
    })

    it('formats seconds correctly', () => {
      const now = mockDate.getTime()

      // 15 seconds ago
      expect(formatDistanceToNow(now - 15000)).toBe('just now')

      // 45 seconds ago
      expect(formatDistanceToNow(now - 45000)).toBe('moments ago')
    })

    it('formats minutes correctly', () => {
      const now = mockDate.getTime()

      // 1 minute ago
      expect(formatDistanceToNow(now - 60000)).toBe('1m ago')

      // 30 minutes ago
      expect(formatDistanceToNow(now - 30 * 60000)).toBe('30m ago')

      // 59 minutes ago
      expect(formatDistanceToNow(now - 59 * 60000)).toBe('59m ago')
    })

    it('formats hours correctly', () => {
      const now = mockDate.getTime()

      // 1 hour ago
      expect(formatDistanceToNow(now - 60 * 60000)).toBe('1h ago')

      // 12 hours ago
      expect(formatDistanceToNow(now - 12 * 60 * 60000)).toBe('12h ago')

      // 23 hours ago
      expect(formatDistanceToNow(now - 23 * 60 * 60000)).toBe('23h ago')
    })

    it('formats days correctly', () => {
      const now = mockDate.getTime()

      // 1 day ago
      expect(formatDistanceToNow(now - 24 * 60 * 60000)).toBe('1d ago')

      // 7 days ago
      expect(formatDistanceToNow(now - 7 * 24 * 60 * 60000)).toBe('7d ago')

      // 30 days ago
      expect(formatDistanceToNow(now - 30 * 24 * 60 * 60000)).toBe('30d ago')
    })

    it('formats old dates as actual date', () => {
      const now = mockDate.getTime()

      // 31 days ago (more than 30 days)
      const oldDate = new Date(now - 31 * 24 * 60 * 60000)
      const result = formatDistanceToNow(oldDate)

      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/) // Should be actual date format
    })

    it('handles future dates correctly', () => {
      const now = mockDate.getTime()

      // 1 hour in future
      expect(formatDistanceToNow(now + 60 * 60000)).toBe('just now')

      // 2 days in future
      const futureDate = new Date(now + 2 * 24 * 60 * 60000)
      const result = formatDistanceToNow(futureDate)
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
    })

    it('handles Date objects correctly', () => {
      const now = new Date(mockDate.getTime() - 60000) // 1 minute ago
      expect(formatDistanceToNow(now)).toBe('1m ago')
    })

    it('handles ISO date strings correctly', () => {
      const isoString = new Date(mockDate.getTime() - 2 * 60000).toISOString()
      expect(formatDistanceToNow(isoString)).toBe('2m ago')
    })

    it('handles Unix timestamps correctly', () => {
      const timestamp = Math.floor(mockDate.getTime() / 1000) - 300 // 5 minutes ago
      expect(formatDistanceToNow(timestamp * 1000)).toBe('5m ago')
    })

    it('gracefully handles errors', () => {
      // Mock console.error to verify error handling
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Force an error by mocking Date constructor
      const originalDate = global.Date
      global.Date = vi.fn(() => {
        throw new Error('Date constructor error')
      }) as any

      const result = formatDistanceToNow('2024-01-01')
      expect(result).toBe('just now')
      expect(consoleSpy).toHaveBeenCalled()

      // Restore
      global.Date = originalDate
      consoleSpy.mockRestore()
    })
  })

  describe('formatTimeWithFallback', () => {
    it('uses formatDistanceToNow as primary method', () => {
      const now = mockDate.getTime()
      const oneHourAgo = now - 60 * 60000

      expect(formatTimeWithFallback(oneHourAgo)).toBe('1h ago')
    })

    it('handles Firestore timestamp objects', () => {
      const firestoreTimestamp = {
        _seconds: Math.floor(mockDate.getTime() / 1000) - 300, // 5 minutes ago
        _nanoseconds: 0
      }

      expect(formatTimeWithFallback(firestoreTimestamp)).toBe('5m ago')
    })

    it('handles Firestore timestamp with seconds property', () => {
      const firestoreTimestamp = {
        seconds: Math.floor(mockDate.getTime() / 1000) - 600, // 10 minutes ago
        nanoseconds: 0
      }

      expect(formatTimeWithFallback(firestoreTimestamp)).toBe('10m ago')
    })

    it('handles Firestore timestamp with toDate method', () => {
      const firestoreTimestamp = {
        toDate: vi.fn(() => new Date(mockDate.getTime() - 15 * 60000)) // 15 minutes ago
      }

      expect(formatTimeWithFallback(firestoreTimestamp)).toBe('15m ago')
      expect(firestoreTimestamp.toDate).toHaveBeenCalled()
    })

    it('handles Date-like objects with getTime method', () => {
      const dateLikeObject = {
        getTime: vi.fn(() => mockDate.getTime() - 30 * 60000) // 30 minutes ago
      }

      expect(formatTimeWithFallback(dateLikeObject)).toBe('30m ago')
      expect(dateLikeObject.getTime).toHaveBeenCalled()
    })

    it('falls back gracefully for unknown object types', () => {
      const unknownObject = {
        someProperty: 'value',
        anotherProperty: 123
      }

      const result = formatTimeWithFallback(unknownObject)
      expect(result).toBe('just now')
    })

    it('handles errors in fallback processing', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const problematicObject = {
        toDate: vi.fn(() => {
          throw new Error('toDate error')
        })
      }

      const result = formatTimeWithFallback(problematicObject)
      expect(result).toBe('just now')
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('preserves original result when no fallback needed', () => {
      const validTimestamp = mockDate.getTime() - 2 * 60 * 60000 // 2 hours ago

      expect(formatTimeWithFallback(validTimestamp)).toBe('2h ago')
    })
  })

  describe('Edge Cases and Performance', () => {
    it('handles very large timestamps', () => {
      const largeTimestamp = Number.MAX_SAFE_INTEGER
      const result = formatDistanceToNow(largeTimestamp)

      // Should handle gracefully without crashing
      expect(typeof result).toBe('string')
    })

    it('handles very small timestamps', () => {
      const smallTimestamp = 1
      const result = formatDistanceToNow(smallTimestamp)

      expect(result).toBe('just now')
    })

    it('performs efficiently with multiple calls', () => {
      const timestamps = Array(1000)
        .fill(null)
        .map(
          (_, i) => mockDate.getTime() - i * 60000 // Every minute for 1000 minutes
        )

      const startTime = performance.now()

      timestamps.forEach(timestamp => {
        formatDistanceToNow(timestamp)
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should process 1000 timestamps quickly
      expect(duration).toBeLessThan(100) // Less than 100ms
    })

    it('handles concurrent calls safely', async () => {
      const promises = Array(100)
        .fill(null)
        .map((_, i) => Promise.resolve(formatDistanceToNow(mockDate.getTime() - i * 1000)))

      const results = await Promise.all(promises)

      expect(results).toHaveLength(100)
      results.forEach(result => {
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Localization Support', () => {
    it('formats dates according to system locale', () => {
      const oldDate = mockDate.getTime() - 40 * 24 * 60 * 60000 // 40 days ago
      const result = formatDistanceToNow(oldDate)

      // Should use toLocaleDateString format
      expect(result).toMatch(/\d/)
    })

    it('handles different locale date formats', () => {
      // Mock toLocaleDateString to test different formats
      const originalToLocaleDateString = Date.prototype.toLocaleDateString
      Date.prototype.toLocaleDateString = vi.fn(() => '01/01/2024')

      const oldDate = mockDate.getTime() - 40 * 24 * 60 * 60000
      const result = formatDistanceToNow(oldDate)

      expect(result).toBe('01/01/2024')

      // Restore original method
      Date.prototype.toLocaleDateString = originalToLocaleDateString
    })
  })
})
