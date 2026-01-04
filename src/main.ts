import * as core from '@actions/core'
import * as github from '@actions/github'
import { createAuthClient, createApiClients } from './auth/index.js'
import {
  getEvents,
  isEventPastStartTime,
  updateEventDescription
} from './calendar/index.js'
import { getTasks, isTaskPastDueTime, updateTaskNotes } from './tasks/index.js'
import {
  getRunUrl,
  sendDispatch,
  createEventPayload,
  createTaskPayload
} from './dispatch/index.js'
import { extractEventType, extractCustomPayload } from './utils/index.js'

/**
 * Action inputs
 */
interface ActionInputs {
  githubToken: string
  timeRange: number
  calendarIds: string[]
  taskListIds: string[]
  googleCredentials: string | undefined
  repository: string
  eventType: string
}

/**
 * Action result counters
 */
interface ActionResult {
  dispatchedCount: number
  skippedCount: number
  errorCount: number
}

/**
 * Parses action inputs
 */
function getInputs(): ActionInputs {
  const githubToken = core.getInput('github-token', { required: true })
  const timeRange = parseInt(core.getInput('time-range') || '30', 10)
  const calendarIdsStr = core.getInput('calendar-ids') || ''
  const taskListIdsStr = core.getInput('task-list-ids') || ''
  const googleCredentials = core.getInput('google-credentials') || undefined
  const repository =
    core.getInput('repository') ||
    `${github.context.repo.owner}/${github.context.repo.repo}`
  const eventType = core.getInput('event-type') || 'calendar-dispatch'

  const calendarIds = calendarIdsStr
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0)

  const taskListIds = taskListIdsStr
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0)

  return {
    githubToken,
    timeRange,
    calendarIds,
    taskListIds,
    googleCredentials,
    repository,
    eventType
  }
}

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  const result: ActionResult = {
    dispatchedCount: 0,
    skippedCount: 0,
    errorCount: 0
  }

  try {
    const inputs = getInputs()
    core.debug(`Time range: ${inputs.timeRange} minutes`)
    core.debug(`Calendar IDs: ${inputs.calendarIds.join(', ')}`)
    core.debug(`Task list IDs: ${inputs.taskListIds.join(', ')}`)
    core.debug(`Repository: ${inputs.repository}`)
    core.debug(`Default event type: ${inputs.eventType}`)

    // Check if there's anything to process
    if (inputs.calendarIds.length === 0 && inputs.taskListIds.length === 0) {
      core.warning(
        'No calendar IDs or task list IDs provided. Nothing to process.'
      )
      setOutputs(result)
      return
    }

    // Authenticate with Google APIs
    core.info('Authenticating with Google APIs...')
    const auth = await createAuthClient(inputs.googleCredentials)
    const { calendar, tasks } = createApiClients(auth)

    const runUrl = getRunUrl()
    core.info(`Run URL: ${runUrl}`)

    // Process calendar events
    if (inputs.calendarIds.length > 0) {
      core.info('Processing calendar events...')
      const events = await getEvents(
        calendar,
        inputs.calendarIds,
        inputs.timeRange
      )
      core.info(`Found ${events.length} events`)

      for (const event of events) {
        try {
          if (!event.isIncomplete) {
            core.debug(`Skipping event ${event.raw.id}: already processed`)
            result.skippedCount++
            continue
          }

          if (!isEventPastStartTime(event)) {
            core.debug(
              `Skipping event ${event.raw.id}: start time not yet passed`
            )
            result.skippedCount++
            continue
          }

          const eventTypeResolved = extractEventType(
            event.raw.summary,
            event.raw.description,
            inputs.eventType
          )
          const customPayload = extractCustomPayload(event.raw.description)
          const payload = createEventPayload(event, customPayload)

          core.info(
            `Dispatching event: ${event.raw.summary} (type: ${eventTypeResolved})`
          )
          await sendDispatch(
            inputs.githubToken,
            inputs.repository,
            eventTypeResolved,
            payload
          )
          await updateEventDescription(calendar, event, runUrl)

          result.dispatchedCount++
        } catch (error) {
          core.warning(
            `Failed to process event ${event.raw.id}: ${error instanceof Error ? error.message : String(error)}`
          )
          result.errorCount++
        }
      }
    }

    // Process tasks
    if (inputs.taskListIds.length > 0) {
      core.info('Processing tasks...')
      const taskItems = await getTasks(
        tasks,
        inputs.taskListIds,
        inputs.timeRange
      )
      core.info(`Found ${taskItems.length} tasks`)

      for (const task of taskItems) {
        try {
          if (!task.isIncomplete) {
            core.debug(`Skipping task ${task.raw.id}: already completed`)
            result.skippedCount++
            continue
          }

          if (!isTaskPastDueTime(task)) {
            core.debug(`Skipping task ${task.raw.id}: due time not yet passed`)
            result.skippedCount++
            continue
          }

          const eventTypeResolved = extractEventType(
            task.raw.title,
            task.raw.notes,
            inputs.eventType
          )
          const customPayload = extractCustomPayload(task.raw.notes)
          const payload = createTaskPayload(task, customPayload)

          core.info(
            `Dispatching task: ${task.raw.title} (type: ${eventTypeResolved})`
          )
          await sendDispatch(
            inputs.githubToken,
            inputs.repository,
            eventTypeResolved,
            payload
          )
          await updateTaskNotes(tasks, task, runUrl)

          result.dispatchedCount++
        } catch (error) {
          core.warning(
            `Failed to process task ${task.raw.id}: ${error instanceof Error ? error.message : String(error)}`
          )
          result.errorCount++
        }
      }
    }

    // Summary
    core.info('Processing complete!')
    core.info(`Dispatched: ${result.dispatchedCount}`)
    core.info(`Skipped: ${result.skippedCount}`)
    core.info(`Errors: ${result.errorCount}`)

    setOutputs(result)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed(String(error))
    }
  }
}

/**
 * Sets the action outputs
 */
function setOutputs(result: ActionResult): void {
  core.setOutput('dispatched-count', result.dispatchedCount.toString())
  core.setOutput('skipped-count', result.skippedCount.toString())
  core.setOutput('error-count', result.errorCount.toString())
}
