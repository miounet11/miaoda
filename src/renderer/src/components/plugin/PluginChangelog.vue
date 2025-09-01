<template>
  <div class="plugin-changelog">
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <p>正在加载更新日志...</p>
    </div>

    <div v-else-if="changelog.length === 0" class="empty-state">
      <Clock :size="48" class="empty-icon" />
      <h3>暂无更新日志</h3>
      <p>此插件还没有发布更新</p>
    </div>

    <div v-else class="changelog-container">
      <div v-for="version in changelog" :key="version.version" class="version-item">
        <div class="version-header">
          <div class="version-info">
            <h3 class="version-number">v{{ version.version }}</h3>
            <span v-if="version.isLatest" class="latest-badge"> 最新 </span>
            <span v-if="version.type" :class="['version-type', version.type]">
              {{ getVersionTypeLabel(version.type) }}
            </span>
          </div>
          <div class="version-meta">
            <span class="version-date">{{ formatDate(version.date) }}</span>
            <span v-if="version.size" class="version-size">{{ version.size }}</span>
          </div>
        </div>

        <div class="version-content">
          <div v-if="version.summary" class="version-summary">
            {{ version.summary }}
          </div>

          <div class="changes-section">
            <!-- New Features -->
            <div v-if="version.changes.features?.length" class="change-group">
              <h4 class="change-title">
                <Plus :size="16" class="change-icon features" />
                新功能
              </h4>
              <ul class="change-list">
                <li v-for="feature in version.changes.features" :key="feature">
                  {{ feature }}
                </li>
              </ul>
            </div>

            <!-- Improvements -->
            <div v-if="version.changes.improvements?.length" class="change-group">
              <h4 class="change-title">
                <ArrowUp :size="16" class="change-icon improvements" />
                改进
              </h4>
              <ul class="change-list">
                <li v-for="improvement in version.changes.improvements" :key="improvement">
                  {{ improvement }}
                </li>
              </ul>
            </div>

            <!-- Bug Fixes -->
            <div v-if="version.changes.fixes?.length" class="change-group">
              <h4 class="change-title">
                <Bug :size="16" class="change-icon fixes" />
                修复
              </h4>
              <ul class="change-list">
                <li v-for="fix in version.changes.fixes" :key="fix">
                  {{ fix }}
                </li>
              </ul>
            </div>

            <!-- Breaking Changes -->
            <div v-if="version.changes.breaking?.length" class="change-group">
              <h4 class="change-title">
                <AlertTriangle :size="16" class="change-icon breaking" />
                破坏性变更
              </h4>
              <ul class="change-list">
                <li v-for="breaking in version.changes.breaking" :key="breaking">
                  {{ breaking }}
                </li>
              </ul>
            </div>

            <!-- Security -->
            <div v-if="version.changes.security?.length" class="change-group">
              <h4 class="change-title">
                <Shield :size="16" class="change-icon security" />
                安全
              </h4>
              <ul class="change-list">
                <li v-for="security in version.changes.security" :key="security">
                  {{ security }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Version Actions -->
          <div class="version-actions">
            <button
              v-if="!version.isLatest"
              @click="installVersion(version)"
              class="action-btn secondary"
             aria-label="按钮">
              <Download :size="14" />
              安装此版本
            </button>
            <button
              v-if="version.releaseNotes"
              @click="viewReleaseNotes(version)"
              class="action-btn secondary"
             aria-label="按钮">
              <ExternalLink :size="14" />
              详细说明
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Clock,
  Plus,
  ArrowUp,
  Bug,
  AlertTriangle,
  Shield,
  Download,
  ExternalLink
} from 'lucide-vue-next'

import type { PluginMarketListing } from '../../types/plugins'

interface VersionChanges {
  features?: string[]
  improvements?: string[]
  fixes?: string[]
  breaking?: string[]
  security?: string[]
}

interface ChangelogVersion {
  version: string
  date: string
  summary?: string
  type?: 'major' | 'minor' | 'patch' | 'beta' | 'alpha'
  size?: string
  isLatest?: boolean
  changes: VersionChanges
  releaseNotes?: string
}

interface Props {
  plugin: PluginMarketListing
}

defineProps<Props>()

// State
const loading = ref(false)
const changelog = ref<ChangelogVersion[]>([
  {
    version: '2.1.0',
    date: '2024-01-15',
    summary: '大幅改进用户体验，新增多项实用功能',
    type: 'minor',
    size: '2.3 MB',
    isLatest: true,
    changes: {
      features: [
        '新增三角函数计算支持',
        '添加单位转换功能',
        '支持历史记录导出',
        '新增键盘快捷键自定义'
      ],
      improvements: [
        '优化计算精度算法',
        '改进界面响应速度',
        '提升内存使用效率',
        '优化错误提示信息'
      ],
      fixes: [
        '修复小数点精度问题',
        '修复特殊字符输入错误',
        '修复界面在小屏幕下的显示问题',
        '修复快捷键冲突'
      ]
    },
    releaseNotes: 'https://example.com/release-notes/2.1.0'
  },
  {
    version: '2.0.5',
    date: '2024-01-01',
    summary: '修复重要bug，提升稳定性',
    type: 'patch',
    size: '2.1 MB',
    changes: {
      fixes: ['修复计算结果显示错误', '修复插件崩溃问题', '修复设置无法保存'],
      improvements: ['优化启动速度', '减少内存占用'],
      security: ['修复潜在的安全漏洞', '更新依赖库版本']
    }
  },
  {
    version: '2.0.0',
    date: '2023-12-20',
    summary: '全新设计，重构核心功能',
    type: 'major',
    size: '2.5 MB',
    changes: {
      features: ['全新的用户界面设计', '支持科学计数法', '添加历史记录功能', '支持多种主题切换'],
      improvements: ['重构计算引擎', '提升计算精度', '优化性能表现'],
      breaking: ['API 接口变更，不兼容 1.x 版本', '配置文件格式更新，需要重新设置']
    }
  }
])

// Methods
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getVersionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    major: '主版本',
    minor: '次版本',
    patch: '补丁',
    beta: 'Beta',
    alpha: 'Alpha'
  }
  return labels[type] || type
}

const installVersion = (version: ChangelogVersion) => {
  console.log('Install version:', version.version)
  // Implement version-specific installation
}

const viewReleaseNotes = (version: ChangelogVersion) => {
  if (version.releaseNotes) {
    window.open(version.releaseNotes, '_blank')
  }
}

// Initialize
onMounted(() => {
  // Load changelog from API
})
</script>

<style scoped>

/* 🎨 响应式设计系统 */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* 🎨 响应式实用类 */
.container-sm { max-width: var(--breakpoint-sm); }
.container-md { max-width: var(--breakpoint-md); }
.container-lg { max-width: var(--breakpoint-lg); }
.container-xl { max-width: var(--breakpoint-xl); }

/* 响应式显示 */
.hidden-sm { display: none; }
.hidden-md { display: none; }
.hidden-lg { display: none; }

@media (min-width: 640px) {
  .hidden-sm { display: block; }
}

@media (min-width: 768px) {
  .hidden-md { display: block; }
}

@media (min-width: 1024px) {
  .hidden-lg { display: block; }
}

/* 响应式文本 */
.text-responsive-sm { font-size: clamp(0.875rem, 2vw, 1rem); }
.text-responsive-base { font-size: clamp(1rem, 2.5vw, 1.125rem); }
.text-responsive-lg { font-size: clamp(1.125rem, 3vw, 1.25rem); }
.text-responsive-xl { font-size: clamp(1.25rem, 3.5vw, 1.5rem); }

/* 响应式间距 */
.space-responsive-sm { gap: clamp(0.5rem, 2vw, 1rem); }
.space-responsive-md { gap: clamp(1rem, 3vw, 1.5rem); }
.space-responsive-lg { gap: clamp(1.5rem, 4vw, 2rem); }

/* 响应式网格 */
.grid-responsive-sm {
  grid-template-columns: repeat(auto-fit, minmax(clamp(200px, 25vw, 300px), 1fr));
}

.grid-responsive-md {
  grid-template-columns: repeat(auto-fit, minmax(clamp(250px, 30vw, 350px), 1fr));
}

.grid-responsive-lg {
  grid-template-columns: repeat(auto-fit, minmax(clamp(300px, 35vw, 400px), 1fr));
}

/* 响应式布局调整 */
@media (max-width: 640px) {
  .flex-col-mobile { flex-direction: column; }
  .grid-1-mobile { grid-template-columns: 1fr; }
  .gap-2-mobile { gap: var(--space-2); }
  .p-4-mobile { padding: var(--space-4); }
}

@media (max-width: 768px) {
  .flex-col-tablet { flex-direction: column; }
  .grid-2-tablet { grid-template-columns: repeat(2, 1fr); }
  .gap-4-tablet { gap: var(--space-4); }
  .p-6-tablet { padding: var(--space-6); }
}

@media (max-width: 1024px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: static;
  }
}

/* 🎨 现代布局系统 */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-start {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.flex-end {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.flex-wrap {
  display: flex;
  flex-wrap: wrap;
}

/* 🎨 网格系统 */
.grid-auto-fit {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
}

.grid-auto-fill {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
}

.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

.grid-gap-2 { gap: var(--space-2); }
.grid-gap-4 { gap: var(--space-4); }
.grid-gap-6 { gap: var(--space-6); }

/* 🎨 卡片布局 */
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.card-interactive:hover {
  cursor: pointer;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1);
}

/* 🎨 页面布局 */
.page-layout {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: white;
  border-bottom: 1px solid var(--color-gray-200);
}

.page-main {
  padding: var(--space-6) 0;
}

.page-footer {
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
}

/* 🎨 侧边栏布局 */
.sidebar-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-6);
}

.sidebar {
  position: sticky;
  top: var(--space-6);
  height: fit-content;
}

.sidebar-content {
  padding: var(--space-6);
  background: white;
  border-radius: 12px;
  border: 1px solid var(--color-gray-200);
}

/* 🎨 响应式工具 */
@media (max-width: 768px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .hidden-mobile { display: none; }
  .flex-mobile-col { flex-direction: column; }
  .grid-mobile-1 { grid-template-columns: 1fr; }
}

/* 🎨 完整间距系统 - 基于4px网格 */
:root {
  --space-0: 0;
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-5: 1.25rem;    /* 20px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */
  --space-32: 8rem;      /* 128px */

  /* 负间距 */
  --space-neg-1: -0.25rem;
  --space-neg-2: -0.5rem;
  --space-neg-4: -1rem;
}

/* 🎨 间距实用类 */
.m-1 { margin: var(--space-1); }
.m-2 { margin: var(--space-2); }
.m-3 { margin: var(--space-3); }
.m-4 { margin: var(--space-4); }
.m-6 { margin: var(--space-6); }
.m-8 { margin: var(--space-8); }

.p-1 { padding: var(--space-1); }
.p-2 { padding: var(--space-2); }
.p-3 { padding: var(--space-3); }
.p-4 { padding: var(--space-4); }
.p-6 { padding: var(--space-6); }
.p-8 { padding: var(--space-8); }

.mx-auto { margin-left: auto; margin-right: auto; }
.my-auto { margin-top: auto; margin-bottom: auto; }

.px-1 { padding-left: var(--space-1); padding-right: var(--space-1); }
.px-2 { padding-left: var(--space-2); padding-right: var(--space-2); }
.px-3 { padding-left: var(--space-3); padding-right: var(--space-3); }
.px-4 { padding-left: var(--space-4); padding-right: var(--space-4); }
.px-6 { padding-left: var(--space-6); padding-right: var(--space-6); }

.py-1 { padding-top: var(--space-1); padding-bottom: var(--space-1); }
.py-2 { padding-top: var(--space-2); padding-bottom: var(--space-2); }
.py-3 { padding-top: var(--space-3); padding-bottom: var(--space-3); }
.py-4 { padding-top: var(--space-4); padding-bottom: var(--space-4); }
.py-6 { padding-top: var(--space-6); padding-bottom: var(--space-6); }

/* 🎨 容器和布局间距 */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

.section-spacing {
  padding-top: var(--space-12);
  padding-bottom: var(--space-12);
}

.card-spacing {
  padding: var(--space-6);
}

.stack-sm > * + * { margin-top: var(--space-2); }
.stack-md > * + * { margin-top: var(--space-4); }
.stack-lg > * + * { margin-top: var(--space-6); }
.stack-xl > * + * { margin-top: var(--space-8); }

.inline-sm > * + * { margin-left: var(--space-2); }
.inline-md > * + * { margin-left: var(--space-4); }
.inline-lg > * + * { margin-left: var(--space-6); }

/* 🎨 完整字体系统 */
:root {
  /* 字体族 */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;

  /* 字体大小 - 基于1.25的倍数比例 */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
  --font-size-5xl: 3rem;      /* 48px */

  /* 字体权重 */
  --font-weight-thin: 100;
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  /* 行高 */
  --line-height-tight: 1.25;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  --line-height-loose: 2;

  /* 字母间距 */
  --letter-spacing-tighter: -0.05em;
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;
  --letter-spacing-wider: 0.05em;
  --letter-spacing-widest: 0.1em;
}

/* 🎨 字体实用类 */
.font-sans { font-family: var(--font-family-sans); }
.font-mono { font-family: var(--font-family-mono); }

.text-xs { font-size: var(--font-size-xs); line-height: var(--line-height-tight); }
.text-sm { font-size: var(--font-size-sm); line-height: var(--line-height-snug); }
.text-base { font-size: var(--font-size-base); line-height: var(--line-height-normal); }
.text-lg { font-size: var(--font-size-lg); line-height: var(--line-height-relaxed); }
.text-xl { font-size: var(--font-size-xl); line-height: var(--line-height-relaxed); }
.text-2xl { font-size: var(--font-size-2xl); line-height: var(--line-height-loose); }
.text-3xl { font-size: var(--font-size-3xl); line-height: var(--line-height-loose); }

.font-thin { font-weight: var(--font-weight-thin); }
.font-light { font-weight: var(--font-weight-light); }
.font-normal { font-weight: var(--font-weight-normal); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }

.leading-tight { line-height: var(--line-height-tight); }
.leading-snug { line-height: var(--line-height-snug); }
.leading-normal { line-height: var(--line-height-normal); }
.leading-relaxed { line-height: var(--line-height-relaxed); }

.tracking-tight { letter-spacing: var(--letter-spacing-tight); }
.tracking-normal { letter-spacing: var(--letter-spacing-normal); }
.tracking-wide { letter-spacing: var(--letter-spacing-wide); }

/* 🎨 文本层次优化 */
.heading-1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tighter);
  margin-bottom: 1rem;
}

.heading-2 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tighter);
  margin-bottom: 0.875rem;
}

.heading-3 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-tight);
  margin-bottom: 0.75rem;
}

.body-large {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  letter-spacing: var(--letter-spacing-normal);
}

.body-regular {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-normal);
}

.body-small {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-wide);
}

.caption {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-wide);
  color: var(--color-gray-600);
}

/* 🎨 高级色彩系统 */
:root {
  /* 基础色彩 */
  --color-primary: hsl(221 83% 53%);
  --color-primary-hover: hsl(221 83% 48%);
  --color-primary-active: hsl(221 83% 43%);

  /* 语义色彩 */
  --color-success: hsl(142 71% 45%);
  --color-warning: hsl(38 92% 50%);
  --color-error: hsl(0 84% 60%);
  --color-info: hsl(217 91% 60%);

  /* 中性色彩 */
  --color-gray-50: hsl(210 20% 98%);
  --color-gray-100: hsl(210 15% 95%);
  --color-gray-200: hsl(210 10% 89%);
  --color-gray-300: hsl(210 8% 75%);
  --color-gray-400: hsl(210 8% 56%);
  --color-gray-500: hsl(210 6% 43%);
  --color-gray-600: hsl(210 8% 35%);
  --color-gray-700: hsl(210 10% 28%);
  --color-gray-800: hsl(210 12% 21%);
  --color-gray-900: hsl(210 15% 15%);

  /* 透明度变体 */
  --color-primary-10: hsl(221 83% 53% / 0.1);
  --color-primary-20: hsl(221 83% 53% / 0.2);
  --color-primary-30: hsl(221 83% 53% / 0.3);
  --color-success-10: hsl(142 71% 45% / 0.1);
  --color-error-10: hsl(0 84% 60% / 0.1);
}

/* 🎨 色彩实用类 */
.text-primary { color: var(--color-primary); }
.text-success { color: var(--color-success); }
.text-warning { color: var(--color-warning); }
.text-error { color: var(--color-error); }
.text-gray-500 { color: var(--color-gray-500); }
.text-gray-600 { color: var(--color-gray-600); }
.text-gray-700 { color: var(--color-gray-700); }

.bg-primary { background-color: var(--color-primary); }
.bg-primary-hover:hover { background-color: var(--color-primary-hover); }
.bg-success { background-color: var(--color-success); }
.bg-warning { background-color: var(--color-warning); }
.bg-error { background-color: var(--color-error); }

.border-primary { border-color: var(--color-primary); }
.border-success { border-color: var(--color-success); }
.border-error { border-color: var(--color-error); }

/* 🎨 对比度增强 */
.high-contrast {
  --color-primary: hsl(221 100% 40%);
  --color-gray-900: hsl(210 20% 10%);
  --color-gray-100: hsl(210 15% 95%);
}

/* 🎨 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  :root {
    --color-gray-50: hsl(210 15% 15%);
    --color-gray-100: hsl(210 12% 21%);
    --color-gray-200: hsl(210 10% 28%);
    --color-gray-300: hsl(210 8% 35%);
    --color-gray-400: hsl(210 6% 43%);
    --color-gray-500: hsl(210 8% 56%);
    --color-gray-600: hsl(210 8% 75%);
    --color-gray-700: hsl(210 10% 89%);
    --color-gray-800: hsl(210 15% 95%);
    --color-gray-900: hsl(210 20% 98%);
  }
}
.plugin-changelog {
  @apply space-y-6;
}

/* Loading & Empty States */
.loading-state {
  @apply flex flex-col items-center justify-center py-8;
}

.loading-spinner {
  @apply w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin mb-2;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.empty-icon {
  @apply text-muted-foreground mb-4;
}

.empty-state h3 {
  @apply text-lg font-semibold mb-2;
}

.empty-state p {
  @apply text-muted-foreground;
}

/* Changelog Container */
.changelog-container {
  @apply space-y-6;
}

/* Version Item */
.version-item {
  @apply border border-border rounded-lg overflow-hidden;
}

.version-header {
  @apply flex items-start justify-between p-4 bg-muted/30 border-b border-border;
}

.version-info {
  @apply flex items-center gap-3;
}

.version-number {
  @apply text-lg font-semibold;
}

.latest-badge {
  @apply px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium;
}

.version-type {
  @apply px-2 py-1 text-xs rounded-full font-medium;
}

.version-type.major {
  @apply bg-red-100 text-red-700;
}

.version-type.minor {
  @apply bg-blue-100 text-blue-700;
}

.version-type.patch {
  @apply bg-gray-100 text-gray-700;
}

.version-type.beta {
  @apply bg-yellow-100 text-yellow-700;
}

.version-type.alpha {
  @apply bg-purple-100 text-purple-700;
}

.version-meta {
  @apply flex items-center gap-3 text-sm text-muted-foreground;
}

.version-content {
  @apply p-4 space-y-4;
}

.version-summary {
  @apply text-sm text-muted-foreground italic border-l-4 border-primary pl-4;
}

/* Changes Section */
.changes-section {
  @apply space-y-4;
}

.change-group {
  @apply space-y-2;
}

.change-title {
  @apply flex items-center gap-2 text-sm font-medium;
}

.change-icon {
  @apply flex-shrink-0;
}

.change-icon.features {
  @apply text-green-600;
}

.change-icon.improvements {
  @apply text-blue-600;
}

.change-icon.fixes {
  @apply text-orange-600;
}

.change-icon.breaking {
  @apply text-red-600;
}

.change-icon.security {
  @apply text-purple-600;
}

.change-list {
  @apply ml-6 space-y-1 text-sm;
}

.change-list li {
  @apply relative;
}

.change-list li:before {
  @apply content-["•"] absolute -left-4 text-muted-foreground;
}

/* Version Actions */
.version-actions {
  @apply flex items-center gap-2 pt-4 border-t border-border;
}

.action-btn {
  @apply inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors;
}

.action-btn.secondary {
  @apply border border-border hover:bg-accent;
}

/* Dark mode adjustments */
.dark .latest-badge {
  @apply bg-green-900/50 text-green-400;
}

.dark .version-type.major {
  @apply bg-red-900/50 text-red-400;
}

.dark .version-type.minor {
  @apply bg-blue-900/50 text-blue-400;
}

.dark .version-type.patch {
  @apply bg-gray-800 text-gray-300;
}

.dark .version-type.beta {
  @apply bg-yellow-900/50 text-yellow-400;
}

.dark .version-type.alpha {
  @apply bg-purple-900/50 text-purple-400;
}


/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 焦点样式 */
:focus-visible {
  outline: 2px solid hsl(var(--ring, 59 130 230));
  outline-offset: 2px;
}

/* 🎨 微交互和动画 */
.btn-primary {
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
}

.btn-primary:active::before {
  width: 300px;
  height: 300px;
}

/* 悬停效果 */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 加载动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid hsl(var(--border));
  border-top: 2px solid hsl(var(--primary));
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 淡入动画 */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fade-in 0.3s ease-out;
}

/* 成功状态动画 */
@keyframes success-bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

.success-animation {
  animation: success-bounce 1s ease;
}</style>
