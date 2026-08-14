const MONTHS_PER_YEAR = 12

const toMonthIndex = (year, month) => year * MONTHS_PER_YEAR + month - 1

const parseMonth = (value) => {
  const match = value?.trim().match(/^(\d{4})\.(\d{2})$/)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  if (month < 1 || month > MONTHS_PER_YEAR) return null

  return { year, month, index: toMonthIndex(year, month) }
}

const formatMonth = ({ year, month }) => `${year}.${String(month).padStart(2, '0')}`

/**
 * Formats an inclusive month count as a compact Chinese duration.
 * @param {number} months - Inclusive number of months.
 * @returns {string} Human-readable duration.
 */
export function formatMonthDuration(months) {
  const safeMonths = Math.max(0, Math.round(months))
  const years = Math.floor(safeMonths / MONTHS_PER_YEAR)
  const remainingMonths = safeMonths % MONTHS_PER_YEAR
  const parts = []

  if (years) parts.push(`${years}年`)
  if (remainingMonths) parts.push(`${remainingMonths}个月`)
  return parts.join('') || '0个月'
}

/**
 * Converts work history periods into a proportional month-based timeline.
 * Invalid period entries are omitted. The current month is used for entries ending in "至今".
 * @param {{period: string, company: string, role: string, signal: string}[]} experience - Work history entries.
 * @param {Date} [referenceDate=new Date()] - Date used as the current timeline endpoint.
 * @returns {{
 *   entries: Array<{period: string, company: string, role: string, signal: string, sequence: string, current: boolean, durationMonths: number, durationLabel: string, startPercent: number, spanPercent: number}>,
 *   ticks: Array<{label: string, position: number}>,
 *   startLabel: string,
 *   totalDurationLabel: string
 * }} Proportional career timeline data.
 */
export function buildCareerTimeline(experience, referenceDate = new Date()) {
  const currentMonth = {
    year: referenceDate.getFullYear(),
    month: referenceDate.getMonth() + 1,
  }
  currentMonth.index = toMonthIndex(currentMonth.year, currentMonth.month)

  const orderedEntries = experience
    .map((item) => {
      const [startValue, endValue = ''] = item.period.split(/\s+-\s+/)
      const start = parseMonth(startValue)
      const current = endValue.includes('至今')
      const end = current ? currentMonth : parseMonth(endValue)
      if (!start || !end) return null

      return {
        ...item,
        start,
        end: { ...end, index: Math.max(start.index, end.index) },
        current,
      }
    })
    .filter(Boolean)
    .sort((first, second) => first.start.index - second.start.index)

  if (!orderedEntries.length) {
    return { entries: [], ticks: [], startLabel: '', totalDurationLabel: '0个月' }
  }

  const axisStartYear = orderedEntries[0].start.year
  const axisStartIndex = toMonthIndex(axisStartYear, 1)
  const axisEndIndex = Math.max(currentMonth.index, ...orderedEntries.map((item) => item.end.index))
  const axisMonthCount = Math.max(1, axisEndIndex - axisStartIndex + 1)

  const entries = orderedEntries.map((item, index) => {
    const durationMonths = item.end.index - item.start.index + 1

    return {
      ...item,
      sequence: String(index + 1).padStart(2, '0'),
      durationMonths,
      durationLabel: formatMonthDuration(durationMonths),
      startPercent: ((item.start.index - axisStartIndex) / axisMonthCount) * 100,
      spanPercent: (durationMonths / axisMonthCount) * 100,
    }
  })

  const ticks = Array.from(
    { length: currentMonth.year - axisStartYear + 1 },
    (_, index) => {
      const year = axisStartYear + index
      return {
        label: String(year),
        position: ((toMonthIndex(year, 1) - axisStartIndex) / axisMonthCount) * 100,
      }
    },
  )

  const totalDurationMonths = entries.reduce((total, item) => total + item.durationMonths, 0)

  return {
    entries,
    ticks,
    startLabel: formatMonth(orderedEntries[0].start),
    totalDurationLabel: formatMonthDuration(totalDurationMonths),
  }
}
