const ACCENT_VARS = {
  teal: 'var(--teal)',
  lime: 'var(--lime)',
  coral: 'var(--coral)',
  steel: 'var(--steel)',
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/**
 * Returns the forward depth of a card in a circular deck.
 * @param {number} index - Card index.
 * @param {number} activeIndex - Front card index.
 * @param {number} total - Number of cards.
 * @returns {number} Zero for the front card, otherwise its depth behind it.
 */
export function getCardDepth(index, activeIndex, total) {
  if (total <= 0) return 0
  const normalizedIndex = clamp(Math.round(index), 0, total - 1)
  const normalizedActive = clamp(Math.round(activeIndex), 0, total - 1)
  return (normalizedIndex - normalizedActive + total) % total
}

/**
 * Creates the visual transform for a card at a given depth.
 * @param {number} index - Card index.
 * @param {number} activeIndex - Front card index.
 * @param {number} total - Number of cards.
 * @param {boolean} [reducedMotion=false] - Whether to avoid animated depth motion.
 * @returns {Record<string, string | number>} Inline CSS custom properties and visibility values.
 */
export function getCardTransform(index, activeIndex, total, reducedMotion = false) {
  const depth = getCardDepth(index, activeIndex, total)
  const visibleDepth = Math.min(depth, 4)
  const offset = visibleDepth * 28
  const scale = 1 - visibleDepth * 0.055
  const opacity = depth === 0 ? 1 : Math.max(0.12, 0.68 - visibleDepth * 0.13)
  const blur = depth === 0 ? 0 : Math.min(4, visibleDepth * 0.9)
  const rotation = depth === 0 ? 0 : (depth % 2 ? -1 : 1) * Math.min(5, visibleDepth * 1.15)
  const transform = reducedMotion
    ? `translate3d(${offset}px, ${visibleDepth * 4}px, 0) scale(${scale}) rotateY(${rotation}deg)`
    : `translate3d(${offset}px, ${visibleDepth * 4}px, ${-visibleDepth * 88}px) scale(${scale}) rotateY(${rotation}deg)`

  return {
    '--project-depth': depth,
    '--project-offset': `${offset}px`,
    '--project-accent-opacity': opacity,
    transform,
    opacity,
    filter: `blur(${blur}px)`,
    zIndex: total - depth,
    pointerEvents: depth === 0 ? 'auto' : 'auto',
  }
}

/**
 * Resolves a configured accent name to a local CSS variable.
 * @param {string} accent - Accent key from project data.
 * @returns {string} CSS color value.
 */
export function getAccentVar(accent) {
  return ACCENT_VARS[accent] ?? ACCENT_VARS.teal
}

