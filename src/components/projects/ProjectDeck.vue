<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import ProjectCard from './ProjectCard.vue'
import { getAccentVar } from '../../utils/projectDeck'

const props = defineProps({
  projects: { type: Array, required: true },
  activeIndex: { type: Number, default: 0 },
  reducedMotion: { type: Boolean, default: false },
  setItemRef: { type: Function, required: true },
})

const emit = defineEmits(['select', 'keydown'])
const viewport = ref(null)
const track = ref(null)
const cards = new Map()
const trackOffset = ref(0)
let resizeObserver

const setCardRef = (index, element) => {
  props.setItemRef(index, element)
  if (element) cards.set(index, element)
  else cards.delete(index)
}

const updateTrackOffset = () => {
  const activeCard = cards.get(props.activeIndex)
  if (!activeCard || !viewport.value) return

  // Keep the first card anchored to the viewport edge. Once the deck moves,
  // center the active card so the neighboring cards get the same reveal on
  // both sides instead of leaving the previous card clipped away.
  const sideSpace = Math.max(0, (viewport.value.clientWidth - activeCard.offsetWidth) / 2)
  const centeredOffset = activeCard.offsetLeft - sideSpace
  trackOffset.value = Math.max(0, props.activeIndex === 0 ? activeCard.offsetLeft : centeredOffset)
}

watch(
  () => props.activeIndex,
  () => nextTick(updateTrackOffset),
  { immediate: true },
)

onMounted(() => {
  resizeObserver = new ResizeObserver(updateTrackOffset)
  if (viewport.value) resizeObserver.observe(viewport.value)
  if (track.value) resizeObserver.observe(track.value)
  nextTick(updateTrackOffset)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div
    ref="viewport"
    class="project-deck"
    tabindex="0"
    aria-label="横向项目经验"
    @keydown="$emit('keydown', $event)"
  >
    <ul
      ref="track"
      class="project-deck__track"
      aria-label="项目列表"
      aria-roledescription="横向项目轨道"
      :style="{ transform: `translate3d(${-trackOffset}px, 0, 0)` }"
    >
      <li
        v-for="(project, index) in projects"
        :key="project.id"
        :ref="(element) => setCardRef(index, element)"
        class="project-deck__card"
        :class="{
          'is-active': index === activeIndex,
          'is-before': index < activeIndex,
          'is-after': index > activeIndex,
        }"
        :style="{ '--project-accent': getAccentVar(project.accent) }"
        :aria-current="index === activeIndex ? 'true' : undefined"
        :aria-hidden="index === activeIndex ? 'false' : 'true'"
        :tabindex="index === activeIndex ? 0 : -1"
        @click="emit('select', index)"
      >
        <ProjectCard :project="project" :active="index === activeIndex" />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.project-deck {
  position: relative;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  outline: none;
  touch-action: pan-y;
}

.project-deck:focus-visible {
  outline: 1px solid var(--lime);
  outline-offset: 7px;
}

.project-deck__track {
  display: flex;
  gap: clamp(18px, 2.2vw, 32px);
  width: max-content;
  height: clamp(400px, 55vh, 560px);
  margin: 0;
  padding: 0;
  list-style: none;
  transition: transform 460ms cubic-bezier(0.18, 0.74, 0.18, 1);
  will-change: transform;
}

.project-deck__card {
  flex: 0 0 min(1080px, calc(100vw - var(--edge) * 2 - clamp(72px, 10vw, 160px)));
  min-width: 0;
  opacity: 0.42;
  transform: scale(0.96);
  transform-origin: left center;
  transition: opacity 420ms ease, transform 620ms cubic-bezier(0.2, 0.72, 0.2, 1);
  cursor: pointer;
}

.project-deck__card.is-before {
  transform-origin: right center;
}

.project-deck__card.is-after {
  transform-origin: left center;
}

.project-deck__card.is-active {
  opacity: 1;
  transform: scale(1);
  cursor: default;
}

@media (max-width: 680px) {
  .project-deck__track {
    gap: 14px;
    height: min(66svh, 590px);
  }

  .project-deck__card {
    flex-basis: calc(100vw - var(--edge) * 2 - 30px);
    opacity: 0.28;
    transform: scale(0.97);
  }
}

@media (prefers-reduced-motion: reduce) {
  .project-deck__track,
  .project-deck__card {
    transition-duration: 0.01ms;
  }
}
</style>
