/**
 * Formats a one-based counter for compact UI status labels.
 * @param {number} current - Current one-based item number.
 * @param {number} total - Total item count.
 * @returns {string} Counter label in the "01 / 06" format.
 */
export function formatCounter(current, total) {
  return `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}`
}
