<script setup>
defineProps({
  sections: { type: Array, required: true },
  activeSection: { type: String, default: 'home' },
  open: { type: Boolean, default: false },
})

defineEmits(['navigate'])
</script>

<template>
  <nav id="site-menu" class="site-menu" :class="{ open }" aria-label="页面导航">
    <button
      v-for="(section, index) in sections"
      :key="section.id"
      :class="{ active: activeSection === section.id }"
      :aria-current="activeSection === section.id ? 'page' : undefined"
      @click="$emit('navigate', section.id)"
    >
      <span>{{ String(index + 1).padStart(2, '0') }}</span>
      {{ section.label }}
    </button>
  </nav>
</template>
