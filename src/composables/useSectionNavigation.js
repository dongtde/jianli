import { computed, onMounted, onUnmounted, readonly, ref, unref } from 'vue'

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

  const moveToAdjacentSection = (direction) => {
    const currentIndex = getCurrentIndex()
    const nextIndex = Math.min(orderedSections.value.length - 1, Math.max(0, currentIndex + direction))
    if (nextIndex !== currentIndex) scrollToSection(orderedSections.value[nextIndex])
  }

  const canPanelConsumeWheel = (event) => {
    const scrollablePanel = event.target instanceof Element
      ? event.target.closest('.section-content, .projects-layout')
      : null

    if (!scrollablePanel || scrollablePanel.scrollHeight <= scrollablePanel.clientHeight + 1) {
      return false
    }

    const atStart = scrollablePanel.scrollTop <= 1
    const atEnd = scrollablePanel.scrollTop + scrollablePanel.clientHeight >= scrollablePanel.scrollHeight - 1
    return (event.deltaY < 0 && !atStart) || (event.deltaY > 0 && !atEnd)
  }

  const handleWheel = (event) => {
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || canPanelConsumeWheel(event)) return

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
  })

  onUnmounted(() => {
    observer?.disconnect()
    scrollViewport.value?.removeEventListener('scroll', handleScroll)
    scrollViewport.value?.removeEventListener('wheel', handleWheel)
    window.clearTimeout(wheelUnlockTimer)
    window.clearTimeout(wheelResetTimer)
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
