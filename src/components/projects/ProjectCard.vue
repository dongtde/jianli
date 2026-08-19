<script setup>
import ProjectCoreBadge from './ProjectCoreBadge.vue'

defineProps({
  project: { type: Object, required: true },
  active: { type: Boolean, default: false },
})
</script>

<template>
  <article class="project-card" :class="{ 'is-active': active }">
    <header class="project-card__heading">
      <ProjectCoreBadge
        :index="project.index"
        :title="project.title"
        :tick-count="project.stack.length"
        :active="active"
      />
      <div class="project-card__identity">
        <div class="project-card__meta">
          <span>{{ project.category }}</span>
          <time>{{ project.period }}</time>
          <i v-if="project.current">LIVE</i>
        </div>
        <h3>{{ project.title }}</h3>
        <p class="project-card__role">{{ project.role }}</p>
      </div>
    </header>

    <div class="project-card__body">
      <section class="project-card__problem">
        <span class="project-card__label">问题场景</span>
        <p>{{ project.problem }}</p>
        <dl v-if="project.scale.length" class="project-card__scale">
          <div v-for="metric in project.scale" :key="metric.label">
            <dt>{{ metric.label }}</dt>
            <dd>{{ metric.value }}</dd>
          </div>
        </dl>
      </section>

      <section class="project-card__actions">
        <span class="project-card__label">我做了什么</span>
        <ol>
          <li v-for="(action, index) in project.actions" :key="`${project.id}-${index}`">
            <span>{{ String(index + 1).padStart(2, '0') }}</span>
            <p>{{ action }}</p>
          </li>
        </ol>
      </section>
    </div>

    <footer class="project-card__stack">
      <span>技术选择</span>
      <ul :aria-label="`${project.title} 技术栈`">
        <li v-for="tech in project.stack" :key="tech">{{ tech }}</li>
      </ul>
    </footer>
  </article>
</template>

<style scoped>
.project-card {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr) auto;
  padding: clamp(20px, 2.1vw, 32px);
  border: 1px solid color-mix(in srgb, var(--project-accent) 34%, var(--line));
  border-radius: 6px;
  color: var(--mist);
  background:
    linear-gradient(110deg, color-mix(in srgb, var(--project-accent) 7%, transparent), transparent 34%),
    rgba(7, 16, 20, 0.94);
  box-shadow:
    inset 2px 0 0 color-mix(in srgb, var(--project-accent) 76%, transparent),
    0 24px 70px rgba(0, 0, 0, 0.42);
}

.project-card__heading {
  display: flex;
  gap: clamp(18px, 2.2vw, 34px);
  align-items: center;
  padding-bottom: clamp(15px, 2vh, 24px);
  border-bottom: 1px solid var(--line);
}

.project-card__identity {
  min-width: 0;
}

.project-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 7px 16px;
  align-items: center;
  margin-bottom: 9px;
  color: var(--project-accent);
  font-family: Consolas, monospace;
  font-size: 9px;
  line-height: 1.4;
  text-transform: uppercase;
}

.project-card__meta time {
  color: var(--steel);
}

.project-card__meta i {
  padding: 2px 5px;
  border: 1px solid color-mix(in srgb, var(--project-accent) 48%, transparent);
  color: var(--project-accent);
  font-size: 7px;
  font-style: normal;
}

.project-card h3 {
  margin: 0;
  color: var(--mist);
  font-size: clamp(24px, 2.4vw, 38px);
  font-weight: 680;
  line-height: 1.1;
}

.project-card__role {
  margin: 8px 0 0;
  color: var(--mist-muted);
  font-size: 12px;
}

.project-card__body {
  display: grid;
  min-height: 0;
  grid-template-columns: minmax(220px, 0.72fr) minmax(0, 1.28fr);
  gap: clamp(24px, 4vw, 60px);
  padding: clamp(18px, 2.5vh, 30px) 0;
}

.project-card__label {
  display: block;
  margin-bottom: 12px;
  color: var(--project-accent);
  font-family: Consolas, monospace;
  font-size: 9px;
}

.project-card__problem > p {
  margin: 0;
  color: var(--mist-muted);
  font-size: clamp(13px, 1vw, 15px);
  line-height: 1.65;
}

.project-card__scale {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  margin: clamp(17px, 2.2vh, 25px) 0 0;
  background: var(--line);
}

.project-card__scale div {
  min-width: 0;
  padding: 11px 12px;
  background: rgba(7, 16, 20, 0.92);
}

.project-card__scale dt {
  margin-bottom: 5px;
  color: var(--steel);
  font-size: 8px;
}

.project-card__scale dd {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--mist);
  font-family: Consolas, monospace;
  font-size: 11px;
  line-height: 1.4;
}

.project-card__actions ol {
  display: grid;
  gap: clamp(9px, 1.3vh, 14px);
  margin: 0;
  padding: 0;
  list-style: none;
}

.project-card__actions li {
  display: grid;
  grid-template-columns: 25px minmax(0, 1fr);
  gap: 12px;
  padding-top: 9px;
  border-top: 1px solid rgba(232, 239, 240, 0.1);
}

.project-card__actions li > span {
  padding-top: 2px;
  color: var(--project-accent);
  font-family: Consolas, monospace;
  font-size: 9px;
}

.project-card__actions p {
  margin: 0;
  color: var(--mist-muted);
  font-size: clamp(12px, 0.92vw, 14px);
  line-height: 1.56;
}

.project-card__stack {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 18px;
  align-items: baseline;
  padding-top: 13px;
  border-top: 1px solid var(--line);
}

.project-card__stack > span {
  color: var(--steel);
  font-family: Consolas, monospace;
  font-size: 8px;
}

.project-card__stack ul {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.project-card__stack li {
  color: color-mix(in srgb, var(--project-accent) 86%, var(--mist));
  font-family: Consolas, monospace;
  font-size: 10px;
}

.project-card__stack li + li::before {
  margin: 0 8px;
  color: var(--steel);
  content: "/";
}

@media (max-width: 900px) {
  .project-card__body {
    gap: 26px;
  }
}

@media (max-width: 680px) {
  .project-card {
    display: block;
    overflow-y: auto;
    padding: 17px;
    scrollbar-width: none;
  }

  .project-card::-webkit-scrollbar {
    display: none;
  }

  .project-card__heading {
    gap: 13px;
  }

  .project-card__meta {
    gap: 4px 10px;
    margin-bottom: 6px;
  }

  .project-card h3 {
    font-size: clamp(21px, 6.8vw, 28px);
  }

  .project-card__body {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .project-card__scale {
    margin-top: 14px;
  }

  .project-card__stack {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>

