import { calendar_v3 } from 'googleapis'
import * as core from '@actions/core'
import { hasCompletionMarker, appendMarker } from '../utils/index.js'

/** Internal buffer in minutes for event retrieval */
const BUFFER_MINUTES = 10

/**
 * Represents a calendar event with additional metadata
 */
export interface CalendarEvent {
  /** Raw API response data */
  raw: calendar_v3.Schema$Event
  /** Calendar ID this event belongs to */
  calendarId: string
  /** Whether the event is incomplete (no completion marker) */
  isIncomplete: boolean
}

/**
 * Retrieves events from specified calendars within a time range
 *
 * @param client - Google Calendar API client
 * @param calendarIds - Array of calendar IDs to query
 * @param timeRangeMinutes - Minutes to look back for events
 * @returns Array of calendar events
 */
export async function getEvents(
  client: calendar_v3.Calendar,
  calendarIds: string[],
  timeRangeMinutes: number
): Promise<CalendarEvent[]> {
  const now = new Date()
  const timeMin = new Date(now.getTime() - timeRangeMinutes * 60 * 1000)
  const timeMax = new Date(now.getTime() + BUFFER_MINUTES * 60 * 1000)

  core.debug(
    `Fetching events from ${timeMin.toISOString()} to ${timeMax.toISOString()}`
  )

  const allEvents: CalendarEvent[] = []

  for (const calendarId of calendarIds) {
    try {
      core.debug(`Fetching events from calendar: ${calendarId}`)

      const response = await client.events.list({
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      })

      const events = response.data.items || []
      core.debug(`Found ${events.length} events in calendar ${calendarId}`)

      for (const event of events) {
        allEvents.push({
          raw: event,
          calendarId,
          isIncomplete: !hasCompletionMarker(event.description)
        })
      }
    } catch (error) {
      core.warning(
        `Failed to fetch events from calendar ${calendarId}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  return allEvents
}

/**
 * Checks if an event's start time has passed
 *
 * @param event - Calendar event to check
 * @returns true if the event's start time is in the past
 */
export function isEventPastStartTime(event: CalendarEvent): boolean {
  const now = new Date()
  const startTime = event.raw.start?.dateTime || event.raw.start?.date

  if (!startTime) {
    core.debug(`Event ${event.raw.id} has no start time`)
    return false
  }

  return new Date(startTime) < now
}

/**
 * Updates an event's description with the completion marker
 *
 * @param client - Google Calendar API client
 * @param event - Calendar event to update
 * @param runUrl - GitHub Actions run URL
 */
export async function updateEventDescription(
  client: calendar_v3.Calendar,
  event: CalendarEvent,
  runUrl: string
): Promise<void> {
  const newDescription = appendMarker(event.raw.description, runUrl)

  await client.events.patch({
    calendarId: event.calendarId,
    eventId: event.raw.id!,
    requestBody: {
      description: newDescription
    }
  })

  core.debug(`Updated description for event ${event.raw.id}`)
}
