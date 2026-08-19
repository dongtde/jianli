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
 * @type {{period: string, company: string, role: string, signal: string, highlights: string[]}[]}
 */
export const experience = [
  {
    period: '2024.10 - 至今',
    company: '重庆软博科技',
    role: '前端开发工程师',
    signal: '数字孪生 · 地图可视化 · 实时数据',
    highlights: [
      '参与数字孪生项目的前端开发，整合地图、三维场景与业务数据展示',
      '实现车辆、设备、轨迹、告警等实时数据的可视化交互与状态联动',
      '持续优化复杂场景的加载性能、交互体验与页面稳定性',
    ],
  },
  {
    period: '2023.10 - 2024.02',
    company: '重庆同远影像科技',
    role: '前端开发工程师',
    signal: '后台系统 · H5 · 小程序',
    highlights: [
      '负责后台管理系统、H5 与小程序的页面开发和接口联调',
      '配合产品与后端团队拆解需求，完成业务流程和移动端功能交付',
      '维护公共组件并持续优化页面兼容性与用户体验',
    ],
  },
  {
    period: '2021.11 - 2023.07',
    company: '重庆纵浪科技有限公司',
    role: '前端开发工程师',
    signal: 'ERP · 电商 · 多端业务',
    highlights: [
      '参与 ERP、电商及内容运营系统开发，覆盖商品、订单和任务等业务',
      '使用 Vue、Element UI、Vant 与 Uniapp 完成后台、H5 和小程序开发',
      '参与需求评审、接口联调和持续迭代，保障多端业务稳定交付',
    ],
  },
]

/**
 * Project case studies rendered by the depth deck.
 * @type {{id: string, index: string, title: string, category: string, period: string, current?: boolean, accent: string, role: string, scale: {label: string, value: string}[], problem: string, actions: string[], stack: string[]}[]}
 */
export const projects = [
  {
    id: 'lixianghu',
    index: '01',
    title: '黎香湖智慧服务区平台',
    category: '数字孪生 · 可视化大屏',
    period: '2026.03 - 至今',
    current: true,
    accent: 'teal',
    role: 'Web 前端开发',
    scale: [{ label: '业务模块', value: '6' }, { label: '实时通道', value: 'MQTT / WS' }],
    problem: '服务区的车流、能耗、经营、设备分散在多个系统里，管理者无法在同一视图判断运行状态。',
    actions: [
      '基于 EarthSDK3 / Cesium 融合进城、出城 3D Tiles 与 GLB 场景，实现视角切换、天气、时间光照与建筑掀盖',
      '接入 MQTT / WebSocket 实时车辆数据，实现多车型三维轨迹、平滑移动、停车位吸附与电子围栏',
      '搭建综合态势、智慧服务、能源、经营、管理、云服务模块，用 ECharts 呈现客流、车流、能耗与设备数据',
    ],
    stack: ['Vue3', 'Pinia', 'EarthSDK3', 'Cesium', '3D Tiles', 'GLB', 'WebSocket', 'ECharts'],
  },
  {
    id: 'network-quality',
    index: '02',
    title: '网络质量业务评估大屏',
    category: '空间网络诊断',
    period: '2025.07 - 至今',
    accent: 'lime',
    role: 'Web 前端开发',
    scale: [{ label: '空间层级', value: '全国 / 地市 / 区县' }, { label: '核心视图', value: '热力 + 图表' }],
    problem: '移动网络质量指标复杂且分散，运维人员需要在不同层级地图和统计面板之间反复切换。',
    actions: [
      '用 BMapGL / MapVGL 构建全国、地市、区县三级空间视图，把质差小区映射为可探索的热力地形',
      '以 ECharts 搭建指标、排行与趋势模块，实现地图悬浮信息和图表筛选联动',
      '整理 Vue2 / Vuex 页面状态，兼顾大屏分辨率适配与复杂数据状态下的交互稳定性',
    ],
    stack: ['Vue2', 'Vuex', 'ECharts', 'BMapGL', 'MapVGL'],
  },
  {
    id: 'telecom-ai',
    index: '03',
    title: '安徽电信 / 信令大模型平台',
    category: '电信分析 · 智能平台',
    period: '2024.10 - 至今',
    accent: 'coral',
    role: 'Web 前端开发',
    scale: [{ label: '数据视图', value: '热力 / 信令' }, { label: '交互方式', value: '问答式分析' }],
    problem: '运营商网络数据量大、专业门槛高，业务人员难以从信令和区域热力中快速得到结论。',
    actions: [
      '参与安徽电信与海联联通热力图产品，将区域指标、基站质量与时间切片组合成可读的地图分析视图',
      '参与信令大模型前端交互，设计问题输入、结果流式呈现与分析上下文切换',
      '统一图表、地图和筛选状态，让复杂运营数据在同一工作流中完成定位与复核',
    ],
    stack: ['Vue3', 'Pinia', 'ECharts', 'BMapGL', 'WebSocket', 'AI Platform'],
  },
  {
    id: 'movie-service',
    index: '04',
    title: '大片来了多端业务',
    category: '后台 · 服务商 H5 · 小程序',
    period: '2023.10 - 2024.02',
    accent: 'teal',
    role: '前端开发工程师',
    scale: [{ label: '交付形态', value: '后台 / H5 / 小程序' }, { label: '业务链路', value: '内容 + 订单' }],
    problem: '摄影服务业务同时面向运营、服务商和消费者，多个端的内容、订单和任务需要保持一致。',
    actions: [
      '负责后台管理、服务商 H5 与 JPG 小程序页面开发及接口联调，拆解跨端复用的业务模块',
      '围绕内容发布、服务预约、订单流转和任务处理完成移动端交互交付',
      '维护公共组件与适配规则，持续处理不同设备下的布局和兼容性问题',
    ],
    stack: ['Vue3', 'Element UI', 'Vant', 'Uniapp', 'Axios'],
  },
  {
    id: 'erp-platform',
    index: '05',
    title: '奇思妙想 ERP / 迅鲸管理平台',
    category: 'ERP · 电商 · 企业微信',
    period: '2021.11 - 2023.07',
    accent: 'steel',
    role: '前端开发工程师',
    scale: [{ label: '系统形态', value: 'ERP / 管理后台' }, { label: '协作入口', value: '企微侧边栏 H5' }],
    problem: '商品、订单、任务和运营内容分布在多个管理系统，内部协作需要更短的操作路径。',
    actions: [
      '参与奇思妙想 ERP 与迅鲸管理系统开发，覆盖商品、订单、任务和内容运营等核心业务',
      '使用 Vue、Element UI、Vant 构建后台与企业微信侧边栏 H5，完成接口联调和权限场景适配',
      '配合需求评审与持续迭代，保持复杂表单、列表和流程页面的可维护性',
    ],
    stack: ['Vue2', 'Vue3', 'Element UI', 'Vant', 'Axios', 'Sass'],
  },
  {
    id: 'uniapp-business',
    index: '06',
    title: '迅鲸通告 / 迅鲸心选 / 和乐春晖',
    category: 'Uniapp · 跨端业务',
    period: '2021.11 - 2023.07',
    accent: 'lime',
    role: '前端开发工程师',
    scale: [{ label: '端类型', value: 'H5 / 小程序' }, { label: '框架', value: 'Uniapp + uView' }],
    problem: '通告、选品与服务业务需要覆盖不同移动端，重复开发会拖慢验证和交付节奏。',
    actions: [
      '使用 Uniapp、uView 完成迅鲸通告、迅鲸心选与和乐春晖等小程序页面和业务流程',
      '抽取跨端可复用的列表、表单、筛选与状态反馈模式，减少多端差异带来的维护成本',
      '参与物流、任务、内容和用户流程的接口联调，保证移动端功能持续交付',
    ],
    stack: ['Uniapp', 'uView', 'Vue2', 'JavaScript', 'Axios'],
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
