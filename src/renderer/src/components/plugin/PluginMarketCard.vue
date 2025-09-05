<template>
  <div
    :class="[
      'plugin-card',
      viewMode === 'list' ? 'list-card' : 'grid-card',
      { installing: plugin.status === 'updating' }
    ]"
    @click="$emit('click')"
  >
    <!-- Grid View -->
    <template v-if="viewMode === 'grid'">
      <!-- Plugin Header -->
      <div class="card-header">
        <div class="plugin-icon-container">
          <img v-if="plugin.icon" :src="plugin.icon" :alt="plugin.name" class="plugin-icon" />
          <Package v-else :size="32" class="plugin-icon-default" />
        </div>

        <div class="plugin-badges">
          <span v-if="plugin.verified" class="badge verified" title="认证插件">
            <Shield :size="12" />
          </span>
          <span v-if="plugin.featured" class="badge featured" title="推荐插件">
            <Sparkles :size="12" />
          </span>
          <span v-if="plugin.pricing === 'paid'" class="badge paid" title="付费插件">
            <DollarSign :size="12" />
          </span>
        </div>
      </div>

      <!-- Plugin Info -->
      <div class="card-content">
        <h3 class="plugin-name" :title="plugin.name">{{ plugin.name }}</h3>
        <p class="plugin-author">by {{ plugin.author }}</p>
        <p class="plugin-description">{{ plugin.shortDescription || plugin.description }}</p>

        <!-- Stats -->
        <div class="plugin-stats">
          <div class="stat-item">
            <Star :size="14" class="star-icon" />
            <span class="stat-value">{{ plugin.rating.toFixed(1) }}</span>
            <span class="stat-label">({{ formatNumber(plugin.reviewCount) }})</span>
          </div>
          <div class="stat-item">
            <Download :size="14" />
            <span class="stat-value">{{ formatNumber(plugin.downloads) }}</span>
          </div>
        </div>

        <!-- Tags -->
        <div class="plugin-tags">
          <span v-for="tag in plugin.tags.slice(0, 3)" :key="tag" class="tag">
            {{ tag }}
          </span>
          <span v-if="plugin.tags.length > 3" class="tag-more">
            +{{ plugin.tags.length - 3 }}
          </span>
        </div>
      </div>

      <!-- Card Actions -->
      <div class="card-actions">
        <template v-if="plugin.status === 'installed'">
          <button
            @click.stop="$emit('uninstall', plugin)"
            class="action-btn uninstall"
            aria-label="按钮"
          >
            <Trash2 :size="16" />
            卸载
          </button>
        </template>
        <template v-else-if="plugin.status === 'updating'">
          <button class="action-btn updating" disabled>
            <Loader2 :size="16" class="animate-spin" />
            安装中...
          </button>
        </template>
        <template v-else>
          <button @click.stop="$emit('install', plugin)" class="action-btn install">
            <Download :size="16" />
            安装
          </button>
        </template>

        <button @click.stop="$emit('rate', plugin)" class="action-btn-secondary rate">
          <Star :size="16" />
        </button>
      </div>
    </template>

    <!-- List View -->
    <template v-else>
      <div class="list-content">
        <!-- Left Side -->
        <div class="list-left">
          <div class="plugin-icon-container">
            <img v-if="plugin.icon" :src="plugin.icon" :alt="plugin.name" class="plugin-icon" />
            <Package v-else :size="40" class="plugin-icon-default" />
          </div>

          <div class="plugin-info">
            <div class="info-header">
              <h3 class="plugin-name">{{ plugin.name }}</h3>
              <div class="plugin-badges">
                <span v-if="plugin.verified" class="badge verified">
                  <Shield :size="12" />
                </span>
                <span v-if="plugin.featured" class="badge featured">
                  <Sparkles :size="12" />
                </span>
                <span v-if="plugin.pricing === 'paid'" class="badge paid">
                  <DollarSign :size="12" />
                </span>
              </div>
            </div>

            <p class="plugin-author">by {{ plugin.author }}</p>
            <p class="plugin-description">{{ plugin.description }}</p>

            <div class="plugin-meta">
              <span class="version">v{{ plugin.version }}</span>
              <span class="separator">•</span>
              <span class="category">{{ plugin.category.name }}</span>
              <span class="separator">•</span>
              <span class="updated">{{ formatDate(plugin.lastUpdated) }}</span>
            </div>
          </div>
        </div>

        <!-- Right Side -->
        <div class="list-right">
          <div class="plugin-stats-horizontal">
            <div class="stat-item">
              <Star :size="16" class="star-icon" />
              <span class="stat-value">{{ plugin.rating.toFixed(1) }}</span>
              <span class="stat-label">({{ formatNumber(plugin.reviewCount) }})</span>
            </div>
            <div class="stat-item">
              <Download :size="16" />
              <span class="stat-value">{{ formatNumber(plugin.downloads) }}</span>
            </div>
          </div>

          <div class="list-actions">
            <template v-if="plugin.status === 'installed'">
              <button @click.stop="$emit('uninstall', plugin)" class="action-btn uninstall">
                <Trash2 :size="16" />
                卸载
              </button>
            </template>
            <template v-else-if="plugin.status === 'updating'">
              <button class="action-btn updating" disabled>
                <Loader2 :size="16" class="animate-spin" />
                安装中...
              </button>
            </template>
            <template v-else>
              <button @click.stop="$emit('install', plugin)" class="action-btn install">
                <Download :size="16" />
                安装
              </button>
            </template>

            <button @click.stop="$emit('rate', plugin)" class="action-btn-secondary rate">
              <Star :size="16" />
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Installing Overlay -->
    <div v-if="plugin.status === 'updating'" class="installing-overlay">
      <div class="installing-content">
        <Loader2 :size="24" class="animate-spin" />
        <span>正在安装...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Package,
  Shield,
  Sparkles,
  DollarSign,
  Star,
  Download,
  Trash2,
  Loader2
} from 'lucide-vue-next'

import type { PluginMarketListing } from '../../types/plugins'

interface Props {
  plugin: PluginMarketListing
  viewMode: 'grid' | 'list'
}

defineProps<Props>()

defineEmits<{
  click: []
  install: [plugin: PluginMarketListing]
  uninstall: [plugin: PluginMarketListing]
  rate: [plugin: PluginMarketListing]
}>()

// Utility functions
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`
  return `${Math.floor(diffDays / 365)}年前`
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
.container-sm {
  max-width: var(--breakpoint-sm);
}
.container-md {
  max-width: var(--breakpoint-md);
}
.container-lg {
  max-width: var(--breakpoint-lg);
}
.container-xl {
  max-width: var(--breakpoint-xl);
}

/* 响应式显示 */
.hidden-sm {
  display: none;
}
.hidden-md {
  display: none;
}
.hidden-lg {
  display: none;
}

@media (min-width: 640px) {
  .hidden-sm {
    display: block;
  }
}

@media (min-width: 768px) {
  .hidden-md {
    display: block;
  }
}

@media (min-width: 1024px) {
  .hidden-lg {
    display: block;
  }
}

/* 响应式文本 */
.text-responsive-sm {
  font-size: clamp(0.875rem, 2vw, 1rem);
}
.text-responsive-base {
  font-size: clamp(1rem, 2.5vw, 1.125rem);
}
.text-responsive-lg {
  font-size: clamp(1.125rem, 3vw, 1.25rem);
}
.text-responsive-xl {
  font-size: clamp(1.25rem, 3.5vw, 1.5rem);
}

/* 响应式间距 */
.space-responsive-sm {
  gap: clamp(0.5rem, 2vw, 1rem);
}
.space-responsive-md {
  gap: clamp(1rem, 3vw, 1.5rem);
}
.space-responsive-lg {
  gap: clamp(1.5rem, 4vw, 2rem);
}

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
  .flex-col-mobile {
    flex-direction: column;
  }
  .grid-1-mobile {
    grid-template-columns: 1fr;
  }
  .gap-2-mobile {
    gap: var(--space-2);
  }
  .p-4-mobile {
    padding: var(--space-4);
  }
}

@media (max-width: 768px) {
  .flex-col-tablet {
    flex-direction: column;
  }
  .grid-2-tablet {
    grid-template-columns: repeat(2, 1fr);
  }
  .gap-4-tablet {
    gap: var(--space-4);
  }
  .p-6-tablet {
    padding: var(--space-6);
  }
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

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}
.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}
.grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

.grid-gap-2 {
  gap: var(--space-2);
}
.grid-gap-4 {
  gap: var(--space-4);
}
.grid-gap-6 {
  gap: var(--space-6);
}

/* 🎨 卡片布局 */
.card {
  background: white;
  border-radius: 12px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.card:hover {
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.card-interactive:hover {
  cursor: pointer;
  transform: translateY(-2px);
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.15),
    0 4px 10px rgba(0, 0, 0, 0.1);
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

  .hidden-mobile {
    display: none;
  }
  .flex-mobile-col {
    flex-direction: column;
  }
  .grid-mobile-1 {
    grid-template-columns: 1fr;
  }
}

/* 🎨 完整间距系统 - 基于4px网格 */
:root {
  --space-0: 0;
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --space-20: 5rem; /* 80px */
  --space-24: 6rem; /* 96px */
  --space-32: 8rem; /* 128px */

  /* 负间距 */
  --space-neg-1: -0.25rem;
  --space-neg-2: -0.5rem;
  --space-neg-4: -1rem;
}

/* 🎨 间距实用类 */
.m-1 {
  margin: var(--space-1);
}
.m-2 {
  margin: var(--space-2);
}
.m-3 {
  margin: var(--space-3);
}
.m-4 {
  margin: var(--space-4);
}
.m-6 {
  margin: var(--space-6);
}
.m-8 {
  margin: var(--space-8);
}

.p-1 {
  padding: var(--space-1);
}
.p-2 {
  padding: var(--space-2);
}
.p-3 {
  padding: var(--space-3);
}
.p-4 {
  padding: var(--space-4);
}
.p-6 {
  padding: var(--space-6);
}
.p-8 {
  padding: var(--space-8);
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.my-auto {
  margin-top: auto;
  margin-bottom: auto;
}

.px-1 {
  padding-left: var(--space-1);
  padding-right: var(--space-1);
}
.px-2 {
  padding-left: var(--space-2);
  padding-right: var(--space-2);
}
.px-3 {
  padding-left: var(--space-3);
  padding-right: var(--space-3);
}
.px-4 {
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}
.px-6 {
  padding-left: var(--space-6);
  padding-right: var(--space-6);
}

.py-1 {
  padding-top: var(--space-1);
  padding-bottom: var(--space-1);
}
.py-2 {
  padding-top: var(--space-2);
  padding-bottom: var(--space-2);
}
.py-3 {
  padding-top: var(--space-3);
  padding-bottom: var(--space-3);
}
.py-4 {
  padding-top: var(--space-4);
  padding-bottom: var(--space-4);
}
.py-6 {
  padding-top: var(--space-6);
  padding-bottom: var(--space-6);
}

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

.stack-sm > * + * {
  margin-top: var(--space-2);
}
.stack-md > * + * {
  margin-top: var(--space-4);
}
.stack-lg > * + * {
  margin-top: var(--space-6);
}
.stack-xl > * + * {
  margin-top: var(--space-8);
}

.inline-sm > * + * {
  margin-left: var(--space-2);
}
.inline-md > * + * {
  margin-left: var(--space-4);
}
.inline-lg > * + * {
  margin-left: var(--space-6);
}

/* 🎨 完整字体系统 */
:root {
  /* 字体族 */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;

  /* 字体大小 - 基于1.25的倍数比例 */
  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-base: 1rem; /* 16px */
  --font-size-lg: 1.125rem; /* 18px */
  --font-size-xl: 1.25rem; /* 20px */
  --font-size-2xl: 1.5rem; /* 24px */
  --font-size-3xl: 1.875rem; /* 30px */
  --font-size-4xl: 2.25rem; /* 36px */
  --font-size-5xl: 3rem; /* 48px */

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
.font-sans {
  font-family: var(--font-family-sans);
}
.font-mono {
  font-family: var(--font-family-mono);
}

.text-xs {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-tight);
}
.text-sm {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-snug);
}
.text-base {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
}
.text-lg {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
}
.text-xl {
  font-size: var(--font-size-xl);
  line-height: var(--line-height-relaxed);
}
.text-2xl {
  font-size: var(--font-size-2xl);
  line-height: var(--line-height-loose);
}
.text-3xl {
  font-size: var(--font-size-3xl);
  line-height: var(--line-height-loose);
}

.font-thin {
  font-weight: var(--font-weight-thin);
}
.font-light {
  font-weight: var(--font-weight-light);
}
.font-normal {
  font-weight: var(--font-weight-normal);
}
.font-medium {
  font-weight: var(--font-weight-medium);
}
.font-semibold {
  font-weight: var(--font-weight-semibold);
}
.font-bold {
  font-weight: var(--font-weight-bold);
}

.leading-tight {
  line-height: var(--line-height-tight);
}
.leading-snug {
  line-height: var(--line-height-snug);
}
.leading-normal {
  line-height: var(--line-height-normal);
}
.leading-relaxed {
  line-height: var(--line-height-relaxed);
}

.tracking-tight {
  letter-spacing: var(--letter-spacing-tight);
}
.tracking-normal {
  letter-spacing: var(--letter-spacing-normal);
}
.tracking-wide {
  letter-spacing: var(--letter-spacing-wide);
}

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
.text-primary {
  color: var(--color-primary);
}
.text-success {
  color: var(--color-success);
}
.text-warning {
  color: var(--color-warning);
}
.text-error {
  color: var(--color-error);
}
.text-gray-500 {
  color: var(--color-gray-500);
}
.text-gray-600 {
  color: var(--color-gray-600);
}
.text-gray-700 {
  color: var(--color-gray-700);
}

.bg-primary {
  background-color: var(--color-primary);
}
.bg-primary-hover:hover {
  background-color: var(--color-primary-hover);
}
.bg-success {
  background-color: var(--color-success);
}
.bg-warning {
  background-color: var(--color-warning);
}
.bg-error {
  background-color: var(--color-error);
}

.border-primary {
  border-color: var(--color-primary);
}
.border-success {
  border-color: var(--color-success);
}
.border-error {
  border-color: var(--color-error);
}

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
.plugin-card {
  @apply relative bg-card border border-border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary;
}

.plugin-card.installing {
  @apply pointer-events-none;
}

/* Grid View Styles */
.grid-card {
  @apply flex flex-col;
}

.card-header {
  @apply flex items-start justify-between p-4 pb-2;
}

.plugin-icon-container {
  @apply w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden;
}

.plugin-icon {
  @apply w-full h-full object-cover;
}

.plugin-icon-default {
  @apply text-muted-foreground;
}

.plugin-badges {
  @apply flex gap-1;
}

.badge {
  @apply inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium;
}

.badge.verified {
  @apply bg-green-100 text-green-700;
}

.badge.featured {
  @apply bg-yellow-100 text-yellow-700;
}

.badge.paid {
  @apply bg-blue-100 text-blue-700;
}

.card-content {
  @apply flex-1 px-4 pb-4;
}

.plugin-name {
  @apply font-semibold text-foreground mb-1 truncate;
}

.plugin-author {
  @apply text-sm text-muted-foreground mb-2;
}

.plugin-description {
  @apply text-sm text-muted-foreground mb-3 line-clamp-2;
}

.plugin-stats {
  @apply flex items-center gap-4 mb-3 text-sm;
}

.stat-item {
  @apply flex items-center gap-1 text-muted-foreground;
}

.star-icon {
  @apply text-yellow-500;
}

.stat-value {
  @apply font-medium text-foreground;
}

.stat-label {
  @apply text-muted-foreground;
}

.plugin-tags {
  @apply flex flex-wrap gap-1 mb-3;
}

.tag {
  @apply px-2 py-1 bg-muted text-xs rounded;
}

.tag-more {
  @apply px-2 py-1 bg-muted/50 text-xs rounded text-muted-foreground;
}

.card-actions {
  @apply flex gap-2 p-4 pt-0;
}

.action-btn {
  @apply flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors;
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

.action-btn-secondary {
  @apply inline-flex items-center justify-center px-2 py-2 border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors;
}

/* List View Styles */
.list-card {
  @apply p-4;
}

.list-content {
  @apply flex items-center justify-between gap-4;
}

.list-left {
  @apply flex items-center gap-4 flex-1 min-w-0;
}

.list-left .plugin-icon-container {
  @apply w-16 h-16;
}

.plugin-info {
  @apply flex-1 min-w-0;
}

.info-header {
  @apply flex items-center gap-2 mb-1;
}

.list-left .plugin-name {
  @apply text-lg;
}

.plugin-meta {
  @apply flex items-center gap-2 text-sm text-muted-foreground mt-2;
}

.separator {
  @apply text-muted-foreground/50;
}

.list-right {
  @apply flex items-center gap-4;
}

.plugin-stats-horizontal {
  @apply flex items-center gap-4;
}

.list-actions {
  @apply flex gap-2;
}

.list-actions .action-btn {
  @apply flex-none px-4;
}

/* Installing Overlay */
.installing-overlay {
  @apply absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center;
}

.installing-content {
  @apply flex items-center gap-2 text-sm font-medium;
}

/* Dark mode adjustments */
.dark .badge.verified {
  @apply bg-green-900/50 text-green-400;
}

.dark .badge.featured {
  @apply bg-yellow-900/50 text-yellow-400;
}

.dark .badge.paid {
  @apply bg-blue-900/50 text-blue-400;
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
  transition:
    width 0.3s ease,
    height 0.3s ease;
}

.btn-primary:active::before {
  width: 300px;
  height: 300px;
}

/* 悬停效果 */
.hover-lift {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 加载动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fade-in 0.3s ease-out;
}

/* 成功状态动画 */
@keyframes success-bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.success-animation {
  animation: success-bounce 1s ease;
}
</style>
