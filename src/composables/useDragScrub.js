import { onUnmounted, readonly, ref, watch } from 'vue'

const VELOCITY_WINDOW_MS = 100

/**
 * Tracks a horizontal pointer drag on an element and reports live travel plus release velocity.
 * Deliberately knows nothing about what the pixels mean; the caller converts them to domain units.
 * Vertical-dominant gestures are never claimed, so full-page paging keeps working from the same
 * surface. `pointercancel` and `lostpointercapture` land through the same path as `pointerup`, so an
 * interrupted drag can never leave the caller halfway. Listeners are attached while the element
 * exists and removed on unmount.
 * @param {import('vue').Ref<HTMLElement | null>} elementRef - Drag surface.
 * @param {{threshold?: number, onDrag?: (deltaPixels: number) => void, onRelease?: (release: {deltaPixels: number, velocityPixelsPerSecond: number}) => void}} [options] - Claim threshold in pixels and drag callbacks.
 * @returns {{dragging: Readonly<import('vue').Ref<boolean>>}} Whether a drag is currently claimed.
 */
export function useDragScrub(elementRef, options = {}) {
  const { threshold = 8, onDrag, onRelease } = options
  const dragging = ref(false)

  let activePointerId = null
  let startX = 0
  let startY = 0
  let claimed = false
  let samples = []

  const reset = () => {
    activePointerId = null
    claimed = false
    samples = []
    dragging.value = false
  }

  const measureVelocity = (clientX, timeStamp) => {
    const oldest = samples[0]
    const latest = samples[samples.length - 1]
    if (!oldest || !latest) return 0
    if (timeStamp - latest.time > VELOCITY_WINDOW_MS) return 0

    const elapsed = timeStamp - oldest.time
    if (elapsed <= 0) return 0
    return ((clientX - oldest.x) / elapsed) * 1000
  }

  const handlePointerMove = (event) => {
    if (event.pointerId !== activePointerId) return

    const deltaX = event.clientX - startX
    const deltaY = event.clientY - startY

    if (!claimed) {
      if (Math.abs(deltaX) < threshold || Math.abs(deltaX) <= Math.abs(deltaY)) return
      claimed = true
      dragging.value = true
      elementRef.value?.setPointerCapture?.(activePointerId)
    }

    samples.push({ x: event.clientX, time: event.timeStamp })
    while (samples.length > 2 && event.timeStamp - samples[0].time > VELOCITY_WINDOW_MS) samples.shift()

    onDrag?.(deltaX)
  }

  const land = (event) => {
    if (event.pointerId !== activePointerId) return

    const pointerId = activePointerId
    const wasClaimed = claimed
    const deltaPixels = event.clientX - startX
    const velocityPixelsPerSecond = wasClaimed ? measureVelocity(event.clientX, event.timeStamp) : 0

    reset()
    stopTracking()
    if (elementRef.value?.hasPointerCapture?.(pointerId)) elementRef.value.releasePointerCapture(pointerId)
    if (wasClaimed) onRelease?.({ deltaPixels, velocityPixelsPerSecond })
  }

  function startTracking() {
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', land)
    window.addEventListener('pointercancel', land)
    window.addEventListener('lostpointercapture', land)
  }

  function stopTracking() {
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', land)
    window.removeEventListener('pointercancel', land)
    window.removeEventListener('lostpointercapture', land)
  }

  const handlePointerDown = (event) => {
    if (activePointerId !== null || !event.isPrimary) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    activePointerId = event.pointerId
    startX = event.clientX
    startY = event.clientY
    claimed = false
    samples = [{ x: event.clientX, time: event.timeStamp }]
    startTracking()
  }

  const teardown = () => {
    stopTracking()
    reset()
  }

  watch(
    elementRef,
    (element, previousElement) => {
      previousElement?.removeEventListener('pointerdown', handlePointerDown)
      if (previousElement) teardown()
      element?.addEventListener('pointerdown', handlePointerDown)
    },
    { immediate: true },
  )

  onUnmounted(() => {
    elementRef.value?.removeEventListener('pointerdown', handlePointerDown)
    teardown()
  })

  return { dragging: readonly(dragging) }
}
