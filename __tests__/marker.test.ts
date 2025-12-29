/**
 * Unit tests for src/utils/marker.ts
 */
import { describe, it, expect } from '@jest/globals'
import {
  MARKER_PREFIX,
  generateMarker,
  hasCompletionMarker,
  appendMarker
} from '../src/utils/marker.js'

describe('marker.ts', () => {
  const testRunUrl = 'https://github.com/owner/repo/actions/runs/123456789'

  describe('MARKER_PREFIX', () => {
    it('should be the correct prefix', () => {
      expect(MARKER_PREFIX).toBe('--- google-calendar-dispatch-action')
    })
  })

  describe('generateMarker', () => {
    it('should generate a marker with the run URL', () => {
      const marker = generateMarker(testRunUrl)
      expect(marker).toBe(
        `--- google-calendar-dispatch-action\n[GitHub Actions Run]: ${testRunUrl}`
      )
    })
  })

  describe('hasCompletionMarker', () => {
    it('should return true if text contains the marker', () => {
      const text = `Some description\n\n${MARKER_PREFIX}\n[GitHub Actions Run]: ${testRunUrl}`
      expect(hasCompletionMarker(text)).toBe(true)
    })

    it('should return false if text does not contain the marker', () => {
      const text = 'Some description without marker'
      expect(hasCompletionMarker(text)).toBe(false)
    })

    it('should return false for null', () => {
      expect(hasCompletionMarker(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(hasCompletionMarker(undefined)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(hasCompletionMarker('')).toBe(false)
    })
  })

  describe('appendMarker', () => {
    it('should append marker to existing text', () => {
      const text = 'Existing description'
      const result = appendMarker(text, testRunUrl)
      expect(result).toBe(
        `Existing description\n\n--- google-calendar-dispatch-action\n[GitHub Actions Run]: ${testRunUrl}`
      )
    })

    it('should return just the marker for null text', () => {
      const result = appendMarker(null, testRunUrl)
      expect(result).toBe(
        `--- google-calendar-dispatch-action\n[GitHub Actions Run]: ${testRunUrl}`
      )
    })

    it('should return just the marker for undefined text', () => {
      const result = appendMarker(undefined, testRunUrl)
      expect(result).toBe(
        `--- google-calendar-dispatch-action\n[GitHub Actions Run]: ${testRunUrl}`
      )
    })

    it('should return just the marker for empty string', () => {
      const result = appendMarker('', testRunUrl)
      expect(result).toBe(
        `--- google-calendar-dispatch-action\n[GitHub Actions Run]: ${testRunUrl}`
      )
    })

    it('should return just the marker for whitespace-only string', () => {
      const result = appendMarker('   ', testRunUrl)
      expect(result).toBe(
        `--- google-calendar-dispatch-action\n[GitHub Actions Run]: ${testRunUrl}`
      )
    })
  })
})
