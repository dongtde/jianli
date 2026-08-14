<script setup>
import { computed } from 'vue'
import { Gauge, Map } from 'lucide-vue-next'
import { formatCounter } from '../utils/format'

const props = defineProps({
  active: { type: Boolean, default: false },
  visible: { type: Boolean, default: false },
  projects: { type: Array, required: true },
  selectedProject: { type: Object, required: true },
  selectedProjectId: { type: String, required: true },
  selectedProjectIndex: { type: Number, default: 0 },
  projectSignalProgress: { type: String, default: '0%' },
})

defineEmits(['select-project'])

const projectCountLabel = computed(() => formatCounter(props.selectedProjectIndex + 1, props.projects.length))
const selectedIcon = computed(() => (props.selectedProject.id === 'business' ? Gauge : Map))
</script>

<template>
  <section id="projects" class="scene-section projects-section" :class="{ 'is-visible': visible, active }" aria-labelledby="projects-title">
    <div class="projects-layout">
      <header class="projects-intro">
        <div>
          <p class="eyebrow"><Map :size="15" /> SELECTED PROJECTS</p>
          <h2 id="projects-title">沿一条信号轨道，<br />读取三个项目坐标。</h2>
        </div>
        <p class="projects-lead">每个坐标代表一次复杂系统的前端落地。选择信号点，项目内容与背景空间会同步切换。</p>
      </header>

      <div class="project-rail-shell" :style="{ '--signal-progress': projectSignalProgress }">
        <div class="project-rail-meta">
          <span>PROJECT COORDINATES</span>
          <strong>{{ projectCountLabel }}</strong>
        </div>
        <div class="project-rail" role="group" aria-label="选择代表项目">
          <div class="project-rail-track" aria-hidden="true">
            <span class="project-rail-progress"></span>
            <span class="project-rail-signal"></span>
          </div>
          <button
            v-for="(project, index) in projects"
            :key="project.id"
            type="button"
            class="project-stop"
            :class="{ active: selectedProjectId === project.id, passed: index <= selectedProjectIndex }"
            :aria-pressed="selectedProjectId === project.id"
            aria-controls="project-detail"
            @click="$emit('select-project', project.id)"
          >
            <span class="project-stop-node" aria-hidden="true"><span></span></span>
            <span class="project-stop-index">{{ project.index }}</span>
            <strong>{{ project.subtitle }}</strong>
          </button>
        </div>
      </div>

      <Transition name="project-detail" mode="out-in">
        <article
          id="project-detail"
          :key="selectedProject.id"
          class="project-signal-detail"
          role="region"
          aria-live="polite"
          :aria-label="`${selectedProject.title} 项目详情`"
        >
          <header class="project-signal-heading">
            <p class="eyebrow"><component :is="selectedIcon" :size="15" /> {{ selectedProject.subtitle }}</p>
            <time>{{ selectedProject.period }}</time>
            <h3>{{ selectedProject.title }}</h3>
          </header>
          <div class="project-signal-story">
            <section>
              <span class="signal-story-label">CONTEXT / 01</span>
              <p>{{ selectedProject.summary }}</p>
            </section>
            <section>
              <span class="signal-story-label">OUTCOME / 02</span>
              <p>{{ selectedProject.outcome }}</p>
            </section>
          </div>
          <ul class="tech-list" :aria-label="`${selectedProject.title} 技术栈`">
            <li v-for="tech in selectedProject.stack" :key="tech">{{ tech }}</li>
          </ul>
        </article>
      </Transition>
    </div>
  </section>
</template>
