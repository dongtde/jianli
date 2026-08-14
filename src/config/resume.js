/**
 * Ordered section metadata used by the scroll navigation and status rail.
 * @type {{id: string, label: string}[]}
 */
export const resumeSections = [
  { id: 'home', label: '身份场' },
  { id: 'route', label: '工作经验' },
  { id: 'projects', label: '代表项目' },
  { id: 'skills', label: '技能核心' },
  { id: 'about', label: '个人层' },
  { id: 'contact', label: '联系信标' },
]

/**
 * Hero typewriter copy. It is static config and has no side effects.
 * @type {string[]}
 */
export const heroQuotes = [
  '把复杂留给系统，把清晰交给用户。',
  '保持好奇，也保持把事情做完的耐心。',
  '每一次认真，都会在未来留下回声。',
]

/**
 * Personal working principles displayed in the about section.
 * @type {string[]}
 */
export const principles = [
  '重视责任与团队协作',
  '持续学习并复盘实现',
  '合理安排时间与交付节奏',
  '让复杂信息保持可理解',
]

/**
 * Core profile data rendered across the resume view.
 * @type {{name: string, role: string, intent: string, location: string, education: string, period: string, email: string, statement: string}}
 */
export const profile = {
  name: '陈友红',
  role: '空间可视化前端工程师',
  intent: 'Web 前端开发工程师',
  location: '重庆',
  education: '重庆三峡学院 · 信息管理与信息系统',
  period: '2017.09 - 2021.06',
  email: '1609226199@qq.com',
  statement: '把复杂业务，构造成可看、可懂、可操作的空间。',
}

/**
 * Work history entries displayed in the career route section.
 * @type {{period: string, company: string, role: string, signal: string}[]}
 */
export const experience = [
  {
    period: '2024.10 - 至今',
    company: '重庆软博科技',
    role: '前端开发工程师',
    signal: '数字孪生 · 地图可视化 · 实时数据',
  },
  {
    period: '2023.10 - 2024.02',
    company: '重庆同远影像科技',
    role: '前端开发工程师',
    signal: '后台系统 · H5 · 小程序',
  },
  {
    period: '2021.11 - 2023.07',
    company: '重庆纵浪科技有限公司',
    role: '前端开发工程师',
    signal: 'ERP · 电商 · 多端业务',
  },
]

/**
 * Selected project summaries rendered by the project coordinate control.
 * @type {{id: string, index: string, title: string, subtitle: string, period: string, summary: string, outcome: string, stack: string[]}[]}
 */
export const projects = [
  {
    id: 'twin',
    index: '01',
    title: '黎香湖智慧服务区平台',
    subtitle: '数字孪生服务区',
    period: '2026.03 - 至今',
    summary:
      '把车辆、停车位、设备、摄像头、经营、能耗和服务状态汇聚到同一个三维运营空间。',
    outcome:
      '通过实时轨迹、电子围栏、天气与光照联动，帮助管理人员快速掌握运行状态和异常事件。',
    stack: ['Vue3', 'Pinia', 'Cesium', 'EarthSDK3', '3D Tiles', 'GLB', 'WebSocket'],
  },
  {
    id: 'network',
    index: '02',
    title: '网络质量业务评估大屏',
    subtitle: '空间网络诊断',
    period: '2025.07 - 至今',
    summary:
      '面向全国、地市与区县的移动网络运维，把复杂质量指标转译成热力地形和联动图表。',
    outcome:
      '实现质差小区定位、悬浮信息、排行和图表联动，支持网络质量优化决策。',
    stack: ['Vue2', 'Vuex', 'ECharts', 'BMapGL', 'MapVGL'],
  },
  {
    id: 'business',
    index: '03',
    title: '多端业务系统',
    subtitle: '从管理后台到移动终端',
    period: '2021.11 - 2024.02',
    summary:
      '覆盖 ERP、内容运营、摄影服务、电商、企业微信 H5 与 Uniapp 小程序等业务形态。',
    outcome:
      '持续处理真实业务流转、内容管理、订单、任务、物流和多端交付。',
    stack: ['Vue2/3', 'Element UI', 'Vant', 'Uniapp', 'uView', 'Axios'],
  },
]

/**
 * Skill groups displayed as connected capability columns.
 * @type {{name: string, skills: string[]}[]}
 */
export const skillGroups = [
  {
    name: 'Application',
    skills: ['Vue 3', 'Pinia', 'Vue Router', 'Axios'],
  },
  {
    name: 'Spatial',
    skills: ['Three.js', 'Cesium', '3D Tiles', 'GLB'],
  },
  {
    name: 'Data',
    skills: ['ECharts', 'BMapGL', 'MapVGL', 'WebSocket'],
  },
  {
    name: 'Delivery',
    skills: ['JavaScript', 'Sass', 'Git', 'Node.js'],
  },
]
