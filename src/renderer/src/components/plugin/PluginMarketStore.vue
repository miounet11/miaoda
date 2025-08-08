<template>
  <div class="plugin-market">
    <!-- Header with Search -->
    <div class="market-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="market-title">插件市场</h1>
          <p class="market-subtitle">发现并安装强大的插件来扩展 MiaoDa Chat 功能</p>
        </div>
        
        <!-- Search Bar -->
        <div class="search-section">
          <div class="search-bar">
            <Search class="search-icon" :size="20" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索插件、作者或标签..."
              class="search-input"
              @input="onSearchInput"
              @keyup.enter="performSearch"
            />
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="clear-search"
            >
              <X :size="16" />
            </button>
          </div>
          
          <!-- Quick Filters -->
          <div class="quick-filters">
            <button
              v-for="filter in quickFilters"
              :key="filter.key"
              @click="toggleQuickFilter(filter.key)"
              :class="['filter-btn', { active: activeFilters.includes(filter.key) }]"
            >
              <component :is="filter.icon" :size="16" />
              {{ filter.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="market-content">
      <!-- Sidebar Filters -->
      <div class="market-sidebar">
        <!-- Categories -->
        <div class="filter-section">
          <h3 class="filter-title">分类</h3>
          <div class="category-tree">
            <div
              v-for="category in categories"
              :key="category.id"
              :class="['category-item', { active: selectedCategory === category.id }]"
              @click="selectCategory(category.id)"
            >
              <component
                v-if="category.icon"
                :is="getCategoryIcon(category.icon)"
                :size="16"
                class="category-icon"
              />
              <span class="category-name">{{ category.name }}</span>
              <span class="category-count">{{ getCategoryCount(category.id) }}</span>
            </div>
          </div>
        </div>

        <!-- Pricing Filter -->
        <div class="filter-section">
          <h3 class="filter-title">价格</h3>
          <div class="pricing-filters">
            <label
              v-for="pricing in pricingOptions"
              :key="pricing.value"
              class="pricing-option"
            >
              <input
                v-model="selectedPricing"
                type="checkbox"
                :value="pricing.value"
                class="pricing-checkbox"
              />
              <span class="pricing-label">{{ pricing.label }}</span>
              <span class="pricing-count">{{ getPricingCount(pricing.value) }}</span>
            </label>
          </div>
        </div>

        <!-- Rating Filter -->
        <div class="filter-section">
          <h3 class="filter-title">评分</h3>
          <div class="rating-filters">
            <div
              v-for="rating in [5, 4, 3, 2, 1]"
              :key="rating"
              :class="['rating-option', { active: minRating === rating }]"
              @click="setMinRating(rating)"
            >
              <div class="stars">
                <Star
                  v-for="star in 5"
                  :key="star"
                  :size="14"
                  :class="['star', { filled: star <= rating, active: star <= rating }]"
                />
              </div>
              <span class="rating-text">{{ rating }}+ 星</span>
            </div>
          </div>
        </div>

        <!-- Additional Filters -->
        <div class="filter-section">
          <h3 class="filter-title">其他</h3>
          <label class="filter-option">
            <input
              v-model="onlyVerified"
              type="checkbox"
              class="filter-checkbox"
            />
            <Shield :size="16" />
            <span>仅显示认证插件</span>
          </label>
          <label class="filter-option">
            <input
              v-model="onlyFeatured"
              type="checkbox"
              class="filter-checkbox"
            />
            <Sparkles :size="16" />
            <span>推荐插件</span>
          </label>
        </div>
      </div>

      <!-- Main Content -->
      <div class="market-main">
        <!-- Sort Controls -->
        <div class="controls-bar">
          <div class="results-info">
            <span class="results-count">
              {{ searchResult.total }} 个插件
              <span v-if="searchQuery"> 符合 "{{ searchQuery }}" </span>
            </span>
          </div>
          
          <div class="sort-controls">
            <select v-model="sortBy" class="sort-select">
              <option value="relevance">相关性</option>
              <option value="rating">评分</option>
              <option value="downloads">下载量</option>
              <option value="updated">更新时间</option>
              <option value="name">名称</option>
            </select>
            
            <button
              @click="toggleSortOrder"
              class="sort-order-btn"
              :title="sortOrder === 'desc' ? '降序' : '升序'"
            >
              <ArrowUpDown :size="16" />
            </button>

            <div class="view-controls">
              <button
                @click="viewMode = 'grid'"
                :class="['view-btn', { active: viewMode === 'grid' }]"
              >
                <Grid :size="16" />
              </button>
              <button
                @click="viewMode = 'list'"
                :class="['view-btn', { active: viewMode === 'list' }]"
              >
                <List :size="16" />
              </button>
            </div>
          </div>
        </div>

        <!-- Featured Section -->
        <div v-if="!searchQuery && featuredPlugins.length > 0" class="featured-section">
          <h2 class="section-title">推荐插件</h2>
          <div class="featured-carousel">
            <div
              v-for="plugin in featuredPlugins"
              :key="plugin.id"
              class="featured-card"
              @click="selectPlugin(plugin)"
            >
              <div
                v-if="plugin.banner"
                class="featured-banner"
                :style="{ backgroundImage: `url(${plugin.banner})` }"
              />
              <div class="featured-content">
                <div class="featured-header">
                  <div class="plugin-icon">
                    <img
                      v-if="plugin.icon"
                      :src="plugin.icon"
                      :alt="plugin.name"
                      class="icon-image"
                    />
                    <Package v-else :size="24" />
                  </div>
                  <div class="featured-meta">
                    <h3 class="featured-name">{{ plugin.name }}</h3>
                    <p class="featured-author">{{ plugin.author }}</p>
                  </div>
                  <div class="featured-badges">
                    <span v-if="plugin.verified" class="verified-badge">
                      <Shield :size="12" />
                    </span>
                    <span class="rating-badge">
                      <Star :size="12" class="star filled" />
                      {{ plugin.rating.toFixed(1) }}
                    </span>
                  </div>
                </div>
                <p class="featured-description">{{ plugin.shortDescription || plugin.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Plugin Grid/List -->
        <div class="plugins-section">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>正在加载插件...</p>
          </div>
          
          <div v-else-if="searchResult.plugins.length === 0" class="empty-state">
            <Package :size="48" class="empty-icon" />
            <h3>没有找到插件</h3>
            <p>尝试调整搜索条件或筛选器</p>
          </div>
          
          <div
            v-else
            :class="[
              'plugins-container',
              viewMode === 'grid' ? 'grid-view' : 'list-view'
            ]"
          >
            <PluginMarketCard
              v-for="plugin in searchResult.plugins"
              :key="plugin.id"
              :plugin="plugin"
              :view-mode="viewMode"
              @click="selectPlugin(plugin)"
              @install="installPlugin"
              @uninstall="uninstallPlugin"
              @rate="showRatingModal"
            />
          </div>
          
          <!-- Pagination -->
          <div v-if="searchResult.total > searchResult.limit" class="pagination">
            <button
              @click="previousPage"
              :disabled="currentPage === 1"
              class="pagination-btn"
            >
              <ChevronLeft :size="16" />
              上一页
            </button>
            
            <div class="pagination-info">
              第 {{ currentPage }} 页，共 {{ totalPages }} 页
            </div>
            
            <button
              @click="nextPage"
              :disabled="!searchResult.hasMore"
              class="pagination-btn"
            >
              下一页
              <ChevronRight :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Plugin Detail Modal -->
    <PluginDetailModal
      v-if="selectedPlugin"
      :plugin="selectedPlugin"
      :show="showDetailModal"
      @close="closeDetailModal"
      @install="installPlugin"
      @uninstall="uninstallPlugin"
      @rate="showRatingModal"
    />

    <!-- Rating Modal -->
    <PluginRatingModal
      v-if="ratingPlugin"
      :plugin="ratingPlugin"
      :show="showRatingModalState"
      @close="closeRatingModal"
      @submit="submitRating"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  Search, X, Shield, Sparkles, Star, Package, Grid, List,
  ArrowUpDown, ChevronLeft, ChevronRight,
  Puzzle, Paintbrush, Brain, Workflow, Settings
} from 'lucide-vue-next'

import PluginMarketCard from './PluginMarketCard.vue'
import PluginDetailModal from './PluginDetailModal.vue'
import PluginRatingModal from './PluginRatingModal.vue'

import type {
  PluginMarketListing,
  PluginCategory,
  PluginFilters,
  PluginSearchResult
} from '../../types/plugins'

// Reactive state
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedPricing = ref<string[]>([])
const minRating = ref(0)
const onlyVerified = ref(false)
const onlyFeatured = ref(false)
const sortBy = ref('relevance')
const sortOrder = ref<'asc' | 'desc'>('desc')
const viewMode = ref<'grid' | 'list'>('grid')
const currentPage = ref(1)
const loading = ref(false)

const selectedPlugin = ref<PluginMarketListing | null>(null)
const showDetailModal = ref(false)
const ratingPlugin = ref<PluginMarketListing | null>(null)
const showRatingModalState = ref(false)

const searchResult = reactive<PluginSearchResult>({
  plugins: [],
  total: 0,
  page: 1,
  limit: 24,
  hasMore: false,
  categories: [],
  facets: {
    categories: {},
    tags: {},
    pricing: {}
  }
})

// Mock data - in real implementation, this would come from API
const categories = ref<PluginCategory[]>([
  { id: 'all', name: '全部', icon: 'Package' },
  { id: 'tools', name: '工具', icon: 'Puzzle' },
  { id: 'themes', name: '主题', icon: 'Paintbrush' },
  { id: 'llm', name: 'AI模型', icon: 'Brain' },
  { id: 'workflow', name: '工作流', icon: 'Workflow' },
  { id: 'integration', name: '集成', icon: 'Settings' }
])

const pricingOptions = [
  { value: 'free', label: '免费' },
  { value: 'paid', label: '付费' },
  { value: 'freemium', label: '免费增值' }
]

const quickFilters = [
  { key: 'verified', label: '认证', icon: Shield },
  { key: 'featured', label: '推荐', icon: Sparkles },
  { key: 'new', label: '最新', icon: Sparkles }
]

const activeFilters = ref<string[]>([])

// Computed properties
const totalPages = computed(() => Math.ceil(searchResult.total / searchResult.limit))

const featuredPlugins = computed(() =>
  searchResult.plugins.filter(plugin => plugin.featured).slice(0, 6)
)

const filters = computed<PluginFilters>(() => ({
  category: selectedCategory.value || undefined,
  pricing: selectedPricing.value.length > 0 ? selectedPricing.value as any : undefined,
  rating: minRating.value > 0 ? minRating.value : undefined,
  verified: onlyVerified.value || undefined,
  search: searchQuery.value || undefined,
  sortBy: sortBy.value as any,
  sortOrder: sortOrder.value,
  page: currentPage.value,
  limit: searchResult.limit
}))

// Methods
const getCategoryIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    Package, Puzzle, Paintbrush, Brain, Workflow, Settings
  }
  return icons[iconName] || Package
}

const getCategoryCount = (categoryId: string): number => {
  return searchResult.facets.categories[categoryId] || 0
}

const getPricingCount = (pricingType: string): number => {
  return searchResult.facets.pricing[pricingType] || 0
}

const onSearchInput = () => {
  // Debounce search
  setTimeout(() => {
    if (searchQuery.value !== filters.value.search) {
      performSearch()
    }
  }, 300)
}

const performSearch = async () => {
  currentPage.value = 1
  await loadPlugins()
}

const clearSearch = () => {
  searchQuery.value = ''
  performSearch()
}

const toggleQuickFilter = (filterKey: string) => {
  const index = activeFilters.value.indexOf(filterKey)
  if (index > -1) {
    activeFilters.value.splice(index, 1)
  } else {
    activeFilters.value.push(filterKey)
  }
  
  // Apply filter logic
  switch (filterKey) {
    case 'verified':
      onlyVerified.value = !onlyVerified.value
      break
    case 'featured':
      onlyFeatured.value = !onlyFeatured.value
      break
    case 'new':
      sortBy.value = 'created'
      sortOrder.value = 'desc'
      break
  }
  
  performSearch()
}

const selectCategory = (categoryId: string) => {
  selectedCategory.value = categoryId === 'all' ? '' : categoryId
  performSearch()
}

const setMinRating = (rating: number) => {
  minRating.value = minRating.value === rating ? 0 : rating
  performSearch()
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  performSearch()
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadPlugins()
  }
}

const nextPage = () => {
  if (searchResult.hasMore) {
    currentPage.value++
    loadPlugins()
  }
}

const selectPlugin = (plugin: PluginMarketListing) => {
  selectedPlugin.value = plugin
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedPlugin.value = null
}

const installPlugin = async (plugin: PluginMarketListing) => {
  try {
    // Call API to install plugin
    console.log('Installing plugin:', plugin.id)
    // Update plugin status
    plugin.status = 'updating'
    // Simulate installation
    setTimeout(() => {
      plugin.status = 'installed'
    }, 2000)
  } catch (error) {
    console.error('Failed to install plugin:', error)
  }
}

const uninstallPlugin = async (plugin: PluginMarketListing) => {
  try {
    // Call API to uninstall plugin
    console.log('Uninstalling plugin:', plugin.id)
    plugin.status = 'available'
  } catch (error) {
    console.error('Failed to uninstall plugin:', error)
  }
}

const showRatingModal = (plugin: PluginMarketListing) => {
  ratingPlugin.value = plugin
  showRatingModalState.value = true
}

const closeRatingModal = () => {
  showRatingModalState.value = false
  ratingPlugin.value = null
}

const submitRating = async (rating: { rating: number; review?: string }) => {
  try {
    // Call API to submit rating
    console.log('Submitting rating:', rating)
    closeRatingModal()
  } catch (error) {
    console.error('Failed to submit rating:', error)
  }
}

// Mock API call to load plugins
const loadPlugins = async () => {
  loading.value = true
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock data - replace with actual API call
    const mockPlugins: PluginMarketListing[] = [
      {
        id: 'calculator-pro',
        name: 'Calculator Pro',
        description: '强大的科学计算器插件，支持高级数学函数和单位转换',
        shortDescription: '强大的科学计算器插件',
        version: '2.1.0',
        author: 'MiaoDa Team',
        authorId: 'miaoda-team',
        category: categories.value.find(c => c.id === 'tools')!,
        tags: ['calculator', 'math', 'utility'],
        downloads: 15420,
        rating: 4.8,
        reviewCount: 234,
        lastUpdated: '2024-01-15',
        createdAt: '2023-06-20',
        pricing: 'free',
        status: 'available',
        verified: true,
        featured: true,
        minVersion: '1.0.0',
        platforms: ['win', 'mac', 'linux']
      },
      // Add more mock plugins...
    ]
    
    searchResult.plugins = mockPlugins
    searchResult.total = mockPlugins.length
    searchResult.page = currentPage.value
    searchResult.hasMore = false
    
    // Mock facets
    searchResult.facets = {
      categories: { tools: 25, themes: 12, llm: 8, workflow: 15, integration: 10 },
      tags: { calculator: 5, theme: 12, ai: 8, automation: 15 },
      pricing: { free: 45, paid: 18, freemium: 7 }
    }
    
  } catch (error) {
    console.error('Failed to load plugins:', error)
  } finally {
    loading.value = false
  }
}

// Watch for filter changes
watch(filters, () => {
  if (currentPage.value === 1) {
    loadPlugins()
  } else {
    currentPage.value = 1
  }
}, { deep: true })

// Initialize
onMounted(() => {
  loadPlugins()
})
</script>

<style scoped>
.plugin-market {
  @apply flex flex-col h-full bg-background;
}

.market-header {
  @apply border-b border-border bg-card;
}

.header-content {
  @apply max-w-7xl mx-auto px-6 py-8;
}

.market-title {
  @apply text-3xl font-bold text-foreground mb-2;
}

.market-subtitle {
  @apply text-muted-foreground mb-6;
}

.search-section {
  @apply space-y-4;
}

.search-bar {
  @apply relative max-w-md;
}

.search-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground;
}

.search-input {
  @apply w-full pl-10 pr-10 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent;
}

.clear-search {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground;
}

.quick-filters {
  @apply flex flex-wrap gap-2;
}

.filter-btn {
  @apply inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-full bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors;
}

.filter-btn.active {
  @apply bg-primary text-primary-foreground border-primary;
}

.market-content {
  @apply flex flex-1 overflow-hidden;
}

.market-sidebar {
  @apply w-64 bg-card border-r border-border p-4 overflow-y-auto;
}

.filter-section {
  @apply mb-6;
}

.filter-title {
  @apply text-sm font-semibold text-foreground mb-3;
}

.category-tree {
  @apply space-y-1;
}

.category-item {
  @apply flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-accent text-sm transition-colors;
}

.category-item.active {
  @apply bg-primary text-primary-foreground;
}

.category-icon {
  @apply text-muted-foreground;
}

.category-item.active .category-icon {
  @apply text-primary-foreground;
}

.category-name {
  @apply flex-1;
}

.category-count {
  @apply text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full;
}

.category-item.active .category-count {
  @apply text-primary-foreground bg-primary-foreground/20;
}

.pricing-filters, .rating-filters {
  @apply space-y-2;
}

.pricing-option {
  @apply flex items-center justify-between cursor-pointer hover:bg-accent p-2 rounded transition-colors;
}

.pricing-checkbox {
  @apply mr-3;
}

.pricing-label {
  @apply flex-1 text-sm;
}

.pricing-count {
  @apply text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full;
}

.rating-option {
  @apply flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-accent transition-colors;
}

.rating-option.active {
  @apply bg-accent;
}

.stars {
  @apply flex gap-0.5;
}

.star {
  @apply text-muted-foreground;
}

.star.filled {
  @apply text-yellow-500 fill-current;
}

.star.active {
  @apply text-yellow-500 fill-current;
}

.rating-text {
  @apply text-sm;
}

.filter-option {
  @apply flex items-center gap-3 cursor-pointer hover:bg-accent p-2 rounded transition-colors;
}

.filter-checkbox {
  @apply mr-0;
}

.market-main {
  @apply flex-1 overflow-y-auto;
}

.controls-bar {
  @apply flex items-center justify-between px-6 py-4 border-b border-border;
}

.results-count {
  @apply text-sm text-muted-foreground;
}

.sort-controls {
  @apply flex items-center gap-3;
}

.sort-select {
  @apply px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary;
}

.sort-order-btn, .view-btn {
  @apply p-2 border border-border rounded hover:bg-accent transition-colors;
}

.view-btn.active {
  @apply bg-primary text-primary-foreground border-primary;
}

.view-controls {
  @apply flex border border-border rounded overflow-hidden;
}

.view-controls .view-btn {
  @apply border-none rounded-none;
}

.featured-section {
  @apply px-6 py-6;
}

.section-title {
  @apply text-xl font-semibold mb-4;
}

.featured-carousel {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.featured-card {
  @apply bg-card border border-border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary;
}

.featured-banner {
  @apply h-32 bg-gradient-to-br from-primary/20 to-primary/5 bg-cover bg-center;
}

.featured-content {
  @apply p-4;
}

.featured-header {
  @apply flex items-start gap-3 mb-3;
}

.plugin-icon {
  @apply w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden;
}

.icon-image {
  @apply w-full h-full object-cover;
}

.featured-meta {
  @apply flex-1 min-w-0;
}

.featured-name {
  @apply font-semibold truncate;
}

.featured-author {
  @apply text-sm text-muted-foreground truncate;
}

.featured-badges {
  @apply flex items-center gap-2;
}

.verified-badge {
  @apply inline-flex items-center text-green-600;
}

.rating-badge {
  @apply inline-flex items-center gap-1 text-sm text-muted-foreground;
}

.featured-description {
  @apply text-sm text-muted-foreground line-clamp-2;
}

.plugins-section {
  @apply px-6 py-6;
}

.loading-state {
  @apply flex flex-col items-center justify-center py-12;
}

.loading-spinner {
  @apply w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin mb-4;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.empty-icon {
  @apply text-muted-foreground mb-4;
}

.plugins-container {
  @apply mb-8;
}

.grid-view {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4;
}

.list-view {
  @apply space-y-4;
}

.pagination {
  @apply flex items-center justify-between;
}

.pagination-btn {
  @apply inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

.pagination-info {
  @apply text-sm text-muted-foreground;
}
</style>