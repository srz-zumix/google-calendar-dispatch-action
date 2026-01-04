import { google, Auth } from 'googleapis'
import * as core from '@actions/core'
import * as fs from 'fs'

/**
 * Google API authentication module
 */

/** Required OAuth scopes for Calendar and Tasks APIs */
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks'
]

/**
 * Creates an authenticated Google Auth client
 *
 * @param credentials - Optional Google credentials JSON string
 * @returns Authenticated Google Auth client
 * @throws Error if no credentials are available
 */
export async function createAuthClient(
  credentials?: string
): Promise<Auth.GoogleAuth> {
  // Priority 1: Use credentials from input parameter
  if (credentials) {
    core.debug('Using credentials from input parameter')
    try {
      const credentialsJson = JSON.parse(credentials) as Auth.JWTInput
      const auth = new google.auth.GoogleAuth({
        credentials: credentialsJson,
        scopes: SCOPES
      })
      return auth
    } catch (error) {
      throw new Error(
        `Failed to parse credentials JSON: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  // Priority 2: Use GOOGLE_APPLICATION_CREDENTIALS environment variable
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (credentialsPath) {
    core.debug(
      `Using credentials from GOOGLE_APPLICATION_CREDENTIALS: ${credentialsPath}`
    )

    if (!fs.existsSync(credentialsPath)) {
      throw new Error(`Credentials file not found: ${credentialsPath}`)
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: SCOPES
    })
    return auth
  }

  throw new Error(
    'No Google credentials provided. Please provide credentials via the google-credentials input or set GOOGLE_APPLICATION_CREDENTIALS environment variable.'
  )
}

/**
 * Creates authenticated Google Calendar and Tasks API clients
 *
 * @param auth - Authenticated Google Auth client
 * @returns Object containing calendar and tasks API clients
 */
export function createApiClients(auth: Auth.GoogleAuth) {
  const calendar = google.calendar({ version: 'v3', auth })
  const tasks = google.tasks({ version: 'v1', auth })
  return { calendar, tasks }
}
