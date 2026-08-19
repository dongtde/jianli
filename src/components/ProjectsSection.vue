<script setup>
import { watch } from 'vue'
import ProjectDeck from './projects/ProjectDeck.vue'
import { useDeckDepth } from '../composables/useDeckDepth'
import { useReducedMotion } from '../composables/useReducedMotion'

const props = defineProps({
  active: { type: Boolean, default: false },
  visible: { type: Boolean, default: false },
  projects: { type: Array, required: true },
  selectedProjectId: { type: String, required: true },
})

const emit = defineEmits(['select-project'])
const { reducedMotion } = useReducedMotion()
const {
  activeIndex,
  select,
  setItemRef,
  handleKeydown,
  handleWheel,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
} = useDeckDepth(() => props.projects.length, 0, reducedMotion)

const selectIndex = (index) => {
  select(index)
}

watch(
  () => props.selectedProjectId,
  (id) => {
    const index = props.projects.findIndex((project) => project.id === id)
    if (index >= 0 && index !== activeIndex.value) select(index)
  },
  { immediate: true },
)

watch(activeIndex, (index) => {
  const project = props.projects[index]
  if (project && project.id !== props.selectedProjectId) emit('select-project', project.id)
})
</script>

<template>
  <section
    id="projects"
    class="scene-section projects-section"
    :class="{ 'is-visible': visible, active }"
    aria-label="项目经验"
    :data-can-next="activeIndex < projects.length - 1"
    :data-can-prev="activeIndex > 0"
    @wheel="handleWheel"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <div class="projects-layout">
      <ProjectDeck
        :projects="projects"
        :active-index="activeIndex"
        :reduced-motion="reducedMotion"
        :set-item-ref="setItemRef"
        @select="selectIndex"
        @keydown="handleKeydown"
      />
    </div>
  </section>
</template>

<style scoped>
.projects-section {
  align-items: center;
  isolation: isolate;
}

.projects-layout {
  position: relative;
  z-index: 1;
  width: min(1240px, 100%);
  margin: 0 auto;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity var(--motion-enter) ease, transform var(--motion-enter) cubic-bezier(0.2, 0.72, 0.2, 1);
}

.projects-section.is-visible.active .projects-layout {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 680px) {
  .projects-layout {
    width: 100%;
  }
}
</style>
