<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { buildCareerTimeline, formatMonthOffset } from '../utils/timeline'
import { getHorizontalSwipeDirection } from '../utils/swipe'
import { clampOffset, findNearestStopIndex, projectScrubOffset } from '../utils/scrub'
import { useDragScrub } from '../composables/useDragScrub'

const props = defineProps({
  active: { type: Boolean, default: false },
  visible: { type: Boolean, default: false },
  experience: { type: Array, required: true },
})

const emit = defineEmits(['focus-change'])

const careerTimeline = computed(() => buildCareerTimeline(props.experience))

const getInitialIndex = (entries) => {
  const currentIndex = entries.findIndex((item) => item.current)
  return currentIndex >= 0 ? currentIndex : Math.max(0, entries.length - 1)
}

const viewportRef = ref(null)
const trackRef = ref(null)
const selectedIndex = ref(getInitialIndex(careerTimeline.value.entries))
const headOverride = ref(null)
const dragPixels = ref(0)
const monthWidth = ref(0)
const viewportWidth = ref(0)
const cardTouchStart = ref(null)

let clickSuppressed = false
let sizeObserver

const entries = computed(() => careerTimeline.value.entries)
const axisMonthCount = computed(() => careerTimeline.value.axisMonthCount)
const stopOffsets = computed(() => entries.value.map((item) => item.focusMonthOffset))

const selectedEntry = computed(() => (
  entries.value[selectedIndex.value] ?? entries.value[entries.value.length - 1] ?? null
))

/** Year ticks carry percentages for the overview strip, so derive their month offsets for the river. */
const riverYears = computed(() => careerTimeline.value.ticks.map((tick) => ({
  ...tick,
  monthOffset: Math.round((tick.position / 100) * axisMonthCount.value),
})))

const baseHead = computed(() => headOverride.value ?? selectedEntry.value?.focusMonthOffset ?? 0)

const dragMonths = computed(() => (monthWidth.value > 0 ? dragPixels.value / monthWidth.value : 0))

const displayHead = computed(() => clampOffset(baseHead.value - dragMonths.value, 0, axisMonthCount.value))

const readingLabel = computed(() => formatMonthOffset(careerTimeline.value.axisStartYear, displayHead.value))

const visibleMonths = computed(() => (monthWidth.value > 0 ? viewportWidth.value / monthWidth.value : 0))

const trackStyle = computed(() => ({
  '--river-total': axisMonthCount.value,
  '--river-focus': displayHead.value,
}))

/** The overview window is the visible river slice intersected with the axis, so it never overhangs. */
const overviewStyle = computed(() => {
  const total = Math.max(1, axisMonthCount.value)
  const halfSpan = (visibleMonths.value / total) * 50
  const center = (displayHead.value / total) * 100
  const start = clampOffset(center - halfSpan, 0, 100)
  const end = clampOffset(center + halfSpan, 0, 100)

  return {
    '--window-start': `${start}%`,
    '--window-span': `${end - start}%`,
  }
})

const measure = () => {
  const trackWidth = trackRef.value?.getBoundingClientRect().width ?? 0
  monthWidth.value = axisMonthCount.value > 0 ? trackWidth / axisMonthCount.value : 0
  viewportWidth.value = viewportRef.value?.getBoundingClientRect().width ?? 0
}

const selectEntry = (index) => {
  const lastIndex = entries.value.length - 1
  headOverride.value = null
  if (lastIndex < 0) {
    selectedIndex.value = 0
    return
  }
  selectedIndex.value = Math.min(lastIndex, Math.max(0, index))
}

const moveSelection = (direction) => {
  selectEntry(selectedIndex.value + direction)
}

/** Nudges the reading head one month and re-snaps the selection, so the keyboard can scrub too. */
const nudgeHead = (direction) => {
  headOverride.value = clampOffset(displayHead.value + direction, 0, axisMonthCount.value)
  const nearestIndex = findNearestStopIndex(headOverride.value, stopOffsets.value)
  if (nearestIndex >= 0) selectedIndex.value = nearestIndex
}

const handleKeydown = (event) => {
  const keyActions = {
    ArrowLeft: () => (event.shiftKey ? nudgeHead(-1) : moveSelection(-1)),
    ArrowRight: () => (event.shiftKey ? nudgeHead(1) : moveSelection(1)),
    Home: () => selectEntry(0),
    End: () => selectEntry(entries.value.length - 1),
  }

  const action = keyActions[event.key]
  if (!action) return

  event.preventDefault()
  action()
}

const handleReachClick = (index) => {
  if (clickSuppressed) return
  selectEntry(index)
}

const handleOverviewClick = (event) => {
  const rect = event.currentTarget.getBoundingClientRect()
  if (!rect.width) return

  const offset = ((event.clientX - rect.left) / rect.width) * axisMonthCount.value
  const nearestIndex = findNearestStopIndex(offset, stopOffsets.value)
  if (nearestIndex >= 0) selectEntry(nearestIndex)
}

const handleCardTouchStart = (event) => {
  const touch = event.touches[0]
  cardTouchStart.value = touch ? { x: touch.clientX, y: touch.clientY } : null
}

const handleCardTouchEnd = (event) => {
  if (!cardTouchStart.value) return

  const touch = event.changedTouches[0]
  const endPoint = touch ? { x: touch.clientX, y: touch.clientY } : null
  const direction = getHorizontalSwipeDirection(cardTouchStart.value, endPoint)
  cardTouchStart.value = null

  if (direction) moveSelection(direction)
}

const { dragging } = useDragScrub(viewportRef, {
  onDrag: (deltaPixels) => {
    dragPixels.value = deltaPixels
  },
  onRelease: ({ deltaPixels, velocityPixelsPerSecond }) => {
    const width = monthWidth.value
    const releasedHead = clampOffset(baseHead.value - (width > 0 ? deltaPixels / width : 0), 0, axisMonthCount.value)
    const velocityMonths = width > 0 ? -velocityPixelsPerSecond / width : 0
    const projected = projectScrubOffset(releasedHead, velocityMonths)
    const nearestIndex = findNearestStopIndex(projected, stopOffsets.value)

    dragPixels.value = 0
    clickSuppressed = true
    if (nearestIndex >= 0) selectEntry(nearestIndex)
  },
})

/** A drag that ends on a reach must not also activate it; the next press clears the guard. */
const handlePointerDown = () => {
  clickSuppressed = false
}

watch([trackRef, viewportRef], () => {
  sizeObserver?.disconnect()
  if (!trackRef.value && !viewportRef.value) return

  sizeObserver = new ResizeObserver(measure)
  if (trackRef.value) sizeObserver.observe(trackRef.value)
  if (viewportRef.value) sizeObserver.observe(viewportRef.value)
  measure()
}, { immediate: true, flush: 'post' })

watch(
  () => entries.value.length,
  (length) => {
    headOverride.value = null
    selectedIndex.value = Math.min(selectedIndex.value, Math.max(0, length - 1))
  },
)

watch(
  [displayHead, selectedIndex],
  ([head, index]) => {
    emit('focus-change', {
      progress: axisMonthCount.value > 0 ? head / axisMonthCount.value : 0,
      index,
    })
  },
  { immediate: true },
)

onUnmounted(() => {
  sizeObserver?.disconnect()
})
</script>

<template>
  <section id="route" class="scene-section route-section" :class="{ 'is-visible': visible, active }" aria-labelledby="route-title">
    <div class="section-content career-content">
      <h2 id="route-title" class="sr-only">工作经验</h2>

      <div
        v-if="selectedEntry"
        class="time-river"
        :class="{ 'is-dragging': dragging }"
        tabindex="0"
        role="group"
        aria-roledescription="时间河流"
        :aria-label="`第 ${selectedIndex + 1} 段，共 ${entries.length} 段工作经历，左右方向键穿越时间，按住 Shift 逐月擦洗`"
        @keydown="handleKeydown"
      >
        <div ref="viewportRef" class="river-viewport" @pointerdown="handlePointerDown">
          <div class="river-current" aria-hidden="true"></div>

          <div ref="trackRef" class="river-track" :style="trackStyle">
            <span
              v-for="year in riverYears"
              :key="`year-${year.label}`"
              class="river-year"
              :style="{ '--river-at': year.monthOffset }"
              aria-hidden="true"
            >{{ year.label }}</span>

            <span
              v-for="gap in careerTimeline.gaps"
              :key="gap.key"
              class="river-shallow"
              :style="{ '--river-at': gap.startMonthOffset, '--river-span': gap.months }"
              aria-hidden="true"
            >
              <i>空档 {{ gap.label }}</i>
            </span>

            <button
              v-for="(item, index) in entries"
              :key="`${item.company}-${item.period}`"
              type="button"
              class="river-reach"
              :class="{ selected: index === selectedIndex, current: item.current }"
              :style="{ '--river-at': item.startMonthOffset, '--river-span': item.durationMonths }"
              :aria-label="`第 ${item.sequence} 段，${item.company}，${item.period}，${item.durationLabel}`"
              :aria-pressed="index === selectedIndex"
              :title="`${item.company} · ${item.period} · ${item.durationLabel}`"
              @click="handleReachClick(index)"
            >
              <b>{{ item.company }}</b>
              <i>{{ item.durationLabel }}</i>
            </button>

            <span
              class="river-now"
              :style="{ '--river-at': careerTimeline.nowMonthOffset }"
              aria-hidden="true"
            >NOW</span>
          </div>

          <div class="river-reticle" aria-hidden="true">
            <span>{{ readingLabel }}</span>
          </div>

          <div class="river-fog" aria-hidden="true"></div>
        </div>

        <dl class="river-readout" aria-live="polite">
          <div>
            <dt>已持续</dt>
            <dd>{{ selectedEntry.durationLabel }}</dd>
          </div>
          <div>
            <dt>距今</dt>
            <dd>{{ selectedEntry.sinceLabel }}</dd>
          </div>
          <div>
            <dt>空档期</dt>
            <dd>{{ careerTimeline.gapLabel }}<small v-if="careerTimeline.gaps.length"> · {{ careerTimeline.gaps.length }} 段</small></dd>
          </div>
          <div>
            <dt>职业跨度</dt>
            <dd>{{ careerTimeline.careerSpanLabel }}<small> · 在职 {{ careerTimeline.totalDurationLabel }}</small></dd>
          </div>
        </dl>

        <Transition name="river-record" mode="out-in">
          <article
            :key="`${selectedEntry.company}-${selectedEntry.period}`"
            class="river-record"
            @touchstart.passive="handleCardTouchStart"
            @touchend.passive="handleCardTouchEnd"
            @touchcancel="cardTouchStart = null"
          >
            <div class="river-record-heading">
              <h3>{{ selectedEntry.company }}</h3>
              <div class="river-record-meta">
                <div class="river-period">
                  <time :datetime="selectedEntry.startLabel.replace('.', '-')">{{ selectedEntry.startLabel }}</time>
                  <span aria-hidden="true">→</span>
                  <strong>{{ selectedEntry.endLabel }}</strong>
                </div>
                <strong v-if="selectedEntry.current">CURRENT</strong>
              </div>
              <p>{{ selectedEntry.signal }}</p>
            </div>

            <section class="river-responsibility" :aria-labelledby="`career-role-${selectedEntry.sequence}`">
              <h4 :id="`career-role-${selectedEntry.sequence}`">{{ selectedEntry.role }}</h4>
              <ul>
                <li v-for="highlight in selectedEntry.highlights" :key="highlight">{{ highlight }}</li>
              </ul>
            </section>
          </article>
        </Transition>

        <div class="river-overview" aria-hidden="true">
          <div class="river-overview-meta">
            <span>{{ careerTimeline.startLabel }} → NOW</span>
            <strong>{{ entries.length }} COMPANIES</strong>
          </div>

          <div class="river-overview-axis" :style="overviewStyle" @click="handleOverviewClick">
            <span
              v-for="tick in careerTimeline.ticks"
              :key="`overview-${tick.label}`"
              class="river-overview-year"
              :style="{ '--tick-position': `${tick.position}%` }"
            >{{ tick.label }}</span>

            <span
              v-for="gap in careerTimeline.gaps"
              :key="`overview-${gap.key}`"
              class="river-overview-gap"
              :style="{ '--career-start': `${gap.startPercent}%`, '--career-span': `${gap.spanPercent}%` }"
            ></span>

            <span
              v-for="(item, index) in entries"
              :key="`overview-${item.company}-${item.period}`"
              class="river-overview-reach"
              :class="{ selected: index === selectedIndex, current: item.current }"
              :style="{ '--career-start': `${item.startPercent}%`, '--career-span': `${item.spanPercent}%` }"
            ><i>{{ item.sequence }}</i></span>

            <span class="river-overview-window"></span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.career-content {
  width: min(1320px, 92vw);
  margin: 0 auto;
}

.time-river {
  --river-month: clamp(15px, 1.9vw, 26px);
  --river-travel: var(--motion-travel);
  --river-ease: cubic-bezier(0.2, 0.72, 0.2, 1);
  position: relative;
  display: grid;
  gap: clamp(14px, 2.2vh, 24px);
  /* The record card slides in horizontally; `clip` (not `hidden`) keeps that bleed out of the
     scrolling host without turning this grid into a scroll container. */
  overflow-x: clip;
  outline: none;
}

/* Inset ring: the viewport spans the full content width, so an outward offset would be clipped. */
.time-river:focus-visible .river-viewport {
  outline: 1px solid var(--lime);
  outline-offset: -3px;
}

/* Only this layer clips, so the oversized track can never scroll the page sideways. */
.river-viewport {
  position: relative;
  height: clamp(158px, 25vh, 216px);
  overflow: hidden;
  border-top: 1px solid rgba(232, 239, 240, 0.22);
  border-bottom: 1px solid rgba(232, 239, 240, 0.22);
  background:
    linear-gradient(180deg, rgba(50, 214, 197, 0.05), rgba(7, 16, 20, 0.62) 62%),
    rgba(7, 16, 20, 0.54);
  cursor: grab;
  user-select: none;
  touch-action: pan-y;
}

.time-river.is-dragging .river-viewport {
  cursor: grabbing;
}

/* Water surface: a lime highlight sweeping downstream, echoing the road pulse in the 3D scene. */
.river-current {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.5;
  background-image:
    linear-gradient(90deg, transparent 0 42%, rgba(216, 242, 74, 0.16) 50%, transparent 58% 100%),
    repeating-linear-gradient(90deg, rgba(232, 239, 240, 0.08) 0 1px, transparent 1px calc(var(--river-month) * 7)),
    linear-gradient(180deg, transparent 58%, rgba(50, 214, 197, 0.1));
  background-size: 220% 100%, auto, auto;
  background-position: -60% 0, 0 0, 0 0;
}

.route-section.active .river-current {
  animation: river-flow 9s linear infinite;
}

.river-track {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: calc(var(--river-month) * var(--river-total));
  transform: translateX(calc(var(--river-month) * var(--river-focus) * -1));
  transition: transform var(--river-travel) var(--river-ease);
}

.time-river.is-dragging .river-track {
  transition: none;
}

.river-track::before {
  position: absolute;
  right: 0;
  bottom: 30%;
  left: 0;
  height: 1px;
  content: "";
  background-image: linear-gradient(90deg, rgba(50, 214, 197, 0.5) 0 calc(var(--river-month) * 2), transparent calc(var(--river-month) * 2) calc(var(--river-month) * 7));
  background-size: calc(var(--river-month) * 7) 100%;
}

.river-year {
  position: absolute;
  top: 8px;
  left: calc(var(--river-month) * var(--river-at));
  padding-left: 5px;
  border-left: 1px solid rgba(232, 239, 240, 0.2);
  color: rgba(232, 239, 240, 0.5);
  font-family: Consolas, monospace;
  font-size: 10px;
  line-height: 1.6;
}

.river-shallow {
  position: absolute;
  top: 46%;
  left: calc(var(--river-month) * var(--river-at));
  display: flex;
  width: calc(var(--river-month) * var(--river-span));
  height: 9px;
  align-items: center;
  justify-content: center;
  border-top: 1px dashed rgba(101, 113, 124, 0.85);
  border-bottom: 1px dashed rgba(101, 113, 124, 0.85);
  background: repeating-linear-gradient(135deg, rgba(101, 113, 124, 0.26) 0 3px, transparent 3px 7px);
}

.river-shallow i {
  position: absolute;
  top: 13px;
  color: var(--steel);
  font-family: Consolas, monospace;
  font-size: 8px;
  font-style: normal;
  white-space: nowrap;
}

.river-reach {
  position: absolute;
  top: 34%;
  left: calc(var(--river-month) * var(--river-at));
  display: flex;
  width: calc(var(--river-month) * var(--river-span));
  min-width: 26px;
  height: 46px;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  padding: 0 8px;
  overflow: hidden;
  border: 1px solid rgba(50, 214, 197, 0.5);
  border-radius: 3px;
  color: var(--mist-muted);
  text-align: left;
  background: linear-gradient(180deg, rgba(50, 214, 197, 0.16), rgba(50, 214, 197, 0.05));
  cursor: pointer;
  transition: border-color 220ms ease, background 220ms ease, box-shadow 220ms ease, color 220ms ease;
}

.river-reach b {
  overflow: hidden;
  font-size: clamp(11px, 1vw, 14px);
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.river-reach i {
  color: var(--steel);
  font-family: Consolas, monospace;
  font-size: 9px;
  font-style: normal;
  white-space: nowrap;
}

.river-reach.current {
  border-color: rgba(216, 242, 74, 0.6);
}

.river-reach:hover,
.river-reach.selected {
  color: var(--mist);
  border-color: var(--lime);
  background: linear-gradient(180deg, rgba(50, 214, 197, 0.28), rgba(216, 242, 74, 0.16));
  box-shadow: 0 0 22px rgba(50, 214, 197, 0.22);
}

.river-reach.selected i {
  color: var(--lime);
}

.river-now {
  position: absolute;
  top: 26px;
  bottom: 0;
  left: calc(var(--river-month) * var(--river-at));
  width: 1px;
  padding-left: 5px;
  color: var(--lime);
  font-family: Consolas, monospace;
  font-size: 8px;
  background: var(--lime);
  box-shadow: 0 0 12px rgba(216, 242, 74, 0.7);
}

/* Fixed reading head: the selected reach always travels under this line. */
.river-reticle {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  pointer-events: none;
  background: linear-gradient(180deg, transparent, var(--coral) 18%, var(--coral) 82%, transparent);
  box-shadow: 0 0 16px rgba(255, 107, 95, 0.55);
}

.river-reticle span {
  position: absolute;
  bottom: 6px;
  left: 50%;
  padding: 2px 7px;
  border: 1px solid rgba(255, 107, 95, 0.55);
  color: var(--mist);
  background: rgba(7, 16, 20, 0.9);
  font-family: Consolas, monospace;
  font-size: 9px;
  white-space: nowrap;
  transform: translateX(-50%);
}

.river-fog {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(90deg, var(--carbon), rgba(7, 16, 20, 0) 16%, rgba(7, 16, 20, 0) 84%, var(--carbon));
}

.river-readout {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px clamp(14px, 2vw, 30px);
  margin: 0;
}

.river-readout div {
  display: grid;
  gap: 4px;
  padding-left: 10px;
  border-left: 1px solid var(--line);
}

.river-readout dt {
  color: var(--steel);
  font-family: Consolas, monospace;
  font-size: 9px;
  letter-spacing: 0.08em;
}

.river-readout dd {
  margin: 0;
  color: var(--mist);
  font-size: clamp(14px, 1.3vw, 19px);
  font-weight: 600;
}

.river-readout small {
  color: var(--steel);
  font-family: Consolas, monospace;
  font-size: 9px;
  font-weight: 400;
}

.river-record {
  display: grid;
  grid-template-columns: minmax(240px, 0.8fr) minmax(0, 1.2fr);
  gap: clamp(24px, 4vw, 62px);
  align-items: center;
  min-width: 0;
  transition: opacity 220ms ease, filter 220ms ease;
}

.time-river.is-dragging .river-record {
  opacity: 0.45;
  filter: saturate(0.5);
}

.river-record-heading {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
}

.river-record-heading h3 {
  max-width: 560px;
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--mist);
  font-size: clamp(26px, 3vw, 44px);
  font-weight: 650;
  line-height: 1.1;
}

.river-record-meta,
.river-period {
  display: flex;
  align-items: center;
  font-family: Consolas, monospace;
}

.river-record-meta {
  gap: 12px;
  margin-top: 14px;
  font-size: 9px;
}

.river-record-meta > strong {
  padding-left: 10px;
  border-left: 1px solid var(--line);
  color: var(--lime);
  font-weight: 500;
}

.river-period {
  gap: 10px;
  color: var(--steel);
  font-size: 11px;
}

.river-period strong {
  color: var(--mist);
  font-weight: 500;
}

.river-period span {
  color: var(--coral);
}

.river-record-heading > p {
  margin: 12px 0 0;
  color: var(--steel);
  font-size: clamp(12px, 1vw, 15px);
}

.river-responsibility {
  min-width: 0;
  padding: clamp(18px, 2.8vh, 32px) clamp(20px, 2.6vw, 38px);
  border: 1px solid var(--line);
  border-radius: 5px;
  background: rgba(13, 25, 29, 0.74);
  box-shadow: inset 3px 0 0 rgba(50, 214, 197, 0.6);
}

.river-responsibility h4 {
  margin: 0 0 clamp(12px, 2vh, 22px);
  color: var(--mist);
  font-size: clamp(17px, 1.5vw, 22px);
  font-weight: 600;
}

.river-responsibility ul {
  display: grid;
  gap: clamp(10px, 1.6vh, 18px);
  margin: 0;
  padding: 0;
  list-style: none;
}

.river-responsibility li {
  position: relative;
  padding-left: 20px;
  color: var(--mist-muted);
  font-size: clamp(12px, 1.05vw, 16px);
  line-height: 1.6;
}

.river-responsibility li::before {
  position: absolute;
  top: 0.66em;
  left: 0;
  width: 6px;
  height: 6px;
  content: "";
  border-radius: 50%;
  background: var(--teal);
  box-shadow: 0 0 10px rgba(50, 214, 197, 0.55);
}

.river-record-enter-active,
.river-record-leave-active {
  transition: opacity 180ms ease, transform 360ms var(--river-ease);
}

.river-record-enter-from {
  opacity: 0;
  transform: translateX(28px);
}

.river-record-leave-to {
  opacity: 0;
  transform: translateX(-22px);
}

.river-overview {
  display: grid;
  gap: 6px;
}

.river-overview-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--steel);
  font-family: Consolas, monospace;
  font-size: 9px;
}

.river-overview-meta strong {
  color: var(--teal);
  font-weight: 500;
}

.river-overview-axis {
  position: relative;
  height: 34px;
  margin-right: 10px;
  border-top: 1px solid var(--line);
  cursor: pointer;
}

.river-overview-year {
  position: absolute;
  top: 3px;
  left: var(--tick-position);
  color: var(--steel);
  font-family: Consolas, monospace;
  font-size: 8px;
  transform: translateX(-50%);
}

.river-overview-year:first-of-type {
  transform: none;
}

.river-overview-gap,
.river-overview-reach {
  position: absolute;
  top: 19px;
  left: var(--career-start);
  width: var(--career-span);
  height: 10px;
}

.river-overview-gap {
  top: 22px;
  height: 4px;
  background: repeating-linear-gradient(135deg, rgba(101, 113, 124, 0.5) 0 2px, transparent 2px 5px);
}

.river-overview-reach {
  min-width: 14px;
  border: 1px solid rgba(50, 214, 197, 0.5);
  border-radius: 2px;
  background: rgba(50, 214, 197, 0.2);
  transition: border-color 180ms ease, background 180ms ease;
}

.river-overview-reach i {
  position: absolute;
  top: 11px;
  left: 0;
  color: var(--steel);
  font-family: Consolas, monospace;
  font-size: 8px;
  font-style: normal;
}

.river-overview-reach.current {
  border-color: rgba(216, 242, 74, 0.6);
}

.river-overview-reach.selected {
  border-color: var(--lime);
  background: rgba(216, 242, 74, 0.34);
}

.river-overview-reach.selected i {
  color: var(--lime);
}

/* Mirrors how much of the axis the river viewport currently shows. */
.river-overview-window {
  position: absolute;
  top: 14px;
  left: var(--window-start);
  width: var(--window-span);
  height: 20px;
  border: 1px solid rgba(255, 107, 95, 0.5);
  border-radius: 2px;
  background: rgba(255, 107, 95, 0.08);
  transition: left var(--river-travel) var(--river-ease), width var(--river-travel) var(--river-ease);
}

.time-river.is-dragging .river-overview-window {
  transition: none;
}

@keyframes river-flow {
  from {
    background-position: -60% 0, 0 0, 0 0;
  }

  to {
    background-position: 160% 0, calc(var(--river-month) * -7) 0, 0 0;
  }
}

@media (max-width: 900px) {
  .career-content {
    width: min(820px, 84vw);
  }

  .time-river {
    --river-month: clamp(13px, 3vw, 20px);
  }

  .river-record {
    grid-template-columns: minmax(210px, 0.8fr) minmax(0, 1.2fr);
    gap: 26px;
  }
}

@media (max-width: 680px) {
  .career-content {
    width: 100%;
  }

  .time-river {
    --river-month: clamp(10px, 3.4vw, 14px);
    gap: 12px;
  }

  .river-viewport {
    height: clamp(140px, 22vh, 172px);
  }

  .river-readout {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .river-readout dd {
    font-size: 13px;
  }

  .river-record {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .river-record-heading h3 {
    font-size: clamp(23px, 7vw, 30px);
  }

  .river-responsibility {
    padding: 14px 16px;
  }

  .river-overview-year:nth-of-type(even) {
    display: none;
  }
}

@media (max-height: 560px) and (min-width: 681px) {
  /* The route section trims its own padding in landscape, so reclaim the height the global cap
     leaves unused; 100px is this section's own 82px + 18px padding. */
  .route-section > .section-content.career-content {
    max-height: calc(100svh - 100px);
  }

  .time-river {
    gap: 8px;
  }

  .river-viewport {
    height: 128px;
  }

  .river-readout {
    gap: 6px 18px;
  }

  .river-readout dd {
    font-size: 13px;
  }

  .river-record {
    gap: 24px;
  }

  .river-record-heading h3 {
    font-size: 26px;
  }

  .river-responsibility {
    padding: 12px 18px;
  }

  .river-responsibility h4 {
    margin-bottom: 8px;
    font-size: 14px;
  }

  .river-responsibility ul {
    gap: 6px;
  }

  .river-responsibility li {
    padding-left: 16px;
    font-size: 10px;
    line-height: 1.45;
  }

  .river-overview-axis {
    height: 28px;
  }
}
</style>
