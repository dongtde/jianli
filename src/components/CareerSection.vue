<script setup>
import { computed, watch } from 'vue'
import { buildCareerTimeline } from '../utils/timeline'
import { buildCareerChart } from '../utils/careerChart'
import { toIsoMonth } from '../utils/format'
import { useMediaQuery } from '../composables/useMediaQuery'
import { useRovingList } from '../composables/useRovingList'

/** Past this many roles the always-open score stops fitting one screen, so rows fold again. */
const SCORE_ROW_LIMIT = 5
/** Narrow or short viewports cannot hold every role's detail either, whatever the role count is. */
const COMPACT_VIEWPORT = '(max-width: 680px), (max-height: 620px)'

const props = defineProps({
  active: { type: Boolean, default: false },
  visible: { type: Boolean, default: false },
  experience: { type: Array, required: true },
})

const emit = defineEmits(['focus-change'])

const timeline = computed(() => buildCareerTimeline(props.experience))
const chart = computed(() => buildCareerChart(timeline.value))
const rows = computed(() => chart.value.rows)

const compactViewport = useMediaQuery(COMPACT_VIEWPORT)

/**
 * Score mode keeps every role's detail on screen so the chart fills the section; folded mode is the
 * disclosure fallback for long histories and small viewports. The flag drives markup as well as
 * styling, so `inert` and `aria-hidden` never disagree with what is actually painted.
 */
const folded = computed(() => compactViewport.value || rows.value.length > SCORE_ROW_LIMIT)

// Rows read newest first, so row 0 is always the role a visitor should land on.
const { activeIndex, select, step, jumpTo, setItemRef } = useRovingList(() => rows.value.length)

const openRow = computed(() => rows.value[activeIndex.value] ?? null)

const isDetailVisible = (index) => !folded.value || index === activeIndex.value

const handleKeydown = (event) => {
  const keyActions = {
    ArrowUp: () => step(-1),
    ArrowDown: () => step(1),
    Home: () => jumpTo(0),
    End: () => jumpTo(rows.value.length - 1),
  }

  const action = keyActions[event.key]
  if (!action) return

  event.preventDefault()
  action()
}

/** The 3D corridor camera tracks the open role, so it needs the chronological axis position. */
watch(
  openRow,
  (row) => {
    const axisMonthCount = timeline.value.axisMonthCount
    emit('focus-change', {
      progress: row && axisMonthCount > 0 ? row.entry.focusMonthOffset / axisMonthCount : 0,
      index: row?.chronologicalIndex ?? 0,
    })
  },
  { immediate: true },
)
</script>

<template>
  <section
    id="route"
    class="scene-section route-section"
    :class="{ 'is-visible': visible, active }"
    aria-labelledby="route-title"
  >
    <div class="section-content career-content">
      <h2 id="route-title" class="sr-only">工作经验</h2>

      <div v-if="rows.length" class="career-chart">
        <div class="career-axis">
          <span class="axis-caption">{{ timeline.startLabel }} → NOW</span>
          <div class="axis-scale" aria-hidden="true">
            <span
              v-for="tick in chart.ticks"
              :key="`tick-${tick.label}`"
              class="axis-tick"
              :class="{ 'is-labelled': tick.labelled }"
              :style="{ '--tick-at': `${tick.position}%` }"
            ><i>{{ tick.label }}</i></span>
          </div>
        </div>

        <div class="career-plot">
          <div class="career-gridlines" aria-hidden="true">
            <i
              v-for="tick in chart.ticks"
              :key="`gridline-${tick.label}`"
              :class="{ 'is-labelled': tick.labelled }"
              :style="{ '--tick-at': `${tick.position}%` }"
            ></i>
            <b class="gridline-now" :style="{ '--tick-at': `${chart.nowPercent}%` }"><em>NOW</em></b>
          </div>

          <ol class="career-tracks" :class="{ 'is-folded': folded }" @keydown="handleKeydown">
            <li
              v-for="(row, index) in rows"
              :key="row.key"
              class="career-row"
              :class="{ 'is-open': index === activeIndex, 'is-current': row.entry.current }"
              :style="{ '--row-index': index }"
            >
              <button
                :id="`career-track-${row.chronologicalIndex}`"
                :ref="(element) => setItemRef(index, element)"
                type="button"
                class="career-track"
                :aria-expanded="folded ? index === activeIndex : undefined"
                :aria-controls="folded ? `career-panel-${row.chronologicalIndex}` : undefined"
                :aria-current="!folded && index === activeIndex ? 'true' : undefined"
                :aria-label="`${row.entry.company}，${row.entry.role}，${row.entry.period}，共 ${row.entry.durationLabel}`"
                :title="`${row.entry.company} · ${row.entry.role} · ${row.entry.period}`"
                @click="select(index)"
              >
                <span class="track-label">
                  <span class="track-name">
                    <span class="name-company">
                      <span class="company-text">{{ row.entry.company }}</span>
                      <span v-if="row.entry.current" class="company-flag">CURRENT</span>
                    </span>
                    <span class="name-meta">
                      <span class="meta-role">{{ row.entry.role }}</span>
                      <span class="meta-span">{{ row.entry.durationLabel }}</span>
                    </span>
                  </span>
                </span>

                <span class="track-lane">
                  <span
                    class="track-bar"
                    :style="{
                      '--bar-start': `${row.entry.startPercent}%`,
                      '--bar-span': `${row.entry.spanPercent}%`,
                    }"
                  ></span>
                </span>
              </button>

              <div
                :id="`career-panel-${row.chronologicalIndex}`"
                class="career-panel"
                role="region"
                :aria-labelledby="`career-track-${row.chronologicalIndex}`"
                :aria-hidden="isDetailVisible(index) ? undefined : 'true'"
                :inert="!isDetailVisible(index)"
              >
                <div class="panel-clip">
                  <div class="panel-body">
                    <div class="panel-meta">
                      <p class="panel-period">
                        <time :datetime="toIsoMonth(row.entry.startLabel)">{{ row.entry.startLabel }}</time>
                        <span aria-hidden="true">↓</span>
                        <strong v-if="row.entry.current">NOW</strong>
                        <time v-else :datetime="toIsoMonth(row.entry.endLabel)">{{ row.entry.endLabel }}</time>
                      </p>
                      <p v-if="!row.entry.current" class="panel-since">距今 {{ row.entry.sinceLabel }}</p>
                    </div>

                    <ul v-if="row.tags.length" class="panel-tags">
                      <li v-for="tag in row.tags" :key="tag">{{ tag }}</li>
                    </ul>

                    <ul class="panel-highlights">
                      <li
                        v-for="(highlight, itemIndex) in row.entry.highlights"
                        :key="highlight"
                        :style="{ '--item-index': itemIndex }"
                      >{{ highlight }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </li>
          </ol>
        </div>
      </div>

      <p v-else class="career-empty">暂无工作经历。</p>
    </div>
  </section>
</template>

<style scoped>
.career-content {
  --label-col: clamp(184px, 21vw, 282px);
  --gutter: clamp(12px, 1.3vw, 18px);
  --plot-pad: 0px;
  --bar-min: 12px;
  --career-ease: cubic-bezier(0.2, 0.72, 0.2, 1);
  --hairline: rgba(232, 239, 240, 0.1);
  /* The chart is the whole section, so it claims the full height the flex row offers instead of
     sitting centred in it. `1fr` still falls back to the content height, which lets a long history
     overflow into the scroll the global `.section-content` cap already provides. */
  display: grid;
  grid-template-rows: 1fr;
  align-self: center;
  width: min(1240px, 92vw);
  margin: 0 auto;
}

/* One or two roles cannot fill a screen honestly: stretching them would float a 24px bar in the
   middle of a 500px row. From three roles up the always-open panels give the canvas enough to say,
   so it takes the full height; below that it keeps its natural height and the section centres it. */
.career-content:has(.career-tracks > :nth-child(3)) {
  align-self: stretch;
}

/* Every band below shares one column template, so bars, gaps and panel metadata all land on the
   same time axis without a second measurement pass. */
.career-chart {
  display: grid;
  grid-template-rows: auto 1fr;
  padding-right: clamp(8px, 1vw, 18px);
}

.career-axis {
  display: grid;
  grid-template-columns: var(--label-col) minmax(0, 1fr);
  align-items: end;
  margin-bottom: 4px;
  padding: 0 var(--plot-pad);
}

.axis-caption {
  padding-right: var(--gutter);
  color: var(--steel);
  font-family: Consolas, monospace;
  font-size: 9px;
  letter-spacing: 0.08em;
  text-align: right;
}

.axis-scale {
  position: relative;
  height: 17px;
}

.axis-tick {
  position: absolute;
  bottom: 0;
  left: var(--tick-at);
  width: 1px;
  height: 5px;
  background: rgba(232, 239, 240, 0.26);
}

.axis-tick i {
  position: absolute;
  bottom: 7px;
  left: 0;
  color: var(--steel);
  font-family: Consolas, monospace;
  font-size: 9px;
  font-style: normal;
  transform: translateX(-50%);
}

.axis-tick:not(.is-labelled) i {
  display: none;
}

.axis-tick:first-of-type i {
  transform: none;
}

.axis-tick:last-of-type i {
  transform: translateX(-100%);
}

.career-plot {
  position: relative;
  display: grid;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 5px;
  background: linear-gradient(180deg, rgba(50, 214, 197, 0.05), rgba(7, 16, 20, 0.5) 34%, rgba(13, 25, 29, 0.62));
}

/* Every band pads by `--plot-pad` and offsets by `--label-col`, so bars, gap markers and gridlines
   keep one shared plot origin at every breakpoint. */
.career-gridlines {
  position: absolute;
  top: 0;
  right: var(--plot-pad);
  bottom: 0;
  left: calc(var(--label-col) + var(--plot-pad));
  pointer-events: none;
}

.career-gridlines i {
  position: absolute;
  top: 0;
  bottom: 0;
  left: var(--tick-at);
  width: 1px;
  background: rgba(232, 239, 240, 0.045);
}

.career-gridlines i.is-labelled {
  background: rgba(232, 239, 240, 0.085);
}

.gridline-now {
  position: absolute;
  top: 0;
  bottom: 0;
  left: var(--tick-at);
  width: 1px;
  background: linear-gradient(180deg, rgba(255, 107, 95, 0.1), rgba(255, 107, 95, 0.7) 26%, rgba(255, 107, 95, 0.16));
}

.gridline-now em {
  position: absolute;
  right: 6px;
  bottom: 4px;
  color: var(--coral);
  font-family: Consolas, monospace;
  font-size: 8px;
  font-style: normal;
  letter-spacing: 0.12em;
}

/* Rows spread the plot's spare height between themselves, so three roles breathe and ten still fit.
   They never shrink, which keeps the plot's own height content-driven and safe from its `overflow`. */
.career-tracks {
  position: relative;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.career-row {
  position: relative;
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
  transition: background 280ms ease, box-shadow 280ms ease;
}

.career-row + .career-row {
  border-top: 1px solid var(--hairline);
}

.career-row:not(.is-open):hover {
  background: rgba(232, 239, 240, 0.028);
}

.career-row.is-open {
  background: linear-gradient(90deg, rgba(50, 214, 197, 0.1), rgba(50, 214, 197, 0.03) 46%, transparent);
  box-shadow: inset 2px 0 0 var(--lime);
}

.career-track {
  display: grid;
  flex: 1 0 auto;
  grid-template-columns: var(--label-col) minmax(0, 1fr);
  align-items: center;
  width: 100%;
  min-height: clamp(50px, 7.2vh, 64px);
  padding: 8px var(--plot-pad);
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.career-track:focus-visible {
  outline-offset: -3px;
}

.career-row.is-open .career-track {
  cursor: default;
}

.track-label {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: baseline;
  min-width: 0;
  padding-right: var(--gutter);
}

.track-name {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.name-company {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  color: var(--mist-muted);
  font-size: clamp(14px, 1.26vw, 19px);
  font-weight: 620;
  line-height: 1.24;
  transition: color 220ms ease;
}

.career-track:hover .name-company,
.career-row.is-open .name-company {
  color: var(--mist);
}

.company-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.company-flag {
  flex: none;
  padding: 1px 5px;
  border: 1px solid rgba(216, 242, 74, 0.45);
  border-radius: 2px;
  color: var(--lime);
  font-family: Consolas, monospace;
  font-size: 8px;
  font-weight: 500;
  letter-spacing: 0.1em;
}

.name-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.meta-role {
  overflow: hidden;
  color: var(--steel);
  font-size: clamp(11px, 0.86vw, 13px);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.meta-span {
  flex: none;
  color: var(--teal);
  font-family: Consolas, monospace;
  font-size: 10px;
}

.meta-span::before {
  margin-right: 7px;
  color: var(--steel);
  content: "·";
}

.track-lane {
  position: relative;
  height: clamp(19px, 2.6vh, 25px);
  min-width: 0;
}

/* Score mode has the height to spare, so the bars carry more weight in the composition. */
.career-tracks:not(.is-folded) .track-lane {
  height: clamp(22px, 3.2vh, 32px);
}

/* `min()`/`max()` keep a one-month role visible without ever pushing the bar past the axis end. */
.track-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  left: min(var(--bar-start), calc(100% - var(--bar-min)));
  width: max(var(--bar-span), var(--bar-min));
  border-radius: 3px;
  background: linear-gradient(150deg, rgba(50, 214, 197, 0.88), rgba(50, 214, 197, 0.4));
  box-shadow: inset 0 1px 0 rgba(232, 239, 240, 0.24);
  clip-path: inset(0 100% 0 0 round 3px);
  transition-property: clip-path, opacity, box-shadow, background;
  transition-duration: 760ms, 240ms, 240ms, 240ms;
  transition-timing-function: var(--career-ease), ease, ease, ease;
  transition-delay: calc(var(--row-index, 0) * 80ms), 0s, 0s, 0s;
}

.route-section.is-visible .track-bar {
  clip-path: inset(0 0 0 0 round 3px);
}

.career-row:not(.is-open) .track-bar {
  opacity: 0.6;
}

.career-track:hover .track-bar {
  opacity: 1;
}

.career-row.is-current .track-bar {
  background: linear-gradient(120deg, rgba(50, 214, 197, 0.9), rgba(216, 242, 74, 0.8));
}

.career-row.is-open .track-bar {
  box-shadow:
    inset 0 1px 0 rgba(232, 239, 240, 0.4),
    0 0 24px rgba(50, 214, 197, 0.3);
}

/* Punch-hole marker on the live role, echoing the pulsing status dot in the header. */
.career-row.is-current .track-bar::after {
  position: absolute;
  top: 50%;
  right: 6px;
  width: 5px;
  height: 5px;
  content: "";
  border-radius: 50%;
  background: var(--carbon);
  transform: translateY(-50%);
}

.route-section.active .career-row.is-current .track-bar::after {
  animation: career-pulse 1.9s ease-in-out infinite;
}

/* Score mode leaves every panel open and marks the selection by contrast alone; folded mode is the
   disclosure fallback, where only the open row's panel has a height. */
.career-panel {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 440ms var(--career-ease);
}

.career-tracks.is-folded .career-panel {
  grid-template-rows: 0fr;
}

.career-tracks.is-folded .career-row.is-open .career-panel {
  grid-template-rows: 1fr;
}

/* Clipping the grid item is what lets the `0fr` row actually collapse to zero. */
.panel-clip {
  overflow: hidden;
}

/* Period, tags and duty list share the chart's two columns: the label column already reserves the
   width, so parking the metadata there keeps every panel as short as its longest single column. */
.panel-body {
  display: grid;
  grid-template-columns: var(--label-col) minmax(0, 1fr);
  align-content: start;
  padding: 0 var(--plot-pad) clamp(12px, 1.8vh, 20px);
  transition: opacity 280ms ease;
}

/* Unselected detail recedes rather than disappears — 0.78 keeps `--mist-muted` above 5:1 on the
   plot background, so every role stays readable without competing with the selected one. */
.career-tracks:not(.is-folded) .career-row:not(.is-open) .panel-body {
  opacity: 0.78;
}

.panel-meta {
  display: grid;
  gap: 4px;
  grid-column: 1;
  align-content: start;
  padding-right: var(--gutter);
  text-align: right;
}

.panel-period {
  display: grid;
  grid-auto-flow: column;
  justify-content: end;
  gap: 7px;
  align-items: baseline;
  margin: 0;
  color: var(--mist-muted);
  font-family: Consolas, monospace;
  font-size: 11px;
}

.panel-period span {
  color: var(--coral);
  font-size: 10px;
  /* The period reads left to right, so the downward arrow turns to follow it. */
  transform: rotate(-90deg);
}

.panel-period strong {
  color: var(--lime);
  font-weight: 500;
}

.panel-since {
  margin: 0;
  color: var(--steel);
  font-family: Consolas, monospace;
  font-size: 9px;
}

.panel-highlights {
  display: grid;
  gap: clamp(7px, 1.15vh, 12px);
  grid-column: 2;
  grid-row: 1 / span 2;
  align-content: start;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.panel-highlights li {
  position: relative;
  padding-left: 19px;
  color: var(--mist-muted);
  font-size: clamp(12px, 1.02vw, 15px);
  line-height: 1.62;
  opacity: 0;
  transform: translateX(-8px);
  transition: opacity 320ms ease, transform 340ms var(--career-ease);
}

.career-row.is-open .panel-highlights li {
  opacity: 1;
  transform: none;
  transition-delay: calc(130ms + var(--item-index, 0) * 70ms);
}

/* Score mode has nothing left to open, so the stagger runs once on entry and cascades down the rows
   instead of across a single panel. */
.route-section.is-visible .career-tracks:not(.is-folded) .panel-highlights li {
  opacity: 1;
  transform: none;
  transition-delay: calc(180ms + var(--row-index, 0) * 110ms + var(--item-index, 0) * 60ms);
}

.panel-highlights li::before {
  position: absolute;
  top: 0.62em;
  left: 2px;
  width: 5px;
  height: 5px;
  content: "";
  background: var(--teal);
  box-shadow: 0 0 9px rgba(50, 214, 197, 0.55);
  transform: rotate(45deg);
}

/* Tags read as one metadata line instead of badges: outlined pills competed with the bars for
   attention and sat awkwardly under the right-aligned period, while slash-separated monospace
   continues the type of the period directly above them. */
.panel-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px 0;
  grid-column: 1;
  justify-content: flex-end;
  margin: clamp(7px, 1vh, 11px) 0 0;
  padding: 0 var(--gutter) 0 0;
  list-style: none;
}

.panel-tags li {
  color: var(--mist-muted);
  font-family: Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.02em;
  transition: color 220ms ease;
}

/* The separator travels with its own tag, so a wrapped line never leaves a dangling slash behind. */
.panel-tags li + li::before {
  margin: 0 7px;
  color: var(--steel);
  content: "/";
}

.career-row.is-open .panel-tags li {
  color: var(--teal);
}

/* Row density steps down as the configured history grows, so a long list stays scannable instead of
   pushing most of the chart below the section's scroll cap. */
.career-tracks:has(> :nth-child(7)) .career-track {
  min-height: clamp(44px, 6vh, 54px);
  padding-top: 5px;
  padding-bottom: 5px;
}

/* The company line is the tallest thing in a row, so trimming it is what actually buys the height a
   seven-role history needs to stay inside one screen. */
.career-tracks:has(> :nth-child(7)) .name-company {
  font-size: clamp(13px, 1.06vw, 16px);
}

.career-tracks:has(> :nth-child(10)) .career-track {
  min-height: clamp(40px, 5.2vh, 48px);
  padding-top: 4px;
  padding-bottom: 4px;
}

/* With no roles there is no row to stretch, so the placeholder holds its own canvas height and reads
   as a chart waiting for data rather than a stray line of text. */
.career-empty {
  display: grid;
  align-content: center;
  justify-items: center;
  min-height: clamp(160px, 32vh, 260px);
  margin: 0;
  padding: 26px;
  border: 1px dashed var(--line);
  border-radius: 5px;
  color: var(--steel);
  font-size: 14px;
}

@keyframes career-pulse {
  50% {
    opacity: 0.28;
    transform: translateY(-50%) scale(0.62);
  }
}

@media (max-width: 900px) {
  .career-content {
    --label-col: clamp(152px, 25vw, 208px);
    width: min(880px, 88vw);
  }
}

/* Below this the label column would starve the axis, so labels stack above a full-width lane. */
@media (max-width: 680px) {
  .career-content {
    --label-col: 0px;
    --gutter: 0px;
    --plot-pad: 12px;
    width: 100%;
  }

  .career-axis,
  .career-track,
  .panel-body {
    grid-template-columns: minmax(0, 1fr);
  }

  .career-axis {
    gap: 5px;
  }

  .axis-caption {
    text-align: left;
  }

  .career-track {
    gap: 10px;
    padding-top: 13px;
    padding-bottom: 13px;
  }

  /* One column means the two-column panel placement has to unwind, and the tags read best last. */
  .panel-body {
    row-gap: 12px;
  }

  .panel-meta,
  .panel-tags,
  .panel-highlights {
    grid-column: 1;
    grid-row: auto;
  }

  .panel-meta {
    grid-auto-flow: column;
    justify-content: start;
    gap: 12px;
    align-items: baseline;
    text-align: left;
  }

  .panel-period {
    justify-content: start;
  }

  .panel-tags {
    justify-content: flex-start;
    order: 1;
    margin-top: 0;
    padding-right: 0;
  }
}

@media (max-height: 560px) and (min-width: 681px) {
  /* The route section trims its own padding in landscape, so reclaim the height the global cap
     leaves unused; 100px is this section's own 82px + 18px padding. */
  .route-section > .section-content.career-content {
    max-height: calc(100svh - 100px);
  }

  .career-track {
    min-height: 44px;
    padding: 5px 0;
  }

  .panel-highlights li {
    font-size: 11px;
    line-height: 1.45;
  }
}

/* The global reduce sweep zeroes durations but leaves delays intact, so the staggered reveals would
   still trickle in one by one. Drop the delays and the decorative pulse outright. */
@media (prefers-reduced-motion: reduce) {
  .track-bar,
  .career-row.is-open .panel-highlights li,
  .route-section.is-visible .career-tracks:not(.is-folded) .panel-highlights li {
    transition-delay: 0s;
  }

  .route-section.active .career-row.is-current .track-bar::after {
    animation: none;
  }
}
</style>
