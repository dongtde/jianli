import { onMounted, onUnmounted, readonly, ref } from 'vue'

/**
 * Tracks the user's reduced-motion media preference and removes listeners on unmount.
 * @returns {{reducedMotion: Readonly<import('vue').Ref<boolean>>}} Reactive reduced-motion flag.
 */
export function useReducedMotion() {
  const reducedMotion = ref(false)
  let mediaQuery

  const updatePreference = () => {
    reducedMotion.value = Boolean(mediaQuery?.matches)
  }

  onMounted(() => {
    if (!window.matchMedia) return

    mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    updatePreference()

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updatePreference)
      return
    }

    mediaQuery.addListener(updatePreference)
  })

  onUnmounted(() => {
    if (!mediaQuery) return

    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', updatePreference)
      return
    }

    mediaQuery.removeListener(updatePreference)
  })

  return {
    reducedMotion: readonly(reducedMotion),
  }
}
