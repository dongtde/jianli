/**
 * Projects a released drag into the offset it should rest at, adding a short momentum tail.
 * A fast flick therefore travels past the nearest stop, while a slow drag stays where it was let go.
 * @param {number} offsetMonths - Timeline offset in months at the moment of release.
 * @param {number} velocityMonthsPerSecond - Release velocity in months per second.
 * @param {number} [momentumSeconds=0.16] - Duration of the projected momentum tail in seconds.
 * @returns {number} Projected resting offset in months.
 */
export function projectScrubOffset(offsetMonths, velocityMonthsPerSecond, momentumSeconds = 0.16) {
  if (!Number.isFinite(offsetMonths)) return 0
  if (!Number.isFinite(velocityMonthsPerSecond) || !Number.isFinite(momentumSeconds)) return offsetMonths

  return offsetMonths + velocityMonthsPerSecond * momentumSeconds
}

/**
 * Finds the stop closest to an offset. Ties resolve to the earlier stop.
 * @param {number} offsetMonths - Timeline offset in months to snap.
 * @param {number[]} stopOffsets - Candidate stop offsets in months.
 * @returns {number} Index of the nearest stop, or -1 when there is nothing to snap to.
 */
export function findNearestStopIndex(offsetMonths, stopOffsets) {
  if (!Array.isArray(stopOffsets) || !stopOffsets.length) return -1
  if (!Number.isFinite(offsetMonths)) return 0

  let nearestIndex = 0
  let nearestDistance = Math.abs(stopOffsets[0] - offsetMonths)

  stopOffsets.forEach((stop, index) => {
    const distance = Math.abs(stop - offsetMonths)
    if (distance < nearestDistance) {
      nearestIndex = index
      nearestDistance = distance
    }
  })

  return nearestIndex
}

/**
 * Clamps an offset into a closed range. Infinities clamp to the bound they point at; NaN falls back
 * to the lower bound because it carries no direction.
 * @param {number} value - Offset to clamp.
 * @param {number} minimum - Lower bound.
 * @param {number} maximum - Upper bound.
 * @returns {number} Clamped offset.
 */
export function clampOffset(value, minimum, maximum) {
  if (Number.isNaN(value)) return minimum
  return Math.min(maximum, Math.max(minimum, value))
}
