<script setup>
import { Check, Copy, Mail } from 'lucide-vue-next'

defineProps({
  active: { type: Boolean, default: false },
  visible: { type: Boolean, default: false },
  profile: { type: Object, required: true },
  copied: { type: Boolean, default: false },
})

defineEmits(['copy-email'])
</script>

<template>
  <section id="contact" class="scene-section contact-section" :class="{ 'is-visible': visible, active }" aria-labelledby="contact-title">
    <div class="section-content contact-content">
      <p class="eyebrow"><span class="status-pulse"></span> AVAILABLE FOR CONNECTION</p>
      <h2 id="contact-title">下一段信号，<br />从一次联系开始。</h2>
      <p>正在关注 Vue 前端、数据可视化、WebGL 与数字孪生方向的机会。</p>
      <div class="contact-actions">
        <a class="command-button" :href="`mailto:${profile.email}`">
          <Mail :size="18" /> 发送邮件
        </a>
        <button class="secondary-button" @click="$emit('copy-email')">
          <Check v-if="copied" :size="18" />
          <Copy v-else :size="18" />
          {{ copied ? '已复制' : '复制邮箱' }}
        </button>
      </div>
      <p class="contact-address">{{ profile.email }}</p>
    </div>
  </section>
</template>
