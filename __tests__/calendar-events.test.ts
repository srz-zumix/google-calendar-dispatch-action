/**
 * Tests for Calendar Events module
 */
import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach
} from '@jest/globals'

// Set up mocks before imports
const mockDebug = jest.fn()
const mockWarning = jest.fn()
jest.unstable_mockModule('@actions/core', () => ({
  debug: mockDebug,
  warning: mockWarning
}))

// Dynamic import after mocks are set up
const { getEvents, isEventPastStartTime, updateEventDescription } =
  await import('../src/calendar/calendar-events.js')
import type { CalendarEvent } from '../src/calendar/calendar-events.js'

describe('calendar-events', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-01-15T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('getEvents', () => {
    it('should fetch events from multiple calendars', async () => {
      const mockClient = {
        events: {
          list: jest
            .fn()
            .mockResolvedValueOnce({
              data: {
                items: [{ id: 'event-1', summary: 'Event 1', description: '' }]
              }
            })
            .mockResolvedValueOnce({
              data: {
                items: [{ id: 'event-2', summary: 'Event 2', description: '' }]
              }
            })
        }
      } as any

      const events = await getEvents(mockClient, ['cal-1', 'cal-2'], 30)

      expect(events).toHaveLength(2)
      expect(events[0].calendarId).toBe('cal-1')
      expect(events[1].calendarId).toBe('cal-2')
      expect(mockClient.events.list).toHaveBeenCalledTimes(2)
    })

    it('should mark events as incomplete when no marker present', async () => {
      const mockClient = {
        events: {
          list: jest.fn().mockResolvedValue({
            data: {
              items: [{ id: 'event-1', description: 'No marker' }]
            }
          })
        }
      } as any

      const events = await getEvents(mockClient, ['cal-1'], 30)

      expect(events[0].isIncomplete).toBe(true)
    })

    it('should mark events as complete when marker present', async () => {
      const mockClient = {
        events: {
          list: jest.fn().mockResolvedValue({
            data: {
              items: [
                {
                  id: 'event-1',
                  description:
                    '--- google-calendar-dispatch-action\n[GitHub Actions Run]: https://...'
                }
              ]
            }
          })
        }
      } as any

      const events = await getEvents(mockClient, ['cal-1'], 30)

      expect(events[0].isIncomplete).toBe(false)
    })

    it('should handle empty response', async () => {
      const mockClient = {
        events: {
          list: jest.fn().mockResolvedValue({ data: {} })
        }
      } as any

      const events = await getEvents(mockClient, ['cal-1'], 30)

      expect(events).toHaveLength(0)
    })

    it('should handle API errors gracefully', async () => {
      const mockClient = {
        events: {
          list: jest.fn().mockRejectedValue(new Error('API Error'))
        }
      } as any

      const events = await getEvents(mockClient, ['cal-1'], 30)

      expect(events).toHaveLength(0)
      expect(mockWarning).toHaveBeenCalledWith(
        'Failed to fetch events from calendar cal-1: API Error'
      )
    })

    it('should calculate correct time range', async () => {
      const mockClient = {
        events: {
          list: jest.fn().mockResolvedValue({ data: { items: [] } })
        }
      } as any

      await getEvents(mockClient, ['cal-1'], 30)

      expect(mockClient.events.list).toHaveBeenCalledWith({
        calendarId: 'cal-1',
        timeMin: '2025-01-15T11:30:00.000Z', // 30 minutes before
        timeMax: '2025-01-15T12:10:00.000Z', // 10 minutes buffer after
        singleEvents: true,
        orderBy: 'startTime'
      })
    })
  })

  describe('isEventPastStartTime', () => {
    it('should return true when event start time is in the past', () => {
      const event: CalendarEvent = {
        raw: {
          id: 'event-1',
          start: { dateTime: '2025-01-15T11:00:00Z' }
        },
        calendarId: 'cal-1',
        isIncomplete: true
      }

      expect(isEventPastStartTime(event)).toBe(true)
    })

    it('should return false when event start time is in the future', () => {
      const event: CalendarEvent = {
        raw: {
          id: 'event-1',
          start: { dateTime: '2025-01-15T13:00:00Z' }
        },
        calendarId: 'cal-1',
        isIncomplete: true
      }

      expect(isEventPastStartTime(event)).toBe(false)
    })

    it('should handle date-only events', () => {
      const event: CalendarEvent = {
        raw: {
          id: 'event-1',
          start: { date: '2025-01-14' }
        },
        calendarId: 'cal-1',
        isIncomplete: true
      }

      expect(isEventPastStartTime(event)).toBe(true)
    })

    it('should return false when event has no start time', () => {
      const event: CalendarEvent = {
        raw: { id: 'event-1' },
        calendarId: 'cal-1',
        isIncomplete: true
      }

      expect(isEventPastStartTime(event)).toBe(false)
    })
  })

  describe('updateEventDescription', () => {
    it('should update event description with marker', async () => {
      const mockClient = {
        events: {
          patch: jest.fn().mockResolvedValue({})
        }
      } as any

      const event: CalendarEvent = {
        raw: { id: 'event-1', description: 'Original description' },
        calendarId: 'cal-1',
        isIncomplete: true
      }

      await updateEventDescription(
        mockClient,
        event,
        'https://github.com/owner/repo/actions/runs/123'
      )

      expect(mockClient.events.patch).toHaveBeenCalledWith({
        calendarId: 'cal-1',
        eventId: 'event-1',
        requestBody: {
          description: expect.stringContaining(
            '--- google-calendar-dispatch-action'
          )
        }
      })
    })

    it('should handle null description', async () => {
      const mockClient = {
        events: {
          patch: jest.fn().mockResolvedValue({})
        }
      } as any

      const event: CalendarEvent = {
        raw: { id: 'event-1', description: null },
        calendarId: 'cal-1',
        isIncomplete: true
      }

      await updateEventDescription(
        mockClient,
        event,
        'https://github.com/owner/repo/actions/runs/123'
      )

      expect(mockClient.events.patch).toHaveBeenCalled()
    })
  })
})
