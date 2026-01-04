import { tasks_v1 } from 'googleapis'
import * as core from '@actions/core'
import { appendMarker } from '../utils/index.js'

/** Internal buffer in minutes for task retrieval */
const BUFFER_MINUTES = 10

/**
 * Represents a task with additional metadata
 */
export interface GoogleTask {
  /** Raw API response data */
  raw: tasks_v1.Schema$Task
  /** Task list ID this task belongs to */
  taskListId: string
  /** Whether the task is incomplete (status is not completed) */
  isIncomplete: boolean
}

/**
 * Retrieves tasks from specified task lists within a time range
 *
 * @param client - Google Tasks API client
 * @param taskListIds - Array of task list IDs to query
 * @param timeRangeMinutes - Minutes to look back for tasks
 * @returns Array of tasks
 */
export async function getTasks(
  client: tasks_v1.Tasks,
  taskListIds: string[],
  timeRangeMinutes: number
): Promise<GoogleTask[]> {
  const now = new Date()
  const timeMin = new Date(now.getTime() - timeRangeMinutes * 60 * 1000)
  const timeMax = new Date(now.getTime() + BUFFER_MINUTES * 60 * 1000)

  core.debug(
    `Fetching tasks from ${timeMin.toISOString()} to ${timeMax.toISOString()}`
  )

  const allTasks: GoogleTask[] = []

  for (const taskListId of taskListIds) {
    try {
      core.debug(`Fetching tasks from task list: ${taskListId}`)

      const response = await client.tasks.list({
        tasklist: taskListId,
        dueMin: timeMin.toISOString(),
        dueMax: timeMax.toISOString(),
        showCompleted: true,
        showHidden: true
      })

      const tasks = response.data.items || []
      core.debug(`Found ${tasks.length} tasks in task list ${taskListId}`)

      for (const task of tasks) {
        allTasks.push({
          raw: task,
          taskListId,
          isIncomplete: task.status !== 'completed'
        })
      }
    } catch (error) {
      core.warning(
        `Failed to fetch tasks from task list ${taskListId}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  return allTasks
}

/**
 * Checks if a task's due time has passed
 *
 * @param task - Task to check
 * @returns true if the task's due time is in the past
 */
export function isTaskPastDueTime(task: GoogleTask): boolean {
  const now = new Date()
  const dueTime = task.raw.due

  if (!dueTime) {
    core.debug(`Task ${task.raw.id} has no due time`)
    return false
  }

  return new Date(dueTime) < now
}

/**
 * Updates a task's notes with the completion marker
 *
 * @param client - Google Tasks API client
 * @param task - Task to update
 * @param runUrl - GitHub Actions run URL
 */
export async function updateTaskNotes(
  client: tasks_v1.Tasks,
  task: GoogleTask,
  runUrl: string
): Promise<void> {
  const newNotes = appendMarker(task.raw.notes, runUrl)

  await client.tasks.patch({
    tasklist: task.taskListId,
    task: task.raw.id!,
    requestBody: {
      notes: newNotes
    }
  })

  core.debug(`Updated notes for task ${task.raw.id}`)
}
