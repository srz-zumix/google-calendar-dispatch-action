/**
 * Tests for Repository Dispatch module
 */
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import type { CalendarEvent } from '../src/calendar/index.js'
import type { GoogleTask } from '../src/tasks/index.js'

// Set up mocks before imports
jest.unstable_mockModule('@actions/core', () => ({
  debug: jest.fn()
}))

const mockCreateDispatchEvent = jest.fn()
const mockGetOctokit = jest.fn().mockReturnValue({
  rest: {
    repos: {
      createDispatchEvent: mockCreateDispatchEvent
    }
  }
})

jest.unstable_mockModule('@actions/github', () => ({
  context: {
    repo: { owner: 'test-owner', repo: 'test-repo' },
    runId: 123456789
  },
  getOctokit: mockGetOctokit
}))

// Dynamic import after mocks are set up
const { getRunUrl, sendDispatch, createEventPayload, createTaskPayload } =
  await import('../src/dispatch/repository-dispatch.js')

describe('repository-dispatch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateDispatchEvent.mockClear()
    mockCreateDispatchEvent.mockResolvedValue({})
  })

  describe('getRunUrl', () => {
    it('should return the correct run URL', () => {
      const url = getRunUrl()

      expect(url).toBe(
        'https://github.com/test-owner/test-repo/actions/runs/123456789'
      )
    })
  })

  describe('sendDispatch', () => {
    it('should send dispatch event successfully', async () => {
      const payload = {
        event: { id: 'event-1' },
        custom: { key: 'value' },
        source_type: 'event' as const
      }

      await sendDispatch('token', 'owner/repo', 'test-event', payload)

      expect(mockCreateDispatchEvent).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        event_type: 'test-event',
        client_payload: payload
      })
    })

    it('should throw error for invalid repository format', async () => {
      const payload = {
        event: {},
        custom: {},
        source_type: 'event' as const
      }

      await expect(
        sendDispatch('token', 'invalid', 'test-event', payload)
      ).rejects.toThrow(
        'Invalid repository format: invalid. Expected owner/repo'
      )
    })

    it('should throw error for repository without owner', async () => {
      const payload = {
        event: {},
        custom: {},
        source_type: 'event' as const
      }

      await expect(
        sendDispatch('token', '/repo', 'test-event', payload)
      ).rejects.toThrow('Invalid repository format: /repo. Expected owner/repo')
    })
  })

  describe('createEventPayload', () => {
    it('should create payload from calendar event', () => {
      const event: CalendarEvent = {
        raw: {
          id: 'event-123',
          summary: 'Test Event',
          start: { dateTime: '2025-01-01T10:00:00Z' }
        },
        calendarId: 'primary',
        isIncomplete: true
      }
      const customPayload = { environment: 'production' }

      const payload = createEventPayload(event, customPayload)

      expect(payload).toEqual({
        event: event.raw,
        custom: customPayload,
        source_type: 'event'
      })
    })
  })

  describe('createTaskPayload', () => {
    it('should create payload from task', () => {
      const task: GoogleTask = {
        raw: {
          id: 'task-123',
          title: 'Test Task',
          due: '2025-01-01T10:00:00Z'
        },
        taskListId: 'list-1',
        isIncomplete: true
      }
      const customPayload = { priority: 'high' }

      const payload = createTaskPayload(task, customPayload)

      expect(payload).toEqual({
        event: task.raw,
        custom: customPayload,
        source_type: 'task'
      })
    })
  })
})
