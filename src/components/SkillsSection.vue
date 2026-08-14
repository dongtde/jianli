<script setup>
defineProps({
  active: { type: Boolean, default: false },
  visible: { type: Boolean, default: false },
  skillGroups: { type: Array, required: true },
})
</script>

<template>
  <section id="skills" class="scene-section skills-section" :class="{ 'is-visible': visible, active }" aria-labelledby="skills-title">
    <div class="section-content skills-content">
      <div class="section-heading">
        <p class="eyebrow">CONNECTED CAPABILITIES</p>
        <h2 id="skills-title">能力不是百分比，是连接关系。</h2>
        <p>点击一个能力，在场景中看到它与其他技术共同组成的系统。</p>
      </div>
      <div class="skill-grid">
        <div v-for="group in skillGroups" :key="group.name" class="skill-group">
          <h3>{{ group.name }}</h3>
          <ul>
            <li v-for="skill in group.skills" :key="skill">{{ skill }}</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
