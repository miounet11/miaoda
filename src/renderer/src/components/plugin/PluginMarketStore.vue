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
            <input id="input-82ecbxuct"
              v-model="searchQuery"
              type="text"
              placeholder="搜索插件、作者或标签..."
              class="search-input"
              @input="onSearchInput"
              @keyup.enter="performSearch"
             aria-label="输入框">
            <button v-if="searchQuery" @click="clearSearch" class="clear-search" aria-label="按钮">
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
             aria-label="按钮">
              <component :is="filter.icon" :size="16" />
              {{ filter.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="market-content">
      <!-- Sidebar Filters -->
      <aside>
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
            </aside>
          </div>
        </div>

        <!-- Pricing Filter -->
        <div class="filter-section">
          <h3 class="filter-title">价格</h3>
          <div class="pricing-filters">
            <label v-for="pricing in pricingOptions" :key="pricing.value" class="pricing-option">
              <input id="input-xwksy6u5b"
                v-model="selectedPricing"
                type="checkbox"
                :value="pricing.value"
                class="pricing-checkbox"
               aria-label="输入框">
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
            <input id="input-yum4jzxd" v-model="onlyVerified" type="checkbox" class="filter-checkbox"  aria-label="输入框">
            <Shield :size="16" />
            <span>仅显示认证插件</span>
          </label>
          <label class="filter-option">
            <input id="input-w2ueg29c1" v-model="onlyFeatured" type="checkbox" class="filter-checkbox"  aria-label="输入框">
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
             aria-label="按钮">
              <ArrowUpDown :size="16" />
            </button>

            <div class="view-controls">
              <button
                @click="viewMode = 'grid'"
                :class="['view-btn', { active: viewMode === 'grid' }]"
               aria-label="按钮">
                <Grid :size="16" />
              </button>
              <button
                @click="viewMode = 'list'"
                :class="['view-btn', { active: viewMode === 'list' }]"
               aria-label="按钮">
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
                <p class="featured-description">
                  {{ plugin.shortDescription || plugin.description }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Plugin Grid/List -->
        <div class="plugins-section">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner" />
            <p>正在加载插件...</p>
          </div>

          <div v-else-if="searchResult.plugins.length === 0" class="empty-state">
            <Package :size="48" class="empty-icon" />
            <h3>没有找到插件</h3>
            <p>尝试调整搜索条件或筛选器</p>
          </div>

          <div
            v-else
            :class="['plugins-container', viewMode === 'grid' ? 'grid-view' : 'list-view']"
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
            <button @click="previousPage" :disabled="currentPage === 1" class="pagination-btn" aria-label="按钮">
              <ChevronLeft :size="16" />
              上一页
            </button>

            <div class="pagination-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页</div>

            <button @click="nextPage" :disabled="!searchResult.hasMore" class="pagination-btn" aria-label="按钮">
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
  Search,
  X,
  Shield,
  Sparkles,
  Star,
  Package,
  Grid,
  List,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Puzzle,
  Paintbrush,
  Brain,
  Workflow,
  Settings
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
  pricing: selectedPricing.value.length > 0 ? (selectedPricing.value as any) : undefined,
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
    Package,
    Puzzle,
    Paintbrush,
    Brain,
    Workflow,
    Settings
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
      }
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
watch(
  filters,
  () => {
    if (currentPage.value === 1) {
      loadPlugins()
    } else {
      currentPage.value = 1
    }
  },
  { deep: true }
)

// Initialize
onMounted(() => {
  loadPlugins()
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

.pricing-filters,
.rating-filters {
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

.sort-order-btn,
.view-btn {
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

/* 🎨 表单用户体验优化 */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}

.form-input.error {
  border-color: hsl(0 84% 60%);
}

.form-error {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: hsl(0 84% 60%);
}

.form-success {
  border-color: hsl(142 71% 45%);
}

/* 加载状态 */
.form-input.loading {
  background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  background-size: 200% 100%;
  animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}</style>
