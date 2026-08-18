import { readonly, ref, toValue, watch } from 'vue'

const clampIndex = (index, total) => {
  const lastIndex = Math.max(0, total - 1)
  const candidate = Number.isFinite(index) ? Math.round(index) : 0
  return Math.min(Math.max(0, candidate), lastIndex)
}

/**
 * Keeps a single active index over a variable-length list and moves DOM focus along with it.
 * Built for keyboard-driven single-open lists: `step` and `jumpTo` also focus the matching element
 * so assistive technology follows the selection, while `select` is the pointer path where the
 * browser has already moved focus. The index is re-clamped whenever the list shrinks, so a shorter
 * configuration can never leave it pointing past the end.
 * @param {import('vue').Ref<number> | (() => number)} count - Reactive item count.
 * @param {number} [initialIndex=0] - Index active on mount, clamped to the current count.
 * @returns {{
 *   activeIndex: Readonly<import('vue').Ref<number>>,
 *   select: (index: number) => void,
 *   step: (delta: number) => void,
 *   jumpTo: (index: number) => void,
 *   setItemRef: (index: number, element: HTMLElement | null) => void
 * }} Active index plus its pointer, keyboard and template-ref handles.
 */
export function useRovingList(count, initialIndex = 0) {
  const items = new Map()
  const activeIndex = ref(clampIndex(initialIndex, toValue(count)))

  const select = (index) => {
    activeIndex.value = clampIndex(index, toValue(count))
  }

  const jumpTo = (index) => {
    select(index)
    items.get(activeIndex.value)?.focus()
  }

  const step = (delta) => {
    jumpTo(activeIndex.value + delta)
  }

  const setItemRef = (index, element) => {
    if (element) items.set(index, element)
    else items.delete(index)
  }

  watch(
    () => toValue(count),
    (total) => {
      activeIndex.value = clampIndex(activeIndex.value, total)
    },
  )

  return { activeIndex: readonly(activeIndex), select, step, jumpTo, setItemRef }
}
