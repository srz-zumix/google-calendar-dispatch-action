/**
 * Completion marker utilities for tracking dispatched events
 */

/** Marker prefix that identifies processed events */
export const MARKER_PREFIX = '--- google-calendar-dispatch-action'

/**
 * Generates a completion marker with the run URL
 * @param runUrl - The GitHub Actions run URL
 * @returns Formatted marker string
 */
export function generateMarker(runUrl: string): string {
  return `${MARKER_PREFIX}\n[GitHub Actions Run]: ${runUrl}`
}

/**
 * Checks if text contains the completion marker
 * @param text - Text to check (description or notes)
 * @returns true if marker is present
 */
export function hasCompletionMarker(text: string | null | undefined): boolean {
  if (!text) {
    return false
  }
  return text.includes(MARKER_PREFIX)
}

/**
 * Appends the completion marker to existing text
 * @param text - Existing text (description or notes)
 * @param runUrl - The GitHub Actions run URL
 * @returns Text with marker appended
 */
export function appendMarker(
  text: string | null | undefined,
  runUrl: string
): string {
  const marker = generateMarker(runUrl)
  if (!text || text.trim() === '') {
    return marker
  }
  return `${text}\n\n${marker}`
}
