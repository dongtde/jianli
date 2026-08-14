<script setup>
import { computed } from 'vue'
import { ArrowRight, BriefcaseBusiness } from 'lucide-vue-next'

const props = defineProps({
  active: { type: Boolean, default: false },
  visible: { type: Boolean, default: false },
  experience: { type: Array, required: true },
})

/**
 * Work history ordered from the earliest role to the current role.
 * @type {import('vue').ComputedRef<Array<{period: string, company: string, role: string, signal: string, sequence: string, current: boolean}>>}
 */
const timelineExperience = computed(() => {
  const orderedExperience = [...props.experience].sort((first, second) => first.period.localeCompare(second.period))

  return orderedExperience.map((item, index) => ({
    ...item,
    sequence: String(index + 1).padStart(2, '0'),
    current: item.period.includes('至今'),
  }))
})

const startYear = computed(() => timelineExperience.value[0]?.period.slice(0, 4) ?? '')
</script>

<template>
  <section id="route" class="scene-section route-section" :class="{ 'is-visible': visible, active }" aria-labelledby="route-title">
    <div class="section-content career-content">
      <header class="career-header">
        <div class="career-title-group">
          <p class="eyebrow"><BriefcaseBusiness :size="15" /> WORK EXPERIENCE</p>
          <h2 id="route-title">工作经验</h2>
        </div>

        <div class="career-range" :aria-label="`${startYear} 年至今`">
          <span>{{ startYear }}</span>
          <ArrowRight :size="20" aria-hidden="true" />
          <strong>NOW</strong>
        </div>
      </header>

      <ol class="career-timeline">
        <li
          v-for="item in timelineExperience"
          :key="item.company"
          class="career-timeline-item"
          :class="{ 'career-current': item.current }"
          :aria-current="item.current ? 'true' : undefined"
        >
          <span class="career-marker" aria-hidden="true"><span></span></span>

          <div class="career-meta">
            <span class="career-sequence">{{ item.sequence }}</span>
            <span v-if="item.current" class="career-current-label">当前</span>
          </div>

          <time>{{ item.period }}</time>
          <h3>{{ item.company }}</h3>
          <p class="career-role">{{ item.role }}</p>
          <p class="career-signal">{{ item.signal }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>
