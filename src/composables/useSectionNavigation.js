import { computed, onMounted, onUnmounted, readonly, ref, unref } from 'vue'

const SCROLLABLE_PANEL_SELECTOR = '.section-content, .project-card'
const TOUCH_INTENT_THRESHOLD = 8
const TOUCH_NAVIGATION_THRESHOLD = 48

/**
 * Checks whether a scrollable element can continue in the requested direction.
 * @param {{ scrollTop: number, scrollHeight: number, clientHeight: number } | null} element - Scroll metrics source.
 * @param {number} direction - Positive for down, negative for up.
 * @returns {boolean} Whether the element should consume the gesture.
 */
export function canScrollElementInDirection(element, direction) {
  if (!element || element.scrollHeight <= element.clientHeight + 1) return false

  const atStart = element.scrollTop <= 1
  const atEnd = element.scrollTop + element.clientHeight >= element.scrollHeight - 1
  return (direction < 0 && !atStart) || (direction > 0 && !atEnd)
}

/**
 * Resolves a dominant vertical swipe into a section direction.
 * @param {{ x: number, y: number } | null} start - Gesture start point.
 * @param {{ x: number, y: number } | null} end - Current or final gesture point.
 * @param {number} minimumDistance - Required vertical travel in pixels.
 * @returns {-1 | 0 | 1} Previous section, no swipe, or next section.
 */
export function getVerticalSwipeDirection(start, end, minimumDistance = TOUCH_NAVIGATION_THRESHOLD) {
  if (!start || !end) return 0

  const deltaX = start.x - end.x
  const deltaY = start.y - end.y
  if (Math.abs(deltaY) < minimumDistance || Math.abs(deltaY) <= Math.abs(deltaX)) return 0
  return deltaY > 0 ? 1 : -1
}

/**
 * Coordinates full-page section navigation, scroll progress, and reveal state.
 * DOM observers and event listeners are created on mount and removed on unmount.
 * @param {string[] | import('vue').Ref<string[]>} sectionIds - Ordered section ids.
 * @param {boolean | import('vue').Ref<boolean>} reducedMotion - Motion preference flag or ref.
 * @returns {{
 *   activeSection: Readonly<import('vue').Ref<string>>,
 *   revealedSections: Readonly<import('vue').Ref<Set<string>>>,
 *   scrollProgress: Readonly<import('vue').Ref<number>>,
 *   scrollViewport: import('vue').Ref<HTMLElement | null>,
 *   activateSection: (id: string) => void,
 *   scrollToSection: (id: string) => void
 * }} Section navigation state and actions.
 */
export function useSectionNavigation(sectionIds, reducedMotion) {
  const orderedSections = computed(() => unref(sectionIds))
  const activeSection = ref(orderedSections.value[0] ?? '')
  const revealedSections = ref(new Set([activeSection.value]))
  const scrollProgress = ref(0)
  const scrollViewport = ref(null)

  let observer
  let wheelLocked = false
  let wheelDelta = 0
  let wheelUnlockTimer
  let wheelResetTimer
  let touchStartPoint = null
  let touchTarget = null
  let touchIntent = 'pending'
  let touchDirection = 0
  let touchLocked = false
  let touchUnlockTimer

  const hasSection = (id) => orderedSections.value.includes(id)

  const activateSection = (id) => {
    if (hasSection(id)) activeSection.value = id
  }

  const getCurrentIndex = () => Math.max(0, orderedSections.value.indexOf(activeSection.value))

  const handleScroll = () => {
    const viewport = scrollViewport.value
    if (!viewport) return

    const max = viewport.scrollHeight - viewport.clientHeight
    scrollProgress.value = max > 0 ? viewport.scrollTop / max : 0
  }

  const scrollToSection = (id) => {
    activateSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: unref(reducedMotion) ? 'auto' : 'smooth' })
  }

  const getAdjacentSectionId = (direction) => {
    const currentIndex = getCurrentIndex()
    const nextIndex = Math.min(orderedSections.value.length - 1, Math.max(0, currentIndex + direction))
    return nextIndex === currentIndex ? null : orderedSections.value[nextIndex]
  }

  const moveToAdjacentSection = (direction) => {
    const nextSectionId = getAdjacentSectionId(direction)
    if (!nextSectionId) return false

    scrollToSection(nextSectionId)
    return true
  }

  const canPanelConsumeScroll = (target, direction) => {
    if (!(target instanceof Element)) return false

    const scrollablePanel = target.closest(SCROLLABLE_PANEL_SELECTOR)
    if (canScrollElementInDirection(scrollablePanel, direction)) return true

    const projectsSection = target.closest('.projects-section')
    if (projectsSection) {
      return direction > 0
        ? projectsSection.dataset.canNext === 'true'
        : projectsSection.dataset.canPrev === 'true'
    }

    return false
  }

  const handleWheel = (event) => {
    if (
      event.ctrlKey
      || Math.abs(event.deltaX) > Math.abs(event.deltaY)
      || canPanelConsumeScroll(event.target, event.deltaY)
    ) return

    event.preventDefault()
    if (wheelLocked) return

    wheelDelta += event.deltaY
    window.clearTimeout(wheelResetTimer)
    wheelResetTimer = window.setTimeout(() => {
      wheelDelta = 0
    }, 120)

    if (Math.abs(wheelDelta) < 18) return

    wheelLocked = true
    moveToAdjacentSection(wheelDelta > 0 ? 1 : -1)
    wheelDelta = 0
    wheelUnlockTimer = window.setTimeout(() => {
      wheelLocked = false
    }, unref(reducedMotion) ? 120 : 760)
  }

  const resetTouchGesture = () => {
    touchStartPoint = null
    touchTarget = null
    touchIntent = 'pending'
    touchDirection = 0
  }

  const handleTouchStart = (event) => {
    if (event.touches.length !== 1) {
      resetTouchGesture()
      return
    }

    const touch = event.touches[0]
    touchStartPoint = { x: touch.clientX, y: touch.clientY }
    touchTarget = event.target
    touchIntent = 'pending'
    touchDirection = 0
  }

  const handleTouchMove = (event) => {
    if (event.__projectDeckHandled) return
    if (!touchStartPoint || event.touches.length !== 1) return

    const touch = event.touches[0]
    const currentPoint = { x: touch.clientX, y: touch.clientY }

    if (touchIntent === 'pending') {
      const direction = getVerticalSwipeDirection(touchStartPoint, currentPoint, TOUCH_INTENT_THRESHOLD)
      if (!direction) {
        const horizontalDistance = Math.abs(touchStartPoint.x - currentPoint.x)
        const verticalDistance = Math.abs(touchStartPoint.y - currentPoint.y)
        if (horizontalDistance >= TOUCH_INTENT_THRESHOLD && horizontalDistance > verticalDistance) {
          touchIntent = 'ignore'
        }
        return
      }

      touchDirection = direction
      if (canPanelConsumeScroll(touchTarget, direction)) {
        touchIntent = 'panel'
        return
      }

      touchIntent = getAdjacentSectionId(direction) ? 'section' : 'ignore'
    }

    if (touchIntent === 'section') event.preventDefault()
  }

  const handleTouchEnd = (event) => {
    if (event.__projectDeckHandled) {
      resetTouchGesture()
      return
    }
    if (!touchStartPoint) return

    const touch = event.changedTouches[0]
    const endPoint = touch ? { x: touch.clientX, y: touch.clientY } : null
    const direction = getVerticalSwipeDirection(touchStartPoint, endPoint)
    const panelCanConsume = direction ? canPanelConsumeScroll(touchTarget, direction) : false
    const shouldNavigate = direction
      && direction === (touchDirection || direction)
      && (touchIntent === 'section' || (touchIntent === 'pending' && !panelCanConsume))

    resetTouchGesture()
    if (!shouldNavigate || touchLocked) return

    touchLocked = true
    moveToAdjacentSection(direction)
    touchUnlockTimer = window.setTimeout(() => {
      touchLocked = false
    }, unref(reducedMotion) ? 120 : 760)
  }

  const observeSections = () => {
    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visible) activateSection(visible.target.id)

        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry) => {
            revealedSections.value = new Set([...revealedSections.value, entry.target.id])
          })
      },
      { root: scrollViewport.value, threshold: [0.45, 0.62, 0.78] },
    )

    orderedSections.value.forEach((id) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })
  }

  onMounted(() => {
    observeSections()
    handleScroll()
    scrollViewport.value?.addEventListener('scroll', handleScroll, { passive: true })
    scrollViewport.value?.addEventListener('wheel', handleWheel, { passive: false })
    scrollViewport.value?.addEventListener('touchstart', handleTouchStart, { passive: true })
    scrollViewport.value?.addEventListener('touchmove', handleTouchMove, { passive: false })
    scrollViewport.value?.addEventListener('touchend', handleTouchEnd, { passive: true })
    scrollViewport.value?.addEventListener('touchcancel', resetTouchGesture, { passive: true })
  })

  onUnmounted(() => {
    observer?.disconnect()
    scrollViewport.value?.removeEventListener('scroll', handleScroll)
    scrollViewport.value?.removeEventListener('wheel', handleWheel)
    scrollViewport.value?.removeEventListener('touchstart', handleTouchStart)
    scrollViewport.value?.removeEventListener('touchmove', handleTouchMove)
    scrollViewport.value?.removeEventListener('touchend', handleTouchEnd)
    scrollViewport.value?.removeEventListener('touchcancel', resetTouchGesture)
    window.clearTimeout(wheelUnlockTimer)
    window.clearTimeout(wheelResetTimer)
    window.clearTimeout(touchUnlockTimer)
  })

  return {
    activeSection: readonly(activeSection),
    revealedSections: readonly(revealedSections),
    scrollProgress: readonly(scrollProgress),
    scrollViewport,
    activateSection,
    scrollToSection,
  }
}
