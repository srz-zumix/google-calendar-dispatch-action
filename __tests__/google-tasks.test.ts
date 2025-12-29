/**
 * Tests for Google Tasks module
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
const { getTasks, isTaskPastDueTime, updateTaskNotes } =
  await import('../src/tasks/google-tasks.js')
import type { GoogleTask } from '../src/tasks/google-tasks.js'

describe('google-tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-01-15T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('getTasks', () => {
    it('should fetch tasks from multiple task lists', async () => {
      const mockClient = {
        tasks: {
          list: jest
            .fn()
            .mockResolvedValueOnce({
              data: {
                items: [
                  { id: 'task-1', title: 'Task 1', status: 'needsAction' }
                ]
              }
            })
            .mockResolvedValueOnce({
              data: {
                items: [
                  { id: 'task-2', title: 'Task 2', status: 'needsAction' }
                ]
              }
            })
        }
      } as any

      const tasks = await getTasks(mockClient, ['list-1', 'list-2'], 30)

      expect(tasks).toHaveLength(2)
      expect(tasks[0].taskListId).toBe('list-1')
      expect(tasks[1].taskListId).toBe('list-2')
      expect(mockClient.tasks.list).toHaveBeenCalledTimes(2)
    })

    it('should mark tasks as incomplete when status is needsAction', async () => {
      const mockClient = {
        tasks: {
          list: jest.fn().mockResolvedValue({
            data: {
              items: [{ id: 'task-1', status: 'needsAction' }]
            }
          })
        }
      } as any

      const tasks = await getTasks(mockClient, ['list-1'], 30)

      expect(tasks[0].isIncomplete).toBe(true)
    })

    it('should mark tasks as complete when status is completed', async () => {
      const mockClient = {
        tasks: {
          list: jest.fn().mockResolvedValue({
            data: {
              items: [{ id: 'task-1', status: 'completed' }]
            }
          })
        }
      } as any

      const tasks = await getTasks(mockClient, ['list-1'], 30)

      expect(tasks[0].isIncomplete).toBe(false)
    })

    it('should handle empty response', async () => {
      const mockClient = {
        tasks: {
          list: jest.fn().mockResolvedValue({ data: {} })
        }
      } as any

      const tasks = await getTasks(mockClient, ['list-1'], 30)

      expect(tasks).toHaveLength(0)
    })

    it('should handle API errors gracefully', async () => {
      const mockClient = {
        tasks: {
          list: jest.fn().mockRejectedValue(new Error('API Error'))
        }
      } as any

      const tasks = await getTasks(mockClient, ['list-1'], 30)

      expect(tasks).toHaveLength(0)
      expect(mockWarning).toHaveBeenCalledWith(
        'Failed to fetch tasks from task list list-1: API Error'
      )
    })

    it('should calculate correct time range', async () => {
      const mockClient = {
        tasks: {
          list: jest.fn().mockResolvedValue({ data: { items: [] } })
        }
      } as any

      await getTasks(mockClient, ['list-1'], 30)

      expect(mockClient.tasks.list).toHaveBeenCalledWith({
        tasklist: 'list-1',
        dueMin: '2025-01-15T11:30:00.000Z',
        dueMax: '2025-01-15T12:10:00.000Z',
        showCompleted: true,
        showHidden: true
      })
    })
  })

  describe('isTaskPastDueTime', () => {
    it('should return true when task due time is in the past', () => {
      const task: GoogleTask = {
        raw: {
          id: 'task-1',
          due: '2025-01-15T11:00:00Z'
        },
        taskListId: 'list-1',
        isIncomplete: true
      }

      expect(isTaskPastDueTime(task)).toBe(true)
    })

    it('should return false when task due time is in the future', () => {
      const task: GoogleTask = {
        raw: {
          id: 'task-1',
          due: '2025-01-15T13:00:00Z'
        },
        taskListId: 'list-1',
        isIncomplete: true
      }

      expect(isTaskPastDueTime(task)).toBe(false)
    })

    it('should return false when task has no due time', () => {
      const task: GoogleTask = {
        raw: { id: 'task-1' },
        taskListId: 'list-1',
        isIncomplete: true
      }

      expect(isTaskPastDueTime(task)).toBe(false)
    })
  })

  describe('updateTaskNotes', () => {
    it('should update task notes with marker', async () => {
      const mockClient = {
        tasks: {
          patch: jest.fn().mockResolvedValue({})
        }
      } as any

      const task: GoogleTask = {
        raw: { id: 'task-1', notes: 'Original notes' },
        taskListId: 'list-1',
        isIncomplete: true
      }

      await updateTaskNotes(
        mockClient,
        task,
        'https://github.com/owner/repo/actions/runs/123'
      )

      expect(mockClient.tasks.patch).toHaveBeenCalledWith({
        tasklist: 'list-1',
        task: 'task-1',
        requestBody: {
          notes: expect.stringContaining('--- google-calendar-dispatch-action')
        }
      })
    })

    it('should handle null notes', async () => {
      const mockClient = {
        tasks: {
          patch: jest.fn().mockResolvedValue({})
        }
      } as any

      const task: GoogleTask = {
        raw: { id: 'task-1', notes: null },
        taskListId: 'list-1',
        isIncomplete: true
      }

      await updateTaskNotes(
        mockClient,
        task,
        'https://github.com/owner/repo/actions/runs/123'
      )

      expect(mockClient.tasks.patch).toHaveBeenCalled()
    })
  })
})
