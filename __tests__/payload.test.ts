/**
 * Unit tests for src/utils/payload.ts
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import * as core from '../__fixtures__/core.js'

// Mock @actions/core
jest.unstable_mockModule('@actions/core', () => core)

// Import the module after mocking
const { extractCustomPayload } = await import('../src/utils/payload.js')

describe('payload.ts', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('extractCustomPayload', () => {
    it('should extract JSON from code block', () => {
      const text = `Some description
\`\`\`json
{
  "key": "value",
  "number": 123
}
\`\`\`
More text`
      const result = extractCustomPayload(text)
      expect(result).toEqual({ key: 'value', number: 123 })
    })

    it('should return empty object for null text', () => {
      const result = extractCustomPayload(null)
      expect(result).toEqual({})
    })

    it('should return empty object for undefined text', () => {
      const result = extractCustomPayload(undefined)
      expect(result).toEqual({})
    })

    it('should return empty object for text without code block', () => {
      const result = extractCustomPayload('Just some text without code block')
      expect(result).toEqual({})
    })

    it('should return empty object for empty code block', () => {
      const text = `Description
\`\`\`json
\`\`\``
      const result = extractCustomPayload(text)
      expect(result).toEqual({})
    })

    it('should log warning and return empty object for invalid JSON', () => {
      const text = `Description
\`\`\`json
{ invalid json }
\`\`\``
      const result = extractCustomPayload(text)
      expect(result).toEqual({})
      expect(core.warning).toHaveBeenCalled()
    })

    it('should use first JSON code block when multiple exist', () => {
      const text = `Description
\`\`\`json
{"first": true}
\`\`\`
More text
\`\`\`json
{"second": true}
\`\`\``
      const result = extractCustomPayload(text)
      expect(result).toEqual({ first: true })
    })

    it('should handle nested objects', () => {
      const text = `\`\`\`json
{
  "nested": {
    "deep": {
      "value": "found"
    }
  }
}
\`\`\``
      const result = extractCustomPayload(text)
      expect(result).toEqual({ nested: { deep: { value: 'found' } } })
    })

    it('should handle arrays in JSON', () => {
      const text = `\`\`\`json
{
  "items": [1, 2, 3],
  "names": ["a", "b"]
}
\`\`\``
      const result = extractCustomPayload(text)
      expect(result).toEqual({ items: [1, 2, 3], names: ['a', 'b'] })
    })
  })
})
