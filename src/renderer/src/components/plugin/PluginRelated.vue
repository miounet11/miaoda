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
            <button @click="installBundle" class="bundle-btn">
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
        <button @click="$emit('browse-market')" class="browse-btn">浏览插件市场</button>
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
</style>
