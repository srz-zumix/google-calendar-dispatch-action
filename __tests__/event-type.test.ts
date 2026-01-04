/**
 * Unit tests for src/utils/event-type.ts
 */
import { describe, it, expect } from '@jest/globals'
import { extractEventType } from '../src/utils/event-type.js'

describe('event-type.ts', () => {
  describe('extractEventType', () => {
    const defaultEventType = 'default-event'

    it('should extract event type from title', () => {
      const result = extractEventType(
        'Meeting {event_type: my-meeting}',
        'Some description',
        defaultEventType
      )
      expect(result).toBe('my-meeting')
    })

    it('should extract event type from description when not in title', () => {
      const result = extractEventType(
        'Meeting',
        'Details {event_type: meeting-dispatch}',
        defaultEventType
      )
      expect(result).toBe('meeting-dispatch')
    })

    it('should prioritize title over description', () => {
      const result = extractEventType(
        'Meeting {event_type: title-event}',
        'Details {event_type: desc-event}',
        defaultEventType
      )
      expect(result).toBe('title-event')
    })

    it('should return default value when not found', () => {
      const result = extractEventType(
        'Meeting without event type',
        'Description without event type',
        defaultEventType
      )
      expect(result).toBe(defaultEventType)
    })

    it('should return default value for null title and description', () => {
      const result = extractEventType(null, null, defaultEventType)
      expect(result).toBe(defaultEventType)
    })

    it('should return default value for undefined title and description', () => {
      const result = extractEventType(undefined, undefined, defaultEventType)
      expect(result).toBe(defaultEventType)
    })

    it('should handle event type with underscores', () => {
      const result = extractEventType(
        'Task {event_type: my_custom_event}',
        null,
        defaultEventType
      )
      expect(result).toBe('my_custom_event')
    })

    it('should handle event type with hyphens', () => {
      const result = extractEventType(
        'Task {event_type: my-custom-event}',
        null,
        defaultEventType
      )
      expect(result).toBe('my-custom-event')
    })

    it('should handle event type with numbers', () => {
      const result = extractEventType(
        'Task {event_type: event123}',
        null,
        defaultEventType
      )
      expect(result).toBe('event123')
    })

    it('should handle spaces around event type value', () => {
      const result = extractEventType(
        'Task {event_type:   spaced-event   }',
        null,
        defaultEventType
      )
      expect(result).toBe('spaced-event')
    })

    it('should use first match when multiple occurrences in title', () => {
      const result = extractEventType(
        '{event_type: first} and {event_type: second}',
        null,
        defaultEventType
      )
      expect(result).toBe('first')
    })
  })
})
