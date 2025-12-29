import * as core from '@actions/core'

/**
 * Payload extraction utilities
 */

/** Regular expression to match ```json code blocks */
const JSON_CODE_BLOCK_PATTERN = /```json\s*([\s\S]*?)```/

/**
 * Extracts custom JSON payload from description/notes
 * Looks for a ```json code block and parses its content
 *
 * @param text - Event description or task notes
 * @returns Parsed JSON object or empty object if not found/invalid
 */
export function extractCustomPayload(
  text: string | null | undefined
): Record<string, unknown> {
  if (!text) {
    return {}
  }

  const match = text.match(JSON_CODE_BLOCK_PATTERN)
  if (!match || !match[1]) {
    return {}
  }

  const jsonContent = match[1].trim()
  if (!jsonContent) {
    return {}
  }

  try {
    const parsed: unknown = JSON.parse(jsonContent)
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, unknown>
    }
    core.warning('JSON payload is not an object, returning empty object')
    return {}
  } catch (error) {
    core.warning(
      `Failed to parse JSON payload: ${error instanceof Error ? error.message : String(error)}`
    )
    return {}
  }
}
