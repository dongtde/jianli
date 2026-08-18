/**
 * Formats a one-based counter for compact UI status labels.
 * @param {number} current - Current one-based item number.
 * @param {number} total - Total item count.
 * @returns {string} Counter label in the "01 / 06" format.
 */
export function formatCounter(current, total) {
  return `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}`
}

/**
 * Converts a `YYYY.MM` month label into the `YYYY-MM` form the `datetime` attribute expects.
 * @param {string} label - Month label such as "2024.10".
 * @returns {string} ISO month string, or an empty string when the label is not a month.
 */
export function toIsoMonth(label) {
  const match = String(label ?? '').match(/^(\d{4})\.(\d{2})$/)
  return match ? `${match[1]}-${match[2]}` : ''
}
