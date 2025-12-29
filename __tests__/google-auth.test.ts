/**
 * Tests for Google Auth module
 */
import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Set up mocks before imports
const mockDebug = jest.fn()
jest.unstable_mockModule('@actions/core', () => ({
  debug: mockDebug
}))

const mockGoogleAuth = jest.fn()
const mockCalendar = jest.fn()
const mockTasks = jest.fn()
jest.unstable_mockModule('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: mockGoogleAuth.mockImplementation(() => ({
        getClient: jest.fn()
      }))
    },
    calendar: mockCalendar.mockReturnValue({ events: {} }),
    tasks: mockTasks.mockReturnValue({ tasks: {} })
  },
  Auth: {}
}))

const mockExistsSync = jest.fn()
jest.unstable_mockModule('fs', () => ({
  existsSync: mockExistsSync
}))

// Dynamic import after mocks are set up
const { createAuthClient, createApiClients } =
  await import('../src/auth/google-auth.js')

describe('google-auth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDebug.mockClear()
    mockGoogleAuth.mockClear()
    mockExistsSync.mockClear()
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS
  })

  describe('createAuthClient', () => {
    it('should create auth client from credentials input', async () => {
      const credentials = JSON.stringify({
        type: 'service_account',
        project_id: 'test-project',
        private_key_id: 'key-id',
        private_key:
          '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
        client_email: 'test@test-project.iam.gserviceaccount.com'
      })

      const auth = await createAuthClient(credentials)

      expect(auth).toBeDefined()
      expect(mockDebug).toHaveBeenCalledWith(
        'Using credentials from input parameter'
      )
      expect(mockGoogleAuth).toHaveBeenCalledWith({
        credentials: JSON.parse(credentials),
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/tasks'
        ]
      })
    })

    it('should throw error for invalid JSON credentials', async () => {
      const invalidJson = 'not valid json'

      await expect(createAuthClient(invalidJson)).rejects.toThrow(
        'Failed to parse credentials JSON'
      )
    })

    it('should use GOOGLE_APPLICATION_CREDENTIALS environment variable', async () => {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = '/path/to/credentials.json'
      mockExistsSync.mockReturnValue(true)

      const auth = await createAuthClient()

      expect(auth).toBeDefined()
      expect(mockDebug).toHaveBeenCalledWith(
        'Using credentials from GOOGLE_APPLICATION_CREDENTIALS: /path/to/credentials.json'
      )
      expect(mockGoogleAuth).toHaveBeenCalledWith({
        keyFile: '/path/to/credentials.json',
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/tasks'
        ]
      })
    })

    it('should throw error when credentials file does not exist', async () => {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = '/path/to/missing.json'
      mockExistsSync.mockReturnValue(false)

      await expect(createAuthClient()).rejects.toThrow(
        'Credentials file not found: /path/to/missing.json'
      )
    })

    it('should throw error when no credentials are available', async () => {
      await expect(createAuthClient()).rejects.toThrow(
        'No Google credentials provided'
      )
    })
  })

  describe('createApiClients', () => {
    it('should create calendar and tasks clients', () => {
      const mockAuth = {} as any

      const clients = createApiClients(mockAuth)

      expect(clients).toHaveProperty('calendar')
      expect(clients).toHaveProperty('tasks')
      expect(mockCalendar).toHaveBeenCalledWith({
        version: 'v3',
        auth: mockAuth
      })
      expect(mockTasks).toHaveBeenCalledWith({ version: 'v1', auth: mockAuth })
    })
  })
})
