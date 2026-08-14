import { onMounted, onUnmounted, readonly, ref, unref, watch } from 'vue'

/**
 * Rotates through quotes with a typewriter effect and clears the timer on unmount.
 * @param {string[]} quotes - Ordered quotes to render.
 * @param {boolean | import('vue').Ref<boolean>} reducedMotion - Motion preference flag or ref.
 * @returns {{typedText: Readonly<import('vue').Ref<string>>}} Current typewriter text.
 */
export function useTypewriter(quotes, reducedMotion) {
  const typedText = ref('')
  const quoteIndex = ref(0)
  let quoteTimer

  const clearQuoteTimer = () => {
    window.clearTimeout(quoteTimer)
    quoteTimer = undefined
  }

  const startTyping = () => {
    clearQuoteTimer()

    if (!quotes.length) {
      typedText.value = ''
      return
    }

    if (unref(reducedMotion)) {
      typedText.value = quotes[0]
      return
    }

    let characterIndex = 0
    let deleting = false

    const tick = () => {
      const quote = quotes[quoteIndex.value] ?? ''

      if (!deleting && characterIndex < quote.length) {
        characterIndex += 1
        typedText.value = quote.slice(0, characterIndex)
        quoteTimer = window.setTimeout(tick, 92)
        return
      }

      if (!deleting) {
        deleting = true
        quoteTimer = window.setTimeout(tick, 2200)
        return
      }

      if (characterIndex > 0) {
        characterIndex -= 1
        typedText.value = quote.slice(0, characterIndex)
        quoteTimer = window.setTimeout(tick, 42)
        return
      }

      deleting = false
      quoteIndex.value = (quoteIndex.value + 1) % quotes.length
      quoteTimer = window.setTimeout(tick, 420)
    }

    quoteTimer = window.setTimeout(tick, 520)
  }

  onMounted(startTyping)
  watch(() => unref(reducedMotion), startTyping)
  onUnmounted(clearQuoteTimer)

  return {
    typedText: readonly(typedText),
  }
}
