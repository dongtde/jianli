# AGENTS.md

## Project Rules

- 使用 Vue 3、Vite、JavaScript 和 Composition API。
- Vue 组件统一使用 `<script setup>`，不使用 Options API。
- 项目统一使用 JavaScript，Vue 文件中的脚本不声明额外的语言类型。
- 优先复用现有依赖和项目模式，不要无理由增加依赖。
- 使用 `const` 和 `let`，禁止使用 `var`。
- 公共函数、composable 和复杂数据结构使用简短 JSDoc 说明参数、返回值和副作用。
- 所有代码、注释和文档使用 UTF-8 编码。

## Architecture

- 无业务基础组件放在 `src/components/base/`，例如 Button、Modal、Input。
- 跨业务复用组件放在 `src/components/common/`。
- 跨模块逻辑放在 `src/composables/`，业务专用逻辑放在 feature 内的 `composables/`。
- API 请求放在 `src/services/`。
- Pinia store 放在 `src/stores/` 或对应 feature 目录中。
- 纯计算、格式化和无副作用逻辑放在 `src/utils/`。

推荐的功能模块结构：

```text
src/
├─ assets/
├─ config/
├─ components/
│  ├─ base/
│  └─ common/
├─ composables/
├─ services/
│  └─ http/
├─ stores/
├─ styles/
├─ views/
└─ utils/
```

## Vue Components

- 一个组件只负责一个清晰的职责。
- 组件通过 `defineProps` 接收数据，通过 `defineEmits` 暴露事件。
- Props 必须使用 Vue 运行时定义明确的 `type`、`required` 和默认值。
- 禁止直接修改 props；需要双向绑定时使用 `v-model` 或明确的更新事件。
- 展示组件不得直接调用 API，数据请求由页面、feature composable 或 store 负责。
- 模板保持声明式，复杂判断使用 `computed`，不要堆叠复杂的内联表达式。
- `v-for` 必须使用稳定且唯一的 `key`，不要使用数组下标作为动态列表 key。
- 不要在同一元素上同时使用 `v-if` 和 `v-for`。
- 禁止无必要的 `v-html`；使用时必须先清理可信 HTML。
- 除非确有必要，组件不得直接查询全局 DOM；DOM 逻辑应封装在 composable 中。
- 组件文件使用 PascalCase，例如 `UserCard.vue`。
- 事件命名使用动作语义，例如 `submit`、`close`、`update:modelValue`。
- 当组件同时承担数据请求、复杂状态和大段展示模板时，应拆分为页面组件、业务组件和 composable。

## Composables

- Composable 文件使用 `useX.js` 命名。
- 每个 composable 只解决一个问题，不创建万能的 `useCommon`。
- composable 不应在 import 时产生副作用。
- 输入参数在有必要时同时支持普通值和 Ref，并在内部统一处理。
- 事件监听器、Observer、定时器、WebSocket 和请求必须在卸载时清理。
- 异步逻辑必须处理 loading、error、empty 和取消请求状态。
- 对外暴露的内部状态尽量使用 `readonly`，只暴露明确的操作方法。
- composable 负责状态和业务编排，纯计算逻辑放在 `utils/`。
- 不要在条件分支或循环中调用 composable。
- 不要把多个无关职责继续堆入已有 composable；优先拆分成小 composable。

## State Management

- 简单交互状态保留在组件内部。
- 多个组件共享且需要跨路由保留的客户端状态使用 Pinia。
- Store 只保存状态、getters 和 actions，不保存 DOM、组件实例或临时定时器。
- 远程数据必须有清晰的加载、成功、空数据和失败状态。
- 不要把同一份远程数据无理由复制到多个 store。
- 可通过 URL 分享或恢复的筛选、分页和选中项优先放入路由参数。

## API And Data

- HTTP 客户端统一处理 base URL、认证、超时和错误格式化。
- 页面组件不得直接使用 `fetch` 或 `axios`。
- API 模块只负责请求和响应转换，不直接操作页面 DOM。
- 对外部响应数据进行必要的默认值处理和格式归一化。
- 环境变量只使用 `VITE_` 前缀，前端代码中不得放置密钥。
- 不要提交真实用户数据、Token、内部地址或客户数据。

## Styles

- 全局样式只放 reset、基础排版、设计令牌和通用工具类。
- 组件样式默认使用 `<style scoped>`。
- 全局样式拆分为 `tokens.css`、`reset.css`、`base.css`、`utilities.css` 和入口文件。
- 颜色、间距、圆角、阴影和层级统一使用 CSS variables。
- 禁止无理由使用 `!important`。
- 禁止把所有页面样式堆在一个全局 CSS 文件中。
- 样式命名使用组件名或 BEM，避免 `.box`、`.item` 等无语义名称。
- 默认采用移动端优先布局，避免横向溢出。
- 不使用内联样式，动态值除外。
- 交互动画必须支持 `prefers-reduced-motion`。

## Quality Checks

- 修改 JavaScript 或 Vue 文件后，运行项目中实际存在的 lint、test 和 build 脚本。
- 至少运行 `pnpm run build` 验证生产构建。
- 涉及页面交互时，检查键盘操作、焦点状态、移动端布局和错误状态。
- 没有实际运行的命令不得声称已通过。

## Change Scope

- 先理解现有模块边界，再进行最小范围修改。
- 不进行与任务无关的重构。
- 新增公共组件、composable 或 service 前，确认已有实现不能复用。
- 修改公共 API 时，同时更新调用方和测试。
- 不提交 `dist/`、缓存、临时文件或本地配置。
