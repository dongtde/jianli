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
 * Formats a month offset counted from January of the axis start year as `YYYY.MM`.
 * @param {number} axisStartYear - Year the offset is counted from.
 * @param {number} monthOffset - Offset in months; fractional values round to the nearest month.
 * @returns {string} Month label.
 */
export function formatMonthOffset(axisStartYear, monthOffset) {
  const total = toMonthIndex(axisStartYear, 1) + Math.round(monthOffset || 0)
  const year = Math.floor(total / MONTHS_PER_YEAR)
  return formatMonth({ year, month: total - year * MONTHS_PER_YEAR + 1 })
}

const EMPTY_TIMELINE = {
  entries: [],
  ticks: [],
  gaps: [],
  axisMonthCount: 0,
  axisStartYear: 0,
  startLabel: '',
  totalDurationLabel: '0个月',
  nowMonthOffset: 0,
  careerSpanMonths: 0,
  careerSpanLabel: '0个月',
  gapMonths: 0,
  gapLabel: '0个月',
}

/**
 * Converts work history periods into a proportional month-based timeline.
 * Invalid period entries are omitted. The current month is used for entries ending in "至今".
 * Month offsets are counted from January of the first employment year, so the axis head may
 * contain leading months that belong to no entry and are not treated as career gaps.
 * @param {{period: string, company: string, role: string, signal: string, highlights?: string[]}[]} experience - Work history entries.
 * @param {Date} [referenceDate=new Date()] - Date used as the current timeline endpoint.
 * @returns {{
 *   entries: Array<{period: string, company: string, role: string, signal: string, sequence: string, current: boolean, durationMonths: number, durationLabel: string, startLabel: string, endLabel: string, startPercent: number, spanPercent: number, focusPercent: number, startMonthOffset: number, focusMonthOffset: number, sinceMonths: number, sinceLabel: string}>,
 *   ticks: Array<{label: string, position: number}>,
 *   gaps: Array<{key: string, startMonthOffset: number, months: number, label: string, startPercent: number, spanPercent: number, fromCompany: string, toCompany: string}>,
 *   axisMonthCount: number,
 *   axisStartYear: number,
 *   startLabel: string,
 *   totalDurationLabel: string,
 *   nowMonthOffset: number,
 *   careerSpanMonths: number,
 *   careerSpanLabel: string,
 *   gapMonths: number,
 *   gapLabel: string
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
    return { ...EMPTY_TIMELINE }
  }

  const axisStartYear = orderedEntries[0].start.year
  const axisStartIndex = toMonthIndex(axisStartYear, 1)
  const axisEndIndex = Math.max(currentMonth.index, ...orderedEntries.map((item) => item.end.index))
  const axisMonthCount = Math.max(1, axisEndIndex - axisStartIndex + 1)

  const entries = orderedEntries.map((item, index) => {
    const durationMonths = item.end.index - item.start.index + 1
    const startMonthOffset = item.start.index - axisStartIndex
    const startPercent = (startMonthOffset / axisMonthCount) * 100
    const spanPercent = (durationMonths / axisMonthCount) * 100
    const sinceMonths = item.current ? 0 : Math.max(0, currentMonth.index - item.end.index)

    return {
      ...item,
      sequence: String(index + 1).padStart(2, '0'),
      durationMonths,
      durationLabel: formatMonthDuration(durationMonths),
      startLabel: formatMonth(item.start),
      endLabel: item.current ? 'NOW' : formatMonth(item.end),
      startPercent,
      spanPercent,
      focusPercent: Math.min(100, startPercent + spanPercent / 2),
      startMonthOffset,
      focusMonthOffset: startMonthOffset + durationMonths / 2,
      sinceMonths,
      sinceLabel: item.current ? '进行中' : formatMonthDuration(sinceMonths),
    }
  })

  const gaps = orderedEntries.slice(1).reduce((collected, item, index) => {
    const previous = orderedEntries[index]
    const months = item.start.index - previous.end.index - 1
    if (months <= 0) return collected

    const startMonthOffset = previous.end.index + 1 - axisStartIndex
    collected.push({
      key: `gap-${startMonthOffset}`,
      startMonthOffset,
      months,
      label: formatMonthDuration(months),
      startPercent: (startMonthOffset / axisMonthCount) * 100,
      spanPercent: (months / axisMonthCount) * 100,
      fromCompany: previous.company,
      toCompany: item.company,
    })
    return collected
  }, [])

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
  const careerSpanMonths = Math.max(1, currentMonth.index - orderedEntries[0].start.index + 1)
  const gapMonths = gaps.reduce((total, item) => total + item.months, 0)

  return {
    entries,
    ticks,
    gaps,
    axisMonthCount,
    axisStartYear,
    startLabel: formatMonth(orderedEntries[0].start),
    totalDurationLabel: formatMonthDuration(totalDurationMonths),
    nowMonthOffset: currentMonth.index - axisStartIndex,
    careerSpanMonths,
    careerSpanLabel: formatMonthDuration(careerSpanMonths),
    gapMonths,
    gapLabel: formatMonthDuration(gapMonths),
  }
}
