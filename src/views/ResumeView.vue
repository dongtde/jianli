<script setup>
import { computed, ref } from 'vue'
import SignalWorld from '../components/SignalWorld.vue'
import SiteHeader from '../components/SiteHeader.vue'
import SiteMenu from '../components/SiteMenu.vue'
import HeroSection from '../components/HeroSection.vue'
import CareerSection from '../components/CareerSection.vue'
import ProjectsSection from '../components/ProjectsSection.vue'
import SkillsSection from '../components/SkillsSection.vue'
import AboutSection from '../components/AboutSection.vue'
import ContactSection from '../components/ContactSection.vue'
import avatarImage from '../assets/img/avatar.png'
import { experience, heroQuotes, principles, profile, projects, resumeSections, skillGroups } from '../config/resume'
import { useClipboard } from '../composables/useClipboard'
import { useReducedMotion } from '../composables/useReducedMotion'
import { useSectionNavigation } from '../composables/useSectionNavigation'
import { useTypewriter } from '../composables/useTypewriter'
import { formatCounter } from '../utils/format'
import { buildCareerTimeline } from '../utils/timeline'
import './resume/resume.css'

const sectionIds = resumeSections.map((section) => section.id)
const selectedProjectId = ref(projects[0]?.id ?? '')
const menuOpen = ref(false)
const soundOn = ref(false)
const routeProgress = ref(0)

// The experience list is static config, so the corridor stations are derived once.
const careerTimeline = buildCareerTimeline(experience)
const routeStops = careerTimeline.axisMonthCount
  ? careerTimeline.entries.map((item) => item.focusMonthOffset / careerTimeline.axisMonthCount)
  : []

const { reducedMotion } = useReducedMotion()
const {
  activeSection,
  activateSection,
  revealedSections,
  scrollProgress,
  scrollToSection,
  scrollViewport,
} = useSectionNavigation(sectionIds, reducedMotion)
const { typedText: typedQuote } = useTypewriter(heroQuotes, reducedMotion)
const { copied, copyText } = useClipboard()

const activeIndex = computed(() => Math.max(0, sectionIds.indexOf(activeSection.value)))
const activeLabel = computed(() => formatCounter(activeIndex.value + 1, sectionIds.length))
const selectedProjectIndex = computed(() => Math.max(0, projects.findIndex((project) => project.id === selectedProjectId.value)))
const worldSection = computed(() => activeSection.value)

const navigateToSection = (id) => {
  scrollToSection(id)
  menuOpen.value = false
}

const selectProject = (id) => {
  selectedProjectId.value = id
  activateSection('projects')
}

const copyEmail = () => {
  copyText(profile.email)
}

const handleCareerFocus = ({ progress }) => {
  routeProgress.value = progress
}
</script>

<template>
  <div class="app-shell" :class="{ 'home-active': activeSection === 'home' }">
    <a class="skip-link" href="#home">跳到主要内容</a>

    <SignalWorld
      :active-section="worldSection"
      :project-index="selectedProjectIndex"
      :project-count="projects.length"
      :route-progress="routeProgress"
      :route-stops="routeStops"
      :reduced-motion="reducedMotion"
    />

    <SiteHeader
      :active-label="activeLabel"
      :sound-on="soundOn"
      :menu-open="menuOpen"
      @navigate="navigateToSection"
      @toggle-sound="soundOn = !soundOn"
      @toggle-menu="menuOpen = !menuOpen"
    />

    <SiteMenu
      :sections="resumeSections"
      :active-section="activeSection"
      :open="menuOpen"
      @navigate="navigateToSection"
    />

    <div class="progress-rail" aria-hidden="true">
      <span :style="{ transform: `scaleY(${scrollProgress})` }"></span>
    </div>

    <main ref="scrollViewport" class="scroll-viewport">
      <HeroSection
        :active="activeSection === 'home'"
        :profile="profile"
        :typed-quote="typedQuote"
        :hero-quotes="heroQuotes"
        :avatar-image="avatarImage"
        @navigate="navigateToSection"
      />

      <CareerSection
        :active="activeSection === 'route'"
        :visible="revealedSections.has('route')"
        :experience="experience"
        @focus-change="handleCareerFocus"
      />

      <ProjectsSection
        :active="activeSection === 'projects'"
        :visible="revealedSections.has('projects')"
        :projects="projects"
        :selected-project-id="selectedProjectId"
        @select-project="selectProject"
      />

      <SkillsSection
        :active="activeSection === 'skills'"
        :visible="revealedSections.has('skills')"
        :skill-groups="skillGroups"
      />

      <AboutSection
        :active="activeSection === 'about'"
        :visible="revealedSections.has('about')"
        :profile="profile"
        :principles="principles"
      />

      <ContactSection
        :active="activeSection === 'contact'"
        :visible="revealedSections.has('contact')"
        :profile="profile"
        :copied="copied"
        @copy-email="copyEmail"
      />
    </main>
  </div>
</template>
