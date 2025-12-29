/**
 * Event type extraction utilities
 */

/** Regular expression to match {event_type: xxx} format */
const EVENT_TYPE_PATTERN = /\{event_type:\s*([a-zA-Z0-9_-]+)\s*\}/

/**
 * Extracts event type from title or description
 * Priority: title > description > defaultValue
 *
 * @param title - Event/task title
 * @param description - Event description or task notes
 * @param defaultValue - Default event type if not found
 * @returns Extracted event type or default value
 */
export function extractEventType(
  title: string | null | undefined,
  description: string | null | undefined,
  defaultValue: string
): string {
  // Try to extract from title first
  if (title) {
    const titleMatch = title.match(EVENT_TYPE_PATTERN)
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1]
    }
  }

  // Try to extract from description
  if (description) {
    const descMatch = description.match(EVENT_TYPE_PATTERN)
    if (descMatch && descMatch[1]) {
      return descMatch[1]
    }
  }

  // Return default value
  return defaultValue
}
