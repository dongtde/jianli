import { describe, expect, it } from 'vitest'
import { canScrollElementInDirection, getVerticalSwipeDirection } from './useSectionNavigation'

describe('canScrollElementInDirection', () => {
  it('lets a scrollable panel consume movement before its boundary', () => {
    const panel = { scrollTop: 40, clientHeight: 200, scrollHeight: 480 }

    expect(canScrollElementInDirection(panel, -1)).toBe(true)
    expect(canScrollElementInDirection(panel, 1)).toBe(true)
  })

  it('releases movement at the matching boundary', () => {
    const atStart = { scrollTop: 0, clientHeight: 200, scrollHeight: 480 }
    const atEnd = { scrollTop: 280, clientHeight: 200, scrollHeight: 480 }

    expect(canScrollElementInDirection(atStart, -1)).toBe(false)
    expect(canScrollElementInDirection(atStart, 1)).toBe(true)
    expect(canScrollElementInDirection(atEnd, -1)).toBe(true)
    expect(canScrollElementInDirection(atEnd, 1)).toBe(false)
  })

  it('ignores elements without overflow', () => {
    const panel = { scrollTop: 0, clientHeight: 200, scrollHeight: 200 }

    expect(canScrollElementInDirection(panel, 1)).toBe(false)
  })
})

describe('getVerticalSwipeDirection', () => {
  it('maps upward and downward swipes to adjacent-section directions', () => {
    expect(getVerticalSwipeDirection({ x: 100, y: 300 }, { x: 108, y: 220 })).toBe(1)
    expect(getVerticalSwipeDirection({ x: 100, y: 220 }, { x: 94, y: 300 })).toBe(-1)
  })

  it('ignores short or horizontally dominant gestures', () => {
    expect(getVerticalSwipeDirection({ x: 100, y: 300 }, { x: 104, y: 270 })).toBe(0)
    expect(getVerticalSwipeDirection({ x: 100, y: 300 }, { x: 180, y: 250 })).toBe(0)
  })
})
