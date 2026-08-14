<script setup>
import { Menu, Volume2, VolumeX, X } from 'lucide-vue-next'

defineProps({
  activeLabel: { type: String, default: '01 / 06' },
  soundOn: { type: Boolean, default: false },
  menuOpen: { type: Boolean, default: false },
})

defineEmits(['navigate', 'toggle-sound', 'toggle-menu'])
</script>

<template>
  <header class="site-header">
    <button class="wordmark" aria-label="返回首页" @click="$emit('navigate', 'home')">
      <span>CYH</span>
      <small>SIGNAL TERRAIN</small>
    </button>

    <div class="system-status" aria-label="系统状态">
      <span class="status-pulse"></span>
      <span>WORLD ONLINE</span>
      <span class="status-divider"></span>
      <span>{{ activeLabel }}</span>
    </div>

    <div class="header-actions">
      <button
        class="icon-button"
        :aria-label="soundOn ? '关闭环境音' : '开启环境音'"
        :title="soundOn ? '关闭环境音' : '开启环境音'"
        @click="$emit('toggle-sound')"
      >
        <Volume2 v-if="soundOn" :size="18" />
        <VolumeX v-else :size="18" />
      </button>
      <button
        class="icon-button menu-button"
        :aria-expanded="menuOpen"
        aria-controls="site-menu"
        aria-label="打开导航"
        title="导航"
        @click="$emit('toggle-menu')"
      >
        <X v-if="menuOpen" :size="20" />
        <Menu v-else :size="20" />
      </button>
    </div>
  </header>
</template>
