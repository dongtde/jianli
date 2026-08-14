import { describe, expect, it } from 'vitest'
import { buildCareerTimeline, formatMonthDuration } from './timeline'

const experience = [
  {
    period: '2024.10 - 至今',
    company: '当前公司',
    role: '前端开发工程师',
    signal: '空间可视化',
  },
  {
    period: '2021.11 - 2023.07',
    company: '早期公司',
    role: '前端开发工程师',
    signal: '多端业务',
  },
  {
    period: '2023.10 - 2024.02',
    company: '中期公司',
    role: '前端开发工程师',
    signal: '移动应用',
  },
]

describe('buildCareerTimeline', () => {
  it('sorts entries and maps their actual month spans onto the shared axis', () => {
    const timeline = buildCareerTimeline(experience, new Date(2026, 7, 1))

    expect(timeline.entries.map((item) => item.company)).toEqual(['早期公司', '中期公司', '当前公司'])
    expect(timeline.entries.map((item) => item.durationMonths)).toEqual([21, 5, 23])
    expect(timeline.entries[2].startPercent + timeline.entries[2].spanPercent).toBeCloseTo(100)
    expect(timeline.ticks.map((tick) => tick.label)).toEqual(['2021', '2022', '2023', '2024', '2025', '2026'])
    expect(timeline.startLabel).toBe('2021.11')
    expect(timeline.totalDurationLabel).toBe('4年1个月')
  })
})

describe('formatMonthDuration', () => {
  it('formats years and remaining months without empty units', () => {
    expect(formatMonthDuration(5)).toBe('5个月')
    expect(formatMonthDuration(12)).toBe('1年')
    expect(formatMonthDuration(25)).toBe('2年1个月')
  })
})
