<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <dialog class="modal-container">
        <!-- Modal Header -->
        <dialog class="modal-header">
          <div class="header-left">
            <div class="plugin-icon-large">
              <img v-if="plugin.icon" :src="plugin.icon" :alt="plugin.name" class="icon-image" />
              <Package v-else :size="48" class="icon-default" />
            </div>

            <div class="plugin-title-info">
              <div class="title-row">
                <h1 class="plugin-title">{{ plugin.name }}</h1>
                <div class="plugin-badges">
                  <span v-if="plugin.verified" class="badge verified">
                    <Shield :size="14" />
                    认证
                  </span>
                  <span v-if="plugin.featured" class="badge featured">
                    <Sparkles :size="14" />
                    推荐
                  </span>
                </div>
              </div>

              <div class="plugin-meta">
                <span class="author">by {{ plugin.author }}</span>
                <span class="separator">•</span>
                <span class="version">v{{ plugin.version }}</span>
                <span class="separator">•</span>
                <span class="category">{{ plugin.category.name }}</span>
              </div>

              <div class="plugin-stats">
                <div class="stat-item">
                  <Star :size="16" class="star-icon" />
                  <span class="rating">{{ plugin.rating.toFixed(1) }}</span>
                  <span class="reviews">({{ formatNumber(plugin.reviewCount) }} 评价)</span>
                </div>
                <div class="stat-item">
                  <Download :size="16" />
                  <span>{{ formatNumber(plugin.downloads) }} 下载</span>
                </div>
                <div class="stat-item">
                  <Calendar :size="16" />
                  <span>更新于 {{ formatDate(plugin.lastUpdated) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="header-actions">
            <button @click="$emit('close')" class="close-btn" aria-label="按钮">
              <X :size="24" />
            </button>
          </div>
        </div>

        <!-- Modal Content -->
        <dialog class="modal-content">
          <!-- Main Actions -->
          <div class="action-section">
            <template v-if="plugin.status === 'installed'">
              <button @click="$emit('uninstall', plugin)" class="action-btn uninstall" aria-label="按钮">
                <Trash2 :size="20" />
                卸载插件
              </button>
              <button class="action-btn secondary" aria-label="按钮">
                <Settings :size="20" />
                设置
              </button>
            </template>
            <template v-else-if="plugin.status === 'updating'">
              <button class="action-btn updating" disabled>
                <Loader2 :size="20" class="animate-spin" />
                安装中...
              </button>
            </template>
            <template v-else>
              <button @click="$emit('install', plugin)" class="action-btn install">
                <Download :size="20" />
                安装插件
              </button>
            </template>

            <button @click="$emit('rate', plugin)" class="action-btn secondary">
              <Star :size="20" />
              评价
            </button>

            <div class="pricing-info" v-if="plugin.pricing === 'paid'">
              <span class="price">${{ plugin.price }}</span>
              <span class="currency">{{ plugin.currency?.toUpperCase() }}</span>
            </div>
          </div>

          <!-- Tab Navigation -->
          <div class="tab-nav">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="['tab-btn', { active: activeTab === tab.id }]"
            >
              <component :is="tab.icon" :size="16" />
              {{ tab.label }}
            </button>
          </div>

          <!-- Tab Content -->
          <div class="tab-content">
            <!-- Overview Tab -->
            <div v-show="activeTab === 'overview'" class="tab-pane overview">
              <div class="content-grid">
                <div class="main-content">
                  <!-- Screenshots -->
                  <div v-if="plugin.screenshots?.length" class="screenshots">
                    <h3 class="section-title">截图</h3>
                    <div class="screenshot-gallery">
                      <div
                        v-for="(screenshot, index) in plugin.screenshots"
                        :key="index"
                        class="screenshot-item"
                        @click="openScreenshot(index)"
                      >
                        <img :src="screenshot" :alt="`Screenshot ${index + 1}`" />
                      </div>
                    </div>
                  </div>

                  <!-- Description -->
                  <div class="description">
                    <h3 class="section-title">插件介绍</h3>
                    <div
                      class="description-content"
                      v-html="formatDescription(plugin.description)"
                    />
                  </div>

                  <!-- Features -->
                  <div class="features" v-if="pluginFeatures.length">
                    <h3 class="section-title">主要功能</h3>
                    <ul class="features-list">
                      <li v-for="feature in pluginFeatures" :key="feature">
                        <Check :size="16" />
                        {{ feature }}
                      </li>
                    </ul>
                  </div>

                  <!-- What's New -->
                  <div class="whats-new" v-if="changeLog.length">
                    <h3 class="section-title">版本更新</h3>
                    <div class="changelog">
                      <div
                        v-for="change in changeLog.slice(0, 3)"
                        :key="change.version"
                        class="changelog-item"
                      >
                        <div class="changelog-header">
                          <span class="version">v{{ change.version }}</span>
                          <span class="date">{{ formatDate(change.date) }}</span>
                        </div>
                        <ul class="changelog-changes">
                          <li v-for="item in change.changes" :key="item">{{ item }}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="sidebar-content">
                  <!-- Quick Info -->
                  <div class="info-card">
                    <h4 class="info-title">插件信息</h4>
                    <dl class="info-list">
                      <dt>作者</dt>
                      <dd>
                        <button class="author-link" @click="viewAuthor">
                          {{ plugin.author }}
                        </button>
                      </dd>
                      <dt>版本</dt>
                      <dd>{{ plugin.version }}</dd>
                      <dt>大小</dt>
                      <dd>2.1 MB</dd>
                      <dt>支持平台</dt>
                      <dd>
                        <div class="platforms">
                          <span
                            v-for="platform in plugin.platforms"
                            :key="platform"
                            class="platform-badge"
                          >
                            {{ getPlatformLabel(platform) }}
                          </span>
                        </div>
                      </dd>
                      <dt>权限</dt>
                      <dd>
                        <button class="permissions-link" @click="showPermissions = true">
                          查看权限
                        </button>
                      </dd>
                    </dl>
                  </div>

                  <!-- Tags -->
                  <div class="info-card">
                    <h4 class="info-title">标签</h4>
                    <div class="tags-container">
                      <span v-for="tag in plugin.tags" :key="tag" class="tag-item">
                        {{ tag }}
                      </span>
                    </div>
                  </div>

                  <!-- Links -->
                  <div class="info-card" v-if="plugin.homepage || plugin.repository">
                    <h4 class="info-title">链接</h4>
                    <div class="links-list">
                      <a
                        v-if="plugin.homepage"
                        :href="plugin.homepage"
                        target="_blank"
                        class="link-item"
                      >
                        <ExternalLink :size="16" />
                        主页
                      </a>
                      <a
                        v-if="plugin.repository"
                        :href="plugin.repository"
                        target="_blank"
                        class="link-item"
                      >
                        <Github :size="16" />
                        源代码
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Reviews Tab -->
            <div v-show="activeTab === 'reviews'" class="tab-pane reviews">
              <PluginReviews :plugin="plugin" />
            </div>

            <!-- Changelog Tab -->
            <div v-show="activeTab === 'changelog'" class="tab-pane changelog">
              <PluginChangelog :plugin="plugin" />
            </div>

            <!-- Related Tab -->
            <div v-show="activeTab === 'related'" class="tab-pane related">
              <PluginRelated :plugin="plugin" />
            </div>
          </div>
        </div>

        <!-- Permissions Modal -->
        <PluginPermissionsModal
          v-if="showPermissions"
          :plugin="plugin"
          :show="showPermissions"
          @close="showPermissions = false"
        />

        <!-- Screenshot Viewer -->
        <ScreenshotViewer
          v-if="screenshotIndex !== -1"
          :screenshots="plugin.screenshots || []"
          :initial-index="screenshotIndex"
          @close="screenshotIndex = -1"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Package,
  Shield,
  Sparkles,
  Star,
  Download,
  Calendar,
  X,
  Trash2,
  Loader2,
  Settings,
  Check,
  ExternalLink,
  Github,
  FileText,
  MessageCircle,
  Clock,
  Grid
} from 'lucide-vue-next'

import PluginReviews from './PluginReviews.vue'
import PluginChangelog from './PluginChangelog.vue'
import PluginRelated from './PluginRelated.vue'
import PluginPermissionsModal from './PluginPermissionsModal.vue'
import ScreenshotViewer from './ScreenshotViewer.vue'

import type { PluginMarketListing } from '../../types/plugins'

interface Props {
  plugin: PluginMarketListing
  show: boolean
}

defineProps<Props>()

defineEmits<{
  close: []
  install: [plugin: PluginMarketListing]
  uninstall: [plugin: PluginMarketListing]
  rate: [plugin: PluginMarketListing]
}>()

// State
const activeTab = ref('overview')
const showPermissions = ref(false)
const screenshotIndex = ref(-1)

// Tabs configuration
const tabs = [
  { id: 'overview', label: '概览', icon: FileText },
  { id: 'reviews', label: '评价', icon: MessageCircle },
  { id: 'changelog', label: '更新日志', icon: Clock },
  { id: 'related', label: '相关推荐', icon: Grid }
]

// Mock data - in real implementation, this would come from API
const pluginFeatures = computed(() => [
  '支持高级数学函数计算',
  '单位转换功能',
  '历史记录保存',
  '快捷键操作',
  '自定义主题'
])

const changeLog = computed(() => [
  {
    version: '2.1.0',
    date: '2024-01-15',
    changes: ['新增三角函数计算', '优化界面响应速度', '修复小数点精度问题']
  },
  {
    version: '2.0.5',
    date: '2024-01-01',
    changes: ['支持科学计数法', '添加历史记录功能']
  }
])

// Methods
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatDescription = (description: string): string => {
  // Convert markdown-like formatting to HTML
  return description
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

const getPlatformLabel = (platform: string): string => {
  const labels: Record<string, string> = {
    win: 'Windows',
    mac: 'macOS',
    linux: 'Linux'
  }
  return labels[platform] || platform
}

const viewAuthor = () => {
  // Navigate to author page
  console.log('View author:', plugin.value.author)
}

const openScreenshot = (index: number) => {
  screenshotIndex.value = index
}
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
.modal-overlay {
  @apply fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50;
}

.modal-container {
  @apply bg-background border border-border rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[90vh] overflow-hidden flex flex-col;
}

.modal-header {
  @apply flex items-start justify-between p-6 border-b border-border;
}

.header-left {
  @apply flex gap-4 flex-1 min-w-0;
}

.plugin-icon-large {
  @apply w-20 h-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0;
}

.icon-image {
  @apply w-full h-full object-cover;
}

.icon-default {
  @apply text-muted-foreground;
}

.plugin-title-info {
  @apply flex-1 min-w-0;
}

.title-row {
  @apply flex items-center gap-3 mb-2;
}

.plugin-title {
  @apply text-2xl font-bold text-foreground;
}

.plugin-badges {
  @apply flex gap-2;
}

.badge {
  @apply inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium;
}

.badge.verified {
  @apply bg-green-100 text-green-700;
}

.badge.featured {
  @apply bg-yellow-100 text-yellow-700;
}

.plugin-meta {
  @apply flex items-center gap-2 text-sm text-muted-foreground mb-3;
}

.separator {
  @apply text-muted-foreground/50;
}

.plugin-stats {
  @apply flex flex-wrap items-center gap-4 text-sm text-muted-foreground;
}

.stat-item {
  @apply flex items-center gap-1;
}

.star-icon {
  @apply text-yellow-500;
}

.rating {
  @apply text-foreground font-medium;
}

.header-actions {
  @apply flex items-start;
}

.close-btn {
  @apply p-2 hover:bg-accent rounded-lg transition-colors;
}

.modal-content {
  @apply flex-1 overflow-hidden flex flex-col;
}

.action-section {
  @apply flex items-center gap-3 p-6 border-b border-border;
}

.action-btn {
  @apply inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors;
}

.action-btn.install {
  @apply bg-primary text-primary-foreground hover:bg-primary/90;
}

.action-btn.uninstall {
  @apply bg-destructive text-destructive-foreground hover:bg-destructive/90;
}

.action-btn.updating {
  @apply bg-muted text-muted-foreground cursor-not-allowed;
}

.action-btn.secondary {
  @apply border border-border hover:bg-accent;
}

.pricing-info {
  @apply ml-auto flex items-baseline gap-1;
}

.price {
  @apply text-2xl font-bold text-primary;
}

.currency {
  @apply text-sm text-muted-foreground;
}

.tab-nav {
  @apply flex border-b border-border px-6;
}

.tab-btn {
  @apply inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-muted transition-colors;
}

.tab-btn.active {
  @apply text-primary border-primary;
}

.tab-content {
  @apply flex-1 overflow-y-auto;
}

.tab-pane {
  @apply p-6;
}

.content-grid {
  @apply grid grid-cols-1 lg:grid-cols-3 gap-6;
}

.main-content {
  @apply lg:col-span-2 space-y-6;
}

.sidebar-content {
  @apply space-y-4;
}

.section-title {
  @apply text-lg font-semibold mb-3;
}

.screenshots {
  @apply mb-6;
}

.screenshot-gallery {
  @apply grid grid-cols-2 md:grid-cols-3 gap-3;
}

.screenshot-item {
  @apply aspect-video rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all;
}

.screenshot-item img {
  @apply w-full h-full object-cover;
}

.description-content {
  @apply prose prose-sm max-w-none;
}

.features-list {
  @apply space-y-2;
}

.features-list li {
  @apply flex items-center gap-2 text-sm;
}

.features-list li svg {
  @apply text-green-500 flex-shrink-0;
}

.changelog {
  @apply space-y-4;
}

.changelog-item {
  @apply border border-border rounded-lg p-4;
}

.changelog-header {
  @apply flex items-center justify-between mb-2;
}

.version {
  @apply font-semibold text-primary;
}

.date {
  @apply text-sm text-muted-foreground;
}

.changelog-changes {
  @apply space-y-1 text-sm;
}

.changelog-changes li {
  @apply list-disc list-inside text-muted-foreground;
}

.info-card {
  @apply bg-muted/50 border border-border rounded-lg p-4;
}

.info-title {
  @apply font-semibold mb-3;
}

.info-list {
  @apply space-y-2;
}

.info-list dt {
  @apply text-sm font-medium text-muted-foreground;
}

.info-list dd {
  @apply text-sm mb-2;
}

.author-link,
.permissions-link {
  @apply text-primary hover:underline;
}

.platforms {
  @apply flex flex-wrap gap-1;
}

.platform-badge {
  @apply px-2 py-0.5 bg-background border border-border rounded text-xs;
}

.tags-container {
  @apply flex flex-wrap gap-1;
}

.tag-item {
  @apply px-2 py-1 bg-background border border-border rounded-md text-xs;
}

.links-list {
  @apply space-y-2;
}

.link-item {
  @apply flex items-center gap-2 text-sm text-primary hover:underline;
}

/* Dark mode adjustments */
.dark .badge.verified {
  @apply bg-green-900/50 text-green-400;
}

.dark .badge.featured {
  @apply bg-yellow-900/50 text-yellow-400;
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
