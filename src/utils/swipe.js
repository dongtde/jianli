/**
 * Resolves a dominant horizontal swipe into an item direction.
 * @param {{x: number, y: number} | null} start - Gesture start point.
 * @param {{x: number, y: number} | null} end - Gesture end point.
 * @param {number} [minimumDistance=48] - Required horizontal travel in pixels.
 * @returns {-1 | 0 | 1} Previous item, no swipe, or next item.
 */
export function getHorizontalSwipeDirection(start, end, minimumDistance = 48) {
  if (!start || !end) return 0

  const deltaX = start.x - end.x
  const deltaY = start.y - end.y
  if (Math.abs(deltaX) < minimumDistance || Math.abs(deltaX) <= Math.abs(deltaY)) return 0
  return deltaX > 0 ? 1 : -1
}
