<script setup>
import { computed } from 'vue'

const props = defineProps({
  index: { type: String, required: true },
  title: { type: String, required: true },
  tickCount: { type: Number, default: 0 },
  active: { type: Boolean, default: false },
})

const ticks = computed(() => Array.from({ length: Math.max(1, props.tickCount) }, (_, index) => index))
</script>

<template>
  <div class="project-core-badge" :class="{ 'is-active': active }" aria-hidden="true">
    <span class="project-core-badge__orbit">
      <i
        v-for="tick in ticks"
        :key="`${title}-${tick}`"
        :style="{ '--tick-angle': `${(360 / ticks.length) * tick}deg` }"
      ></i>
    </span>
    <span class="project-core-badge__hexagon">
      <strong>{{ index }}</strong>
      <small>CORE</small>
    </span>
  </div>
</template>

<style scoped>
.project-core-badge {
  position: relative;
  display: grid;
  width: clamp(82px, 7vw, 112px);
  aspect-ratio: 1;
  flex: none;
  place-items: center;
  color: var(--project-accent);
}

.project-core-badge__orbit {
  position: absolute;
  inset: 2px;
  border: 1px solid color-mix(in srgb, var(--project-accent) 52%, transparent);
  border-radius: 50%;
  box-shadow: inset 0 0 22px color-mix(in srgb, var(--project-accent) 10%, transparent);
}

.project-core-badge__orbit::before,
.project-core-badge__orbit::after {
  position: absolute;
  inset: 9px;
  content: "";
  border: 1px solid color-mix(in srgb, var(--project-accent) 24%, transparent);
  border-radius: 50%;
}

.project-core-badge__orbit::after {
  inset: 18px;
  border-style: dashed;
}

.project-core-badge.is-active .project-core-badge__orbit {
  animation: project-core-turn 15s linear infinite;
}

.project-core-badge__orbit i {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1px;
  height: 7px;
  background: currentColor;
  box-shadow: 0 0 6px currentColor;
  transform: translate(-50%, -50%) rotate(var(--tick-angle)) translateY(calc(clamp(82px, 7vw, 112px) * -0.45));
  transform-origin: center;
}

.project-core-badge__hexagon {
  display: grid;
  width: 52%;
  aspect-ratio: 0.9;
  align-content: center;
  justify-items: center;
  border: 1px solid currentColor;
  background: color-mix(in srgb, var(--carbon) 84%, var(--project-accent) 16%);
  clip-path: polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0 50%);
  box-shadow: 0 0 22px color-mix(in srgb, var(--project-accent) 22%, transparent);
}

.project-core-badge__hexagon strong {
  color: var(--mist);
  font-family: Consolas, monospace;
  font-size: clamp(17px, 1.5vw, 23px);
  font-weight: 500;
  line-height: 1;
}

.project-core-badge__hexagon small {
  margin-top: 4px;
  color: currentColor;
  font-family: Consolas, monospace;
  font-size: 7px;
  letter-spacing: 0.12em;
}

@keyframes project-core-turn {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 680px) {
  .project-core-badge {
    width: 76px;
  }

  .project-core-badge__orbit i {
    transform: translate(-50%, -50%) rotate(var(--tick-angle)) translateY(-34px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .project-core-badge.is-active .project-core-badge__orbit {
    animation: none;
  }
}
</style>

