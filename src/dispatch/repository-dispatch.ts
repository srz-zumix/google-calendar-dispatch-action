import * as github from '@actions/github'
import * as core from '@actions/core'
import type { CalendarEvent } from '../calendar/index.js'
import type { GoogleTask } from '../tasks/index.js'

/**
 * Source type for dispatch payload
 */
export type SourceType = 'event' | 'task'

/**
 * Dispatch payload structure
 */
export interface DispatchPayload {
  /** Raw API response from Google Calendar/Tasks */
  event: unknown
  /** Custom data extracted from description/notes */
  custom: Record<string, unknown>
  /** Source type (event or task) */
  source_type: SourceType
}

/**
 * Gets the current GitHub Actions run URL
 *
 * @returns The run URL
 */
export function getRunUrl(): string {
  const { owner, repo } = github.context.repo
  const runId = github.context.runId
  return `https://github.com/${owner}/${repo}/actions/runs/${runId}`
}

/**
 * Sends a repository dispatch event
 *
 * @param token - GitHub token with repo scope
 * @param repository - Target repository in format owner/repo
 * @param eventType - Event type for the dispatch
 * @param payload - Dispatch payload
 */
export async function sendDispatch(
  token: string,
  repository: string,
  eventType: string,
  payload: DispatchPayload
): Promise<void> {
  const octokit = github.getOctokit(token)
  const [owner, repo] = repository.split('/')

  if (!owner || !repo) {
    throw new Error(
      `Invalid repository format: ${repository}. Expected owner/repo`
    )
  }

  core.debug(
    `Sending dispatch to ${owner}/${repo} with event type: ${eventType}`
  )

  await octokit.rest.repos.createDispatchEvent({
    owner,
    repo,
    event_type: eventType,
    client_payload: payload as unknown as { [key: string]: unknown }
  })

  core.debug('Dispatch sent successfully')
}

/**
 * Creates a dispatch payload from a calendar event
 *
 * @param event - Calendar event
 * @param customPayload - Custom payload extracted from description
 * @returns Dispatch payload
 */
export function createEventPayload(
  event: CalendarEvent,
  customPayload: Record<string, unknown>
): DispatchPayload {
  return {
    event: event.raw,
    custom: customPayload,
    source_type: 'event'
  }
}

/**
 * Creates a dispatch payload from a task
 *
 * @param task - Google task
 * @param customPayload - Custom payload extracted from notes
 * @returns Dispatch payload
 */
export function createTaskPayload(
  task: GoogleTask,
  customPayload: Record<string, unknown>
): DispatchPayload {
  return {
    event: task.raw,
    custom: customPayload,
    source_type: 'task'
  }
}
