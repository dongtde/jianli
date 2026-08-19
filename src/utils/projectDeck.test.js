import { describe, expect, it } from 'vitest'
import { getAccentVar, getCardDepth, getCardTransform } from './projectDeck'

describe('projectDeck', () => {
  it('keeps the selected card at the front of a circular deck', () => {
    expect(getCardDepth(2, 2, 6)).toBe(0)
    expect(getCardDepth(3, 2, 6)).toBe(1)
    expect(getCardDepth(1, 2, 6)).toBe(5)
  })

  it('returns stable depth styles and caps the visible stack', () => {
    const style = getCardTransform(5, 0, 6)
    expect(style.zIndex).toBe(1)
    expect(style.opacity).toBeGreaterThan(0)
    expect(style.transform).toContain('translate3d')
    expect(getCardTransform(0, 0, 6).opacity).toBe(1)
  })

  it('maps known accents and falls back to teal', () => {
    expect(getAccentVar('coral')).toBe('var(--coral)')
    expect(getAccentVar('unknown')).toBe('var(--teal)')
  })
})

