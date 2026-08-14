<script setup>
import { BriefcaseBusiness } from 'lucide-vue-next'

defineProps({
  active: { type: Boolean, default: false },
  visible: { type: Boolean, default: false },
  experience: { type: Array, required: true },
})
</script>

<template>
  <section id="route" class="scene-section route-section" :class="{ 'is-visible': visible, active }" aria-labelledby="route-title">
    <div class="section-content narrow-content">
      <div class="section-heading">
        <p class="eyebrow"><BriefcaseBusiness :size="15" /> CAREER ROUTE</p>
        <h2 id="route-title">从业务界面，走进空间系统。</h2>
        <p>每一次迁移都让前端从“呈现信息”更接近“理解并控制系统”。</p>
      </div>
      <ol class="career-list">
        <li v-for="item in experience" :key="item.company">
          <time>{{ item.period }}</time>
          <div>
            <h3>{{ item.company }}</h3>
            <p>{{ item.role }} - {{ item.signal }}</p>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>
