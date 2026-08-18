const DEFAULT_MAX_AXIS_LABELS = 8
const TAG_SEPARATORS = /[·、,，|;；]/

/**
 * Splits a signal line such as "数字孪生 · 地图可视化" into individual tags.
 * The slash is not a separator, so stacks like "Vue2/3" survive intact.
 * @param {string} [signal] - Raw signal text from the resume config.
 * @returns {string[]} Trimmed, non-empty tags.
 */
export function splitSignalTags(signal) {
  return String(signal ?? '')
    .split(TAG_SEPARATORS)
    .map((tag) => tag.trim())
    .filter(Boolean)
}

/**
 * Shapes a career timeline into a reverse-chronological Gantt model.
 * Rows read newest first so the most recent role lands at the top. Axis labels thin out once a career
 * spans more years than `maxAxisLabels`, so a long or short history both stay legible without
 * changing the markup.
 * @param {ReturnType<import('./timeline').buildCareerTimeline>} timeline - Proportional career timeline.
 * @param {number} [maxAxisLabels=8] - Upper bound on labelled year ticks; extra years keep their line only.
 * @returns {{
 *   rows: Array<{key: string, chronologicalIndex: number, tags: string[], entry: object}>,
 *   ticks: Array<{label: string, position: number, labelled: boolean}>,
 *   nowPercent: number
 * }} Display-ready chart model.
 */
export function buildCareerChart(timeline, maxAxisLabels = DEFAULT_MAX_AXIS_LABELS) {
  const entries = timeline?.entries ?? []
  const sourceTicks = timeline?.ticks ?? []
  const axisMonthCount = timeline?.axisMonthCount ?? 0

  const rows = entries
    .map((entry, index) => ({
      key: `${entry.company}-${entry.startLabel}`,
      chronologicalIndex: index,
      tags: splitSignalTags(entry.signal),
      entry,
    }))
    .reverse()

  const labelStep = Math.max(1, Math.ceil(sourceTicks.length / Math.max(1, maxAxisLabels)))
  const ticks = sourceTicks.map((tick, index) => ({
    ...tick,
    labelled: index % labelStep === 0,
  }))

  return {
    rows,
    ticks,
    nowPercent: axisMonthCount > 0
      ? Math.min(100, Math.max(0, ((timeline.nowMonthOffset ?? 0) / axisMonthCount) * 100))
      : 100,
  }
}
