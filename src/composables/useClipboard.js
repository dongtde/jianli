import { onUnmounted, readonly, ref } from 'vue'

/**
 * Provides Clipboard API copying with a textarea fallback and transient success state.
 * @param {{resetDelay?: number}} [options] - Optional copied-state reset delay in milliseconds.
 * @returns {{copied: Readonly<import('vue').Ref<boolean>>, copyText: (text: string) => Promise<boolean>}} Copy state and action.
 */
export function useClipboard(options = {}) {
  const copied = ref(false)
  const resetDelay = options.resetDelay ?? 1800
  let resetTimer

  const resetCopiedState = () => {
    window.clearTimeout(resetTimer)
    resetTimer = window.setTimeout(() => {
      copied.value = false
    }, resetDelay)
  }

  const fallbackCopy = (text) => {
    const input = document.createElement('textarea')
    input.value = text
    input.setAttribute('readonly', '')
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.select()
    const succeeded = document.execCommand('copy')
    input.remove()
    return succeeded
  }

  const copyText = async (text) => {
    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text)
        } catch {
          if (!fallbackCopy(text)) throw new Error('Clipboard access unavailable')
        }
      } else if (!fallbackCopy(text)) {
        throw new Error('Clipboard access unavailable')
      }

      copied.value = true
      resetCopiedState()
      return true
    } catch (error) {
      console.warn('Text copy failed', error)
      return false
    }
  }

  onUnmounted(() => {
    window.clearTimeout(resetTimer)
  })

  return {
    copied: readonly(copied),
    copyText,
  }
}
