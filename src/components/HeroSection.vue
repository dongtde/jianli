<script setup>
import { computed } from 'vue';
import { BriefcaseBusiness, Mail, Map } from 'lucide-vue-next';

const props = defineProps({
  active: { type: Boolean, default: false },
  profile: { type: Object, required: true },
  typedQuote: { type: String, default: '' },
  heroQuotes: { type: Array, default: () => [] },
  avatarImage: { type: String, required: true },
});

defineEmits(['navigate']);

const quoteLabel = computed(
  () => props.typedQuote || props.heroQuotes[0] || '',
);
</script>

<template>
  <section
    id="home"
    class="scene-section hero-section is-visible"
    :class="{ active }"
    aria-labelledby="home-title"
  >
    <div class="hero-landing">
      <figure class="hero-avatar" aria-label="个人头像">
        <span class="avatar-orbit" aria-hidden="true"><i></i></span>
        <div class="hero-avatar-frame">
          <img :src="avatarImage" :alt="`${profile.name}的头像`" />
        </div>
      </figure>

      <div class="hero-identity">
        <p class="hero-kicker">HELLO, I'M</p>
        <h1 id="home-title">{{ profile.name }}</h1>
        <p class="hero-role">一个做空间可视化的前端</p>
      </div>

      <p class="hero-quote" :aria-label="quoteLabel">
        <span class="quote-mark" aria-hidden="true"></span>
        <span aria-hidden="true">{{ typedQuote }}</span>
        <span class="type-cursor" aria-hidden="true"></span>
      </p>

      <nav class="hero-shortcuts" aria-label="首页快速入口">
        <button
          type="button"
          title="查看代表项目"
          @click="$emit('navigate', 'projects')"
        >
          <Map :size="20" />
          <span>项目</span>
        </button>
        <button
          type="button"
          title="查看职业经历"
          @click="$emit('navigate', 'route')"
        >
          <BriefcaseBusiness :size="20" />
          <span>经历</span>
        </button>
        <a :href="`mailto:${profile.email}`" title="发送邮件">
          <Mail :size="20" />
          <span>邮箱</span>
        </a>
      </nav>
    </div>
  </section>
</template>
