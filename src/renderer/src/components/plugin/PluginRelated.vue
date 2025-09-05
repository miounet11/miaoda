<template>
  <div class="plugin-related">
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <p>正在加载相关插件...</p>
    </div>

    <div v-else class="related-sections">
      <!-- Same Developer -->
      <div v-if="sameDeveloperPlugins.length" class="related-section">
        <h3 class="section-title">
          <User :size="18" />
          来自 {{ plugin.author }} 的更多插件
        </h3>
        <div class="plugins-grid">
          <PluginMarketCard
            v-for="relatedPlugin in sameDeveloperPlugins"
            :key="relatedPlugin.id"
            :plugin="relatedPlugin"
            :view-mode="'grid'"
            @click="$emit('select-plugin', relatedPlugin)"
            @install="$emit('install', relatedPlugin)"
            @uninstall="$emit('uninstall', relatedPlugin)"
          />
        </div>
      </div>

      <!-- Similar Plugins -->
      <div v-if="similarPlugins.length" class="related-section">
        <h3 class="section-title">
          <Lightbulb :size="18" />
          相似插件推荐
        </h3>
        <div class="plugins-grid">
          <PluginMarketCard
            v-for="relatedPlugin in similarPlugins"
            :key="relatedPlugin.id"
            :plugin="relatedPlugin"
            :view-mode="'grid'"
            @click="$emit('select-plugin', relatedPlugin)"
            @install="$emit('install', relatedPlugin)"
            @uninstall="$emit('uninstall', relatedPlugin)"
          />
        </div>
      </div>

      <!-- Frequently Bought Together -->
      <div v-if="bundlePlugins.length" class="related-section">
        <h3 class="section-title">
          <Package :size="18" />
          经常一起安装
        </h3>
        <div class="bundle-container">
          <div class="bundle-plugins">
            <div class="plugins-grid">
              <PluginMarketCard
                v-for="bundlePlugin in bundlePlugins"
                :key="bundlePlugin.id"
                :plugin="bundlePlugin"
                :view-mode="'grid'"
                @click="$emit('select-plugin', bundlePlugin)"
                @install="$emit('install', bundlePlugin)"
                @uninstall="$emit('uninstall', bundlePlugin)"
              />
            </div>
          </div>
          <div class="bundle-actions">
            <div class="bundle-info">
              <p class="bundle-description">用户经常将这些插件与 {{ plugin.name }} 一起使用</p>
              <div class="bundle-price">
                <span class="original-price">${{ calculateOriginalPrice() }}</span>
                <span class="bundle-price-value">${{ calculateBundlePrice() }}</span>
                <span class="save-amount">节省 ${{ calculateSavings() }}</span>
              </div>
            </div>
            <button @click="installBundle" class="bundle-btn" aria-label="按钮">
              <Download :size="16" />
              一键安装套装
            </button>
          </div>
        </div>
      </div>

      <!-- Popular in Category -->
      <div v-if="categoryPlugins.length" class="related-section">
        <h3 class="section-title">
          <TrendingUp :size="18" />
          {{ plugin.category.name }} 分类热门
        </h3>
        <div class="plugins-grid">
          <PluginMarketCard
            v-for="relatedPlugin in categoryPlugins"
            :key="relatedPlugin.id"
            :plugin="relatedPlugin"
            :view-mode="'grid'"
            @click="$emit('select-plugin', relatedPlugin)"
            @install="$emit('install', relatedPlugin)"
            @uninstall="$emit('uninstall', relatedPlugin)"
          />
        </div>
      </div>

      <!-- Recently Viewed -->
      <div v-if="recentlyViewed.length" class="related-section">
        <h3 class="section-title">
          <Clock :size="18" />
          最近浏览
        </h3>
        <div class="plugins-grid">
          <PluginMarketCard
            v-for="recentPlugin in recentlyViewed"
            :key="recentPlugin.id"
            :plugin="recentPlugin"
            :view-mode="'grid'"
            @click="$emit('select-plugin', recentPlugin)"
            @install="$emit('install', recentPlugin)"
            @uninstall="$emit('uninstall', recentPlugin)"
          />
        </div>
      </div>

      <!-- No Related Plugins -->
      <div v-if="!hasAnyRelated" class="empty-state">
        <Search :size="48" class="empty-icon" />
        <h3>暂无相关推荐</h3>
        <p>浏览更多插件来发现有用的工具</p>
        <button @click="$emit('browse-market')" class="browse-btn" aria-label="按钮">
          浏览插件市场
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { User, Lightbulb, Package, TrendingUp, Clock, Search, Download } from 'lucide-vue-next'

import PluginMarketCard from './PluginMarketCard.vue'
import type { PluginMarketListing } from '../../types/plugins'

interface Props {
  plugin: PluginMarketListing
}

defineProps<Props>()

const emit = defineEmits<{
  'select-plugin': [plugin: PluginMarketListing]
  install: [plugin: PluginMarketListing]
  uninstall: [plugin: PluginMarketListing]
  'browse-market': []
}>()

// State
const loading = ref(false)

// Mock related plugins data - in real implementation, this would come from API
const sameDeveloperPlugins = ref<PluginMarketListing[]>([])
const similarPlugins = ref<PluginMarketListing[]>([])
const bundlePlugins = ref<PluginMarketListing[]>([])
const categoryPlugins = ref<PluginMarketListing[]>([])
const recentlyViewed = ref<PluginMarketListing[]>([])

const hasAnyRelated = computed(
  () =>
    sameDeveloperPlugins.value.length > 0 ||
    similarPlugins.value.length > 0 ||
    bundlePlugins.value.length > 0 ||
    categoryPlugins.value.length > 0 ||
    recentlyViewed.value.length > 0
)

// Methods
const calculateOriginalPrice = (): number => {
  return bundlePlugins.value.reduce((total, plugin) => {
    return total + (plugin.price || 0)
  }, 0)
}

const calculateBundlePrice = (): number => {
  const original = calculateOriginalPrice()
  return Math.round(original * 0.85 * 100) / 100 // 15% discount
}

const calculateSavings = (): number => {
  return Math.round((calculateOriginalPrice() - calculateBundlePrice()) * 100) / 100
}

const installBundle = () => {
  bundlePlugins.value.forEach(plugin => {
    emit('install', plugin)
  })
}

const loadRelatedPlugins = async () => {
  loading.value = true

  try {
    // Simulate API calls to load related plugins
    await Promise.all([
      loadSameDeveloperPlugins(),
      loadSimilarPlugins(),
      loadBundlePlugins(),
      loadCategoryPlugins(),
      loadRecentlyViewed()
    ])
  } catch (error) {
    console.error('Failed to load related plugins:', error)
  } finally {
    loading.value = false
  }
}

const loadSameDeveloperPlugins = async () => {
  // Mock data - same developer plugins
  sameDeveloperPlugins.value = [
    {
      id: 'text-utils',
      name: 'Text Utils',
      description: '文本处理工具集',
      shortDescription: '强大的文本处理功能',
      version: '1.5.0',
      author: 'MiaoDa Team',
      authorId: 'miaoda-team',
      category: { id: 'tools', name: '工具' },
      tags: ['text', 'utility', 'processing'],
      downloads: 8420,
      rating: 4.6,
      reviewCount: 156,
      lastUpdated: '2024-01-10',
      createdAt: '2023-08-15',
      pricing: 'free',
      status: 'available',
      verified: true,
      featured: false,
      minVersion: '1.0.0',
      platforms: ['win', 'mac', 'linux']
    }
  ]
}

const loadSimilarPlugins = async () => {
  // Mock data - similar plugins
  similarPlugins.value = [
    {
      id: 'math-pro',
      name: 'Math Pro',
      description: '专业数学计算工具',
      shortDescription: '高级数学计算功能',
      version: '3.2.1',
      author: 'MathTools Inc',
      authorId: 'mathtools-inc',
      category: { id: 'tools', name: '工具' },
      tags: ['math', 'calculator', 'advanced'],
      downloads: 12500,
      rating: 4.7,
      reviewCount: 203,
      lastUpdated: '2024-01-12',
      createdAt: '2023-05-20',
      pricing: 'paid',
      price: 9.99,
      currency: 'usd',
      status: 'available',
      verified: true,
      featured: true,
      minVersion: '1.0.0',
      platforms: ['win', 'mac', 'linux']
    }
  ]
}

const loadBundlePlugins = async () => {
  // Mock data - bundle plugins
  bundlePlugins.value = [
    {
      id: 'unit-converter',
      name: 'Unit Converter',
      description: '单位转换工具',
      shortDescription: '各种单位互相转换',
      version: '2.1.0',
      author: 'Convert Tools',
      authorId: 'convert-tools',
      category: { id: 'tools', name: '工具' },
      tags: ['converter', 'units', 'utility'],
      downloads: 6800,
      rating: 4.4,
      reviewCount: 89,
      lastUpdated: '2024-01-08',
      createdAt: '2023-07-10',
      pricing: 'paid',
      price: 4.99,
      currency: 'usd',
      status: 'available',
      verified: false,
      featured: false,
      minVersion: '1.0.0',
      platforms: ['win', 'mac', 'linux']
    }
  ]
}

const loadCategoryPlugins = async () => {
  // Mock data - popular in category
  categoryPlugins.value = [
    {
      id: 'code-formatter',
      name: 'Code Formatter',
      description: '代码格式化工具',
      shortDescription: '一键格式化各种代码',
      version: '1.8.0',
      author: 'DevTools Co',
      authorId: 'devtools-co',
      category: { id: 'tools', name: '工具' },
      tags: ['code', 'formatter', 'development'],
      downloads: 15600,
      rating: 4.8,
      reviewCount: 267,
      lastUpdated: '2024-01-14',
      createdAt: '2023-04-05',
      pricing: 'freemium',
      status: 'available',
      verified: true,
      featured: true,
      minVersion: '1.0.0',
      platforms: ['win', 'mac', 'linux']
    }
  ]
}

const loadRecentlyViewed = async () => {
  // Load from local storage or API
  recentlyViewed.value = []
}

// Initialize
onMounted(() => {
  loadRelatedPlugins()
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
.plugin-related {
  @apply space-y-8;
}

/* Loading State */
.loading-state {
  @apply flex flex-col items-center justify-center py-8;
}

.loading-spinner {
  @apply w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin mb-2;
}

/* Related Sections */
.related-sections {
  @apply space-y-8;
}

.related-section {
  @apply space-y-4;
}

.section-title {
  @apply flex items-center gap-2 text-lg font-semibold pb-2 border-b border-border;
}

.plugins-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

/* Bundle Section */
.bundle-container {
  @apply space-y-4;
}

.bundle-actions {
  @apply flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border;
}

.bundle-info {
  @apply flex-1;
}

.bundle-description {
  @apply text-sm text-muted-foreground mb-2;
}

.bundle-price {
  @apply flex items-center gap-3;
}

.original-price {
  @apply text-sm text-muted-foreground line-through;
}

.bundle-price-value {
  @apply text-lg font-bold text-primary;
}

.save-amount {
  @apply px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium;
}

.bundle-btn {
  @apply inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium;
}

/* Empty State */
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
  @apply text-muted-foreground mb-6;
}

.browse-btn {
  @apply px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors;
}

/* Dark mode adjustments */
.dark .save-amount {
  @apply bg-green-900/50 text-green-400;
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
