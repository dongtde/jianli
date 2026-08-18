import { onMounted, onUnmounted, readonly, ref } from 'vue'

/**
 * Tracks a CSS media query as reactive state and removes the listener on unmount.
 * The query is only read once mounted, so the flag stays `false` until then — callers should treat
 * `false` as "not compact yet" rather than as a measured answer.
 * @param {string} query - Media query text, for example `(max-width: 680px)`.
 * @returns {Readonly<import('vue').Ref<boolean>>} Reactive match flag.
 */
export function useMediaQuery(query) {
  const matches = ref(false)
  let mediaQuery

  const updateMatches = () => {
    matches.value = Boolean(mediaQuery?.matches)
  }

  onMounted(() => {
    if (!window.matchMedia) return

    mediaQuery = window.matchMedia(query)
    updateMatches()

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatches)
      return
    }

    mediaQuery.addListener(updateMatches)
  })

  onUnmounted(() => {
    if (!mediaQuery) return

    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', updateMatches)
      return
    }

    mediaQuery.removeListener(updateMatches)
  })

  return readonly(matches)
}
