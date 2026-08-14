<script setup>
import { Check } from 'lucide-vue-next'

defineProps({
  active: { type: Boolean, default: false },
  visible: { type: Boolean, default: false },
  profile: { type: Object, required: true },
  principles: { type: Array, required: true },
})
</script>

<template>
  <section id="about" class="scene-section about-section" :class="{ 'is-visible': visible, active }" aria-labelledby="about-title">
    <div class="section-content about-content">
      <div class="section-heading">
        <p class="eyebrow">HUMAN LAYER</p>
        <h2 id="about-title">稳定交付，也保留好奇心。</h2>
      </div>
      <div class="about-layout">
        <p class="about-lead">
          对复杂系统保持耐心，对细节保持责任感。习惯先理解业务，再决定页面、数据和空间应该如何组织。
        </p>
        <ul class="principles-list">
          <li v-for="principle in principles" :key="principle">
            <Check :size="17" /> {{ principle }}
          </li>
        </ul>
      </div>
      <div class="education-line">
        <span>{{ profile.period }}</span>
        <strong>{{ profile.education }}</strong>
      </div>
    </div>
  </section>
</template>
