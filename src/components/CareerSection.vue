<script setup>
import { computed } from 'vue'
import { Clock3, MoveRight } from 'lucide-vue-next'
import { buildCareerTimeline } from '../utils/timeline'

const props = defineProps({
  active: { type: Boolean, default: false },
  visible: { type: Boolean, default: false },
  experience: { type: Array, required: true },
})

const careerTimeline = computed(() => buildCareerTimeline(props.experience))
</script>

<template>
  <section id="route" class="scene-section route-section" :class="{ 'is-visible': visible, active }" aria-labelledby="route-title">
    <div class="section-content career-content">
      <header class="career-header">
        <div class="career-title-group">
          <p class="eyebrow"><Clock3 :size="15" /> CAREER CHRONOGRAPH</p>
          <h2 id="route-title">工作经验</h2>
        </div>

        <div class="career-summary">
          <div class="career-range" :aria-label="`${careerTimeline.startLabel} 至今`">
            <span>{{ careerTimeline.startLabel }}</span>
            <MoveRight :size="20" aria-hidden="true" />
            <strong>NOW</strong>
          </div>
          <p>累计实战 <strong>{{ careerTimeline.totalDurationLabel }}</strong></p>
        </div>
      </header>

      <div class="career-chronograph">
        <div class="chronograph-axis" aria-hidden="true">
          <span
            v-for="(tick, index) in careerTimeline.ticks"
            :key="tick.label"
            class="chronograph-tick"
            :class="{ 'chronograph-tick-first': index === 0 }"
            :style="{ '--tick-position': `${tick.position}%` }"
          >
            {{ tick.label }}
          </span>
          <strong>NOW</strong>
        </div>

        <ol class="chronograph-rows">
          <li
            v-for="(item, index) in careerTimeline.entries"
            :key="item.company"
            class="chronograph-row"
            :class="{ 'chronograph-current': item.current }"
            :aria-current="item.current ? 'true' : undefined"
          >
            <div class="chronograph-copy">
              <div class="chronograph-meta">
                <span>{{ item.sequence }}</span>
                <time>{{ item.period }}</time>
                <strong v-if="item.current">进行中</strong>
              </div>
              <h3>{{ item.company }}</h3>
              <p class="chronograph-role">{{ item.role }}</p>
              <p class="chronograph-signal">{{ item.signal }}</p>
            </div>

            <div
              class="chronograph-track"
              :aria-label="`${item.period}，任职 ${item.durationLabel}`"
              :style="{
                '--career-start': `${item.startPercent}%`,
                '--career-span': `${item.spanPercent}%`,
                '--career-delay': `${index * 90}ms`,
              }"
            >
              <span class="chronograph-duration">{{ item.durationLabel }}</span>
              <span class="chronograph-band" aria-hidden="true">
                <span class="chronograph-node chronograph-node-start"></span>
                <span class="chronograph-node chronograph-node-end"></span>
              </span>
            </div>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>
