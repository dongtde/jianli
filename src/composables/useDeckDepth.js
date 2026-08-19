import { onUnmounted, readonly, ref, toValue } from 'vue'
import { useRovingList } from './useRovingList'

const WHEEL_THRESHOLD = 18
const WHEEL_STEP_INTERVAL = 220
const WHEEL_IDLE_TIMEOUT = 280
const SWIPE_THRESHOLD = 42

/**
 * Coordinates keyboard, vertical wheel and swipe steps for a depth deck.
 * @param {import('vue').Ref<number> | (() => number)} count - Reactive deck size.
 * @param {number} [initialIndex=0] - Initially selected card.
 * @param {boolean | import('vue').Ref<boolean>} [reducedMotion=false] - Motion preference.
 * @returns {{activeIndex: Readonly<import('vue').Ref<number>>, select: Function, step: Function, jumpTo: Function, setItemRef: Function, handleKeydown: Function, handleWheel: Function, handleTouchStart: Function, handleTouchMove: Function, handleTouchEnd: Function}} Deck state and event handlers.
 */
export function useDeckDepth(count, initialIndex = 0, reducedMotion = false) {
  const { activeIndex, select, step, jumpTo, setItemRef } = useRovingList(count, initialIndex)
  const wheelDelta = ref(0)
  let wheelResetTimer
  let wheelBurstTimer
  let lastWheelStepAt = 0
  let wheelBurstActive = false
  let touchStart = null
  let touchTarget = null
  let touchIntent = 'pending'

  const motionReduced = () => Boolean(toValue(reducedMotion))

  const canTargetScroll = (target, direction) => {
    if (!(target instanceof Element)) return false
    const card = target.closest('.project-card')
    if (!card || card.scrollHeight <= card.clientHeight + 1) return false

    const atStart = card.scrollTop <= 1
    const atEnd = card.scrollTop + card.clientHeight >= card.scrollHeight - 1
    return (direction < 0 && !atStart) || (direction > 0 && !atEnd)
  }

  const scheduleWheelBurstEnd = () => {
    window.clearTimeout(wheelBurstTimer)
    wheelBurstTimer = window.setTimeout(() => {
      wheelBurstActive = false
    }, motionReduced() ? 100 : WHEEL_IDLE_TIMEOUT)
  }

  const handleKeydown = (event) => {
    const key = event.key
    if (key === 'ArrowLeft' || key === 'ArrowUp') {
      event.preventDefault()
      step(-1)
    } else if (key === 'ArrowRight' || key === 'ArrowDown') {
      event.preventDefault()
      step(1)
    } else if (key === 'Home') {
      event.preventDefault()
      jumpTo(0)
    } else if (key === 'End') {
      event.preventDefault()
      jumpTo(toValue(count) - 1)
    }
  }

  const handleWheel = (event) => {
    if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return

    const direction = event.deltaY > 0 ? 1 : -1
    if (canTargetScroll(event.target, direction)) return

    const nextIndex = activeIndex.value + direction
    if (nextIndex < 0 || nextIndex >= toValue(count)) {
      // Keep the tail of the same wheel burst inside the deck. A fresh input after
      // the idle window is allowed to bubble to the section navigator.
      if (wheelBurstActive) {
        event.preventDefault()
        event.stopPropagation()
        scheduleWheelBurstEnd()
      }
      return
    }

    event.preventDefault()
    event.stopPropagation()
    wheelBurstActive = true
    scheduleWheelBurstEnd()

    wheelDelta.value += event.deltaY
    window.clearTimeout(wheelResetTimer)
    wheelResetTimer = window.setTimeout(() => {
      wheelDelta.value = 0
    }, 120)

    if (Math.abs(wheelDelta.value) < WHEEL_THRESHOLD) return
    const now = performance.now()
    if (now - lastWheelStepAt < WHEEL_STEP_INTERVAL) return

    // Wheel/touch navigation should not move focus into an off-screen card.
    // Keyboard navigation keeps using `step`, which intentionally follows focus.
    select(activeIndex.value + (wheelDelta.value > 0 ? 1 : -1))
    wheelDelta.value = 0
    lastWheelStepAt = now
  }

  const handleTouchStart = (event) => {
    if (event.touches.length !== 1) {
      touchStart = null
      touchTarget = null
      touchIntent = 'pending'
      return
    }
    const touch = event.touches[0]
    touchStart = { x: touch.clientX, y: touch.clientY }
    touchTarget = event.target
    touchIntent = 'pending'
  }

  const handleTouchMove = (event) => {
    if (!touchStart || event.touches.length !== 1) return
    const touch = event.touches[0]
    const deltaX = touchStart.x - touch.clientX
    const deltaY = touchStart.y - touch.clientY
    if (touchIntent === 'pending' && Math.abs(deltaY) > SWIPE_THRESHOLD / 3 && Math.abs(deltaY) > Math.abs(deltaX)) {
      const direction = deltaY > 0 ? 1 : -1
      if (canTargetScroll(touchTarget, direction)) {
        touchIntent = 'content'
        return
      }

      const nextIndex = activeIndex.value + direction
      touchIntent = nextIndex < 0 || nextIndex >= toValue(count) ? 'boundary' : 'deck'
    }
    if (touchIntent === 'deck') {
      event.preventDefault()
      event.__projectDeckHandled = true
    }
  }

  const handleTouchEnd = (event) => {
    if (!touchStart) return
    const touch = event.changedTouches[0]
    const deltaX = touch ? touchStart.x - touch.clientX : 0
    const deltaY = touch ? touchStart.y - touch.clientY : 0
    if (touchIntent === 'deck' && Math.abs(deltaY) >= SWIPE_THRESHOLD && Math.abs(deltaY) > Math.abs(deltaX)) {
      select(activeIndex.value + (deltaY > 0 ? 1 : -1))
      event.__projectDeckHandled = true
    }
    touchStart = null
    touchTarget = null
    touchIntent = 'pending'
  }

  onUnmounted(() => {
    window.clearTimeout(wheelResetTimer)
    window.clearTimeout(wheelBurstTimer)
  })

  return {
    activeIndex: readonly(activeIndex),
    select,
    step,
    jumpTo,
    setItemRef,
    handleKeydown,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}
