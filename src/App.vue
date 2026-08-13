<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  ArrowDown,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  Copy,
  Gauge,
  Mail,
  Map,
  Menu,
  MousePointer2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-vue-next'
import SignalWorld from './components/SignalWorld.vue'
import { experience, profile, projects, skillGroups } from './data/resume'

const sections = ['home', 'route', 'twin', 'network', 'business', 'skills', 'about', 'contact']
const activeSection = ref('home')
const menuOpen = ref(false)
const soundOn = ref(false)
const copied = ref(false)
const reducedMotion = ref(false)
const scrollProgress = ref(0)

const activeIndex = computed(() => Math.max(0, sections.indexOf(activeSection.value)))
const activeLabel = computed(() => `${String(activeIndex.value + 1).padStart(2, '0')} / ${String(sections.length).padStart(2, '0')}`)

let observer

function scrollToSection(id) {
  activeSection.value = id
  document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion.value ? 'auto' : 'smooth' })
  menuOpen.value = false
}

async function copyEmail() {
  const fallbackCopy = () => {
    const input = document.createElement('textarea')
    input.value = profile.email
    input.setAttribute('readonly', '')
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.select()
    const succeeded = document.execCommand('copy')
    input.remove()
    return succeeded
  }

  try {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(profile.email)
      } catch {
        if (!fallbackCopy()) throw new Error('Clipboard access unavailable')
      }
    } else {
      if (!fallbackCopy()) throw new Error('Clipboard access unavailable')
    }
    copied.value = true
    window.setTimeout(() => {
      copied.value = false
    }, 1800)
  } catch (error) {
    console.warn('Email copy failed', error)
  }
}

function handleScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight
  scrollProgress.value = max > 0 ? window.scrollY / max : 0
}

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

      if (visible) activeSection.value = visible.target.id
    },
    { threshold: [0.35, 0.55, 0.75] },
  )

  sections.forEach((id) => {
    const element = document.getElementById(id)
    if (element) observer.observe(element)
  })

  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  observer?.disconnect()
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#home">跳到主要内容</a>

    <SignalWorld
      :active-section="activeSection"
      :scroll-progress="scrollProgress"
      :reduced-motion="reducedMotion"
    />

    <header class="site-header">
      <button class="wordmark" aria-label="返回首页" @click="scrollToSection('home')">
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
          @click="soundOn = !soundOn"
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
          @click="menuOpen = !menuOpen"
        >
          <X v-if="menuOpen" :size="20" />
          <Menu v-else :size="20" />
        </button>
      </div>
    </header>

    <nav id="site-menu" class="site-menu" :class="{ open: menuOpen }" aria-label="页面导航">
      <button
        v-for="(id, index) in sections"
        :key="id"
        :class="{ active: activeSection === id }"
        @click="scrollToSection(id)"
      >
        <span>{{ String(index + 1).padStart(2, '0') }}</span>
        {{ {
          home: '身份场',
          route: '职业路线',
          twin: '数字孪生',
          network: '网络热力',
          business: '业务系统',
          skills: '技能核心',
          about: '个人层',
          contact: '联系信标',
        }[id] }}
      </button>
    </nav>

    <div class="progress-rail" aria-hidden="true">
      <span :style="{ transform: `scaleY(${scrollProgress})` }"></span>
    </div>

    <main>
      <section id="home" class="scene-section hero-section" aria-labelledby="home-title">
        <div class="section-content hero-content">
          <p class="eyebrow"><span>重庆</span> / WEB FRONTEND ENGINEER</p>
          <h1 id="home-title">
            <span class="name-line">陈友红</span>
            <span class="role-line">空间可视化前端工程师</span>
          </h1>
          <p class="hero-statement">{{ profile.statement }}</p>
          <div class="hero-actions">
            <button class="command-button" @click="scrollToSection('twin')">
              <MousePointer2 :size="18" />
              进入代表项目
            </button>
            <a class="text-link" :href="`mailto:${profile.email}`">
              联系我 <ArrowUpRight :size="16" />
            </a>
          </div>
          <button class="scroll-cue" @click="scrollToSection('route')">
            <ArrowDown :size="18" />
            <span>沿数据道路前进</span>
          </button>
        </div>
        <div class="hero-meta" aria-label="能力概览">
          <div><strong>04+</strong><span>年项目经验</span></div>
          <div><strong>3D</strong><span>数字孪生</span></div>
          <div><strong>LIVE</strong><span>实时数据</span></div>
        </div>
      </section>

      <section id="route" class="scene-section route-section" aria-labelledby="route-title">
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
                <p>{{ item.role }} · {{ item.signal }}</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section
        v-for="project in projects"
        :id="project.id"
        :key="project.id"
        class="scene-section project-section"
        :class="`project-${project.id}`"
        :aria-labelledby="`${project.id}-title`"
      >
        <div class="project-index" aria-hidden="true">{{ project.index }}</div>
        <article class="section-content project-content">
          <div class="section-heading">
            <p class="eyebrow"><Map v-if="project.id !== 'business'" :size="15" /><Gauge v-else :size="15" /> {{ project.subtitle }}</p>
            <time>{{ project.period }}</time>
            <h2 :id="`${project.id}-title`">{{ project.title }}</h2>
          </div>
          <p class="project-summary">{{ project.summary }}</p>
          <p class="project-outcome">{{ project.outcome }}</p>
          <ul class="tech-list" :aria-label="`${project.title} 技术栈`">
            <li v-for="tech in project.stack" :key="tech">{{ tech }}</li>
          </ul>
        </article>
      </section>

      <section id="skills" class="scene-section skills-section" aria-labelledby="skills-title">
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

      <section id="about" class="scene-section about-section" aria-labelledby="about-title">
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
              <li><Check :size="17" /> 重视责任与团队协作</li>
              <li><Check :size="17" /> 持续学习并复盘实现</li>
              <li><Check :size="17" /> 合理安排时间与交付节奏</li>
              <li><Check :size="17" /> 让复杂信息保持可理解</li>
            </ul>
          </div>
          <div class="education-line">
            <span>{{ profile.period }}</span>
            <strong>{{ profile.education }}</strong>
          </div>
        </div>
      </section>

      <section id="contact" class="scene-section contact-section" aria-labelledby="contact-title">
        <div class="section-content contact-content">
          <p class="eyebrow"><span class="status-pulse"></span> AVAILABLE FOR CONNECTION</p>
          <h2 id="contact-title">下一段信号，<br />从一次联系开始。</h2>
          <p>正在关注 Vue 前端、数据可视化、WebGL 与数字孪生方向的机会。</p>
          <div class="contact-actions">
            <a class="command-button" :href="`mailto:${profile.email}`">
              <Mail :size="18" /> 发送邮件
            </a>
            <button class="secondary-button" @click="copyEmail">
              <Check v-if="copied" :size="18" />
              <Copy v-else :size="18" />
              {{ copied ? '已复制' : '复制邮箱' }}
            </button>
          </div>
          <p class="contact-address">{{ profile.email }}</p>
        </div>
      </section>
    </main>
  </div>
</template>
