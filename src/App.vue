<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  BriefcaseBusiness,
  Check,
  Copy,
  Gauge,
  Mail,
  Map,
  Menu,
  Volume2,
  VolumeX,
  X,
} from 'lucide-vue-next'
import SignalWorld from './components/SignalWorld.vue'
import avatarImage from './assets/img/avatar.png'
import { experience, profile, projects, skillGroups } from './data/resume'

const sections = ['home', 'route', 'projects', 'skills', 'about', 'contact']
const activeSection = ref('home')
const selectedProjectId = ref(projects[0]?.id ?? 'twin')
const menuOpen = ref(false)
const soundOn = ref(false)
const copied = ref(false)
const reducedMotion = ref(false)
const scrollProgress = ref(0)
const revealedSections = ref(new Set(['home']))
const scrollViewport = ref(null)
const typedQuote = ref('')
const quoteIndex = ref(0)

const heroQuotes = [
  '把复杂留给系统，把清晰交给用户。',
  '保持好奇，也保持把事情做完的耐心。',
  '每一次认真，都会在未来留下回声。',
]

const activeIndex = computed(() => Math.max(0, sections.indexOf(activeSection.value)))
const activeLabel = computed(() => `${String(activeIndex.value + 1).padStart(2, '0')} / ${String(sections.length).padStart(2, '0')}`)
const selectedProject = computed(() => projects.find((project) => project.id === selectedProjectId.value) ?? projects[0])
const selectedProjectIndex = computed(() => Math.max(0, projects.findIndex((project) => project.id === selectedProjectId.value)))
const projectSignalProgress = computed(() => `${projects.length > 1 ? (selectedProjectIndex.value / (projects.length - 1)) * 100 : 0}%`)
const worldSection = computed(() => activeSection.value === 'projects' ? selectedProjectId.value : activeSection.value)

let observer
let wheelLocked = false
let wheelDelta = 0
let wheelUnlockTimer
let wheelResetTimer
let quoteTimer

function scrollToSection(id) {
  activeSection.value = id
  document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion.value ? 'auto' : 'smooth' })
  menuOpen.value = false
}

function selectProject(id) {
  selectedProjectId.value = id
  activeSection.value = 'projects'
}

function moveToAdjacentSection(direction) {
  const currentIndex = Math.max(0, sections.indexOf(activeSection.value))
  const nextIndex = Math.min(sections.length - 1, Math.max(0, currentIndex + direction))
  if (nextIndex !== currentIndex) scrollToSection(sections[nextIndex])
}

function handleWheel(event) {
  if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
  const scrollablePanel = event.target instanceof Element
    ? event.target.closest('.section-content, .projects-layout')
    : null
  if (scrollablePanel && scrollablePanel.scrollHeight > scrollablePanel.clientHeight + 1) {
    const atStart = scrollablePanel.scrollTop <= 1
    const atEnd = scrollablePanel.scrollTop + scrollablePanel.clientHeight >= scrollablePanel.scrollHeight - 1
    if ((event.deltaY < 0 && !atStart) || (event.deltaY > 0 && !atEnd)) return
  }

  event.preventDefault()
  if (wheelLocked) return

  wheelDelta += event.deltaY
  window.clearTimeout(wheelResetTimer)
  wheelResetTimer = window.setTimeout(() => {
    wheelDelta = 0
  }, 120)

  if (Math.abs(wheelDelta) < 18) return
  wheelLocked = true
  moveToAdjacentSection(wheelDelta > 0 ? 1 : -1)
  wheelDelta = 0
  wheelUnlockTimer = window.setTimeout(() => {
    wheelLocked = false
  }, reducedMotion.value ? 120 : 760)
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
  const viewport = scrollViewport.value
  if (!viewport) return
  const max = viewport.scrollHeight - viewport.clientHeight
  scrollProgress.value = max > 0 ? viewport.scrollTop / max : 0
}

function startQuoteTyping() {
  window.clearTimeout(quoteTimer)

  if (reducedMotion.value) {
    typedQuote.value = heroQuotes[0]
    return
  }

  let characterIndex = 0
  let deleting = false

  const tick = () => {
    const quote = heroQuotes[quoteIndex.value]

    if (!deleting && characterIndex < quote.length) {
      characterIndex += 1
      typedQuote.value = quote.slice(0, characterIndex)
      quoteTimer = window.setTimeout(tick, 92)
      return
    }

    if (!deleting) {
      deleting = true
      quoteTimer = window.setTimeout(tick, 2200)
      return
    }

    if (characterIndex > 0) {
      characterIndex -= 1
      typedQuote.value = quote.slice(0, characterIndex)
      quoteTimer = window.setTimeout(tick, 42)
      return
    }

    deleting = false
    quoteIndex.value = (quoteIndex.value + 1) % heroQuotes.length
    quoteTimer = window.setTimeout(tick, 420)
  }

  quoteTimer = window.setTimeout(tick, 520)
}

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  startQuoteTyping()
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

      if (visible) activeSection.value = visible.target.id
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry) => {
          revealedSections.value = new Set([...revealedSections.value, entry.target.id])
        })
    },
    { root: scrollViewport.value, threshold: [0.45, 0.62, 0.78] },
  )

  sections.forEach((id) => {
    const element = document.getElementById(id)
    if (element) observer.observe(element)
  })

  handleScroll()
  scrollViewport.value?.addEventListener('scroll', handleScroll, { passive: true })
  scrollViewport.value?.addEventListener('wheel', handleWheel, { passive: false })
})

onUnmounted(() => {
  observer?.disconnect()
  scrollViewport.value?.removeEventListener('scroll', handleScroll)
  scrollViewport.value?.removeEventListener('wheel', handleWheel)
  window.clearTimeout(wheelUnlockTimer)
  window.clearTimeout(wheelResetTimer)
  window.clearTimeout(quoteTimer)
})
</script>

<template>
  <div class="app-shell" :class="{ 'home-active': activeSection === 'home' }">
    <a class="skip-link" href="#home">跳到主要内容</a>

    <SignalWorld
      :active-section="worldSection"
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
          projects: '代表项目',
          skills: '技能核心',
          about: '个人层',
          contact: '联系信标',
        }[id] }}
      </button>
    </nav>

    <div class="progress-rail" aria-hidden="true">
      <span :style="{ transform: `scaleY(${scrollProgress})` }"></span>
    </div>

    <main ref="scrollViewport" class="scroll-viewport">
      <section id="home" class="scene-section hero-section is-visible" :class="{ active: activeSection === 'home' }" aria-labelledby="home-title">
        <div class="hero-landing">
          <figure class="hero-avatar" aria-label="个人头像">
            <span class="avatar-orbit" aria-hidden="true"><i></i></span>
            <div class="hero-avatar-frame">
              <img :src="avatarImage" alt="陈友红的头像" />
            </div>
          </figure>

          <div class="hero-identity">
            <p class="hero-kicker">HELLO, I'M</p>
            <h1 id="home-title">{{ profile.name }}</h1>
            <p class="hero-role">一个做空间可视化的前端</p>
          </div>

          <p class="hero-quote" :aria-label="typedQuote || heroQuotes[0]">
            <span class="quote-mark" aria-hidden="true">“</span>
            <span aria-hidden="true">{{ typedQuote }}</span>
            <span class="type-cursor" aria-hidden="true"></span>
          </p>

          <nav class="hero-shortcuts" aria-label="首页快速入口">
            <button type="button" title="查看代表项目" @click="scrollToSection('projects')">
              <Map :size="20" />
              <span>项目</span>
            </button>
            <button type="button" title="查看职业经历" @click="scrollToSection('route')">
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

      <section id="route" class="scene-section route-section" :class="{ 'is-visible': revealedSections.has('route'), active: activeSection === 'route' }" aria-labelledby="route-title">
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

      <section id="projects" class="scene-section projects-section" :class="{ 'is-visible': revealedSections.has('projects'), active: activeSection === 'projects' }" aria-labelledby="projects-title">
        <div class="projects-layout">
          <header class="projects-intro">
            <div>
              <p class="eyebrow"><Map :size="15" /> SELECTED PROJECTS</p>
              <h2 id="projects-title">沿一条信号轨道，<br />读取三个项目坐标。</h2>
            </div>
            <p class="projects-lead">每个坐标代表一次复杂系统的前端落地。选择信号点，项目内容与背景空间会同步切换。</p>
          </header>

          <div class="project-rail-shell" :style="{ '--signal-progress': projectSignalProgress }">
            <div class="project-rail-meta">
              <span>PROJECT COORDINATES</span>
              <strong>{{ String(selectedProjectIndex + 1).padStart(2, '0') }} / {{ String(projects.length).padStart(2, '0') }}</strong>
            </div>
            <div class="project-rail" role="group" aria-label="选择代表项目">
              <div class="project-rail-track" aria-hidden="true">
                <span class="project-rail-progress"></span>
                <span class="project-rail-signal"></span>
              </div>
              <button
                v-for="(project, index) in projects"
                :key="project.id"
                type="button"
                class="project-stop"
                :class="{ active: selectedProjectId === project.id, passed: index <= selectedProjectIndex }"
                :aria-pressed="selectedProjectId === project.id"
                aria-controls="project-detail"
                @click="selectProject(project.id)"
              >
                <span class="project-stop-node" aria-hidden="true"><span></span></span>
                <span class="project-stop-index">{{ project.index }}</span>
                <strong>{{ project.subtitle }}</strong>
              </button>
            </div>
          </div>

          <Transition name="project-detail" mode="out-in">
            <article
              id="project-detail"
              :key="selectedProject.id"
              class="project-signal-detail"
              role="region"
              aria-live="polite"
              :aria-label="`${selectedProject.title} 项目详情`"
            >
              <header class="project-signal-heading">
                <p class="eyebrow"><Map v-if="selectedProject.id !== 'business'" :size="15" /><Gauge v-else :size="15" /> {{ selectedProject.subtitle }}</p>
                <time>{{ selectedProject.period }}</time>
                <h3>{{ selectedProject.title }}</h3>
              </header>
              <div class="project-signal-story">
                <section>
                  <span class="signal-story-label">CONTEXT / 01</span>
                  <p>{{ selectedProject.summary }}</p>
                </section>
                <section>
                  <span class="signal-story-label">OUTCOME / 02</span>
                  <p>{{ selectedProject.outcome }}</p>
                </section>
              </div>
              <ul class="tech-list" :aria-label="`${selectedProject.title} 技术栈`">
                <li v-for="tech in selectedProject.stack" :key="tech">{{ tech }}</li>
              </ul>
            </article>
          </Transition>
        </div>
      </section>

      <section id="skills" class="scene-section skills-section" :class="{ 'is-visible': revealedSections.has('skills'), active: activeSection === 'skills' }" aria-labelledby="skills-title">
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

      <section id="about" class="scene-section about-section" :class="{ 'is-visible': revealedSections.has('about'), active: activeSection === 'about' }" aria-labelledby="about-title">
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

      <section id="contact" class="scene-section contact-section" :class="{ 'is-visible': revealedSections.has('contact'), active: activeSection === 'contact' }" aria-labelledby="contact-title">
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
