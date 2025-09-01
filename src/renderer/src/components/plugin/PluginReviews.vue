<template>
  <div class="plugin-reviews">
    <!-- Reviews Summary -->
    <div class="reviews-summary">
      <div class="summary-header">
        <h3 class="summary-title">用户评价</h3>
        <button @click="$emit('add-review')" class="add-review-btn" aria-label="按钮">
          <Plus :size="16" />
          写评价
        </button>
      </div>

      <div class="summary-stats">
        <div class="overall-rating">
          <div class="rating-score">{{ plugin.rating.toFixed(1) }}</div>
          <div class="rating-stars">
            <Star
              v-for="star in 5"
              :key="star"
              :size="16"
              :class="['star', { filled: star <= Math.round(plugin.rating) }]"
            />
          </div>
          <div class="rating-count">{{ formatNumber(plugin.reviewCount) }} 条评价</div>
        </div>

        <div class="rating-breakdown">
          <div v-for="rating in [5, 4, 3, 2, 1]" :key="rating" class="rating-bar">
            <span class="rating-label">{{ rating }} 星</span>
            <div class="bar-container">
              <div class="bar-fill" :style="{ width: `${getRatingPercentage(rating)}%` }" />
            </div>
            <span class="rating-count">{{ getRatingCount(rating) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters and Sorting -->
    <div class="reviews-controls">
      <div class="filter-buttons">
        <button
          v-for="filter in ratingFilters"
          :key="filter.value"
          @click="selectedFilter = filter.value"
          :class="['filter-btn', { active: selectedFilter === filter.value }]"
         aria-label="按钮">
          {{ filter.label }}
        </button>
      </div>

      <div class="sort-controls">
        <select v-model="sortBy" class="sort-select">
          <option value="helpful">最有帮助</option>
          <option value="newest">最新</option>
          <option value="oldest">最早</option>
          <option value="rating-high">评分最高</option>
          <option value="rating-low">评分最低</option>
        </select>
      </div>
    </div>

    <!-- Reviews List -->
    <div class="reviews-list">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner" />
        <p>正在加载评价...</p>
      </div>

      <div v-else-if="filteredReviews.length === 0" class="empty-state">
        <MessageSquare :size="48" class="empty-icon" />
        <h3>暂无评价</h3>
        <p>成为第一个评价此插件的用户</p>
        <button @click="$emit('add-review')" class="add-review-btn" aria-label="按钮">写评价</button>
      </div>

      <div v-else class="reviews-container">
        <div v-for="review in paginatedReviews" :key="review.id" class="review-item">
          <!-- Review Header -->
          <div class="review-header">
            <div class="reviewer-info">
              <div class="reviewer-avatar">
                <img
                  v-if="review.userAvatar"
                  :src="review.userAvatar"
                  :alt="review.userName"
                  class="avatar-image"
                />
                <User v-else :size="20" />
              </div>
              <div class="reviewer-details">
                <span class="reviewer-name">
                  {{ review.userName }}
                  <span v-if="review.verified" class="verified-badge">
                    <Shield :size="12" />
                  </span>
                </span>
                <div class="review-meta">
                  <div class="review-rating">
                    <Star
                      v-for="star in 5"
                      :key="star"
                      :size="14"
                      :class="['star', { filled: star <= review.rating }]"
                    />
                  </div>
                  <span class="review-date">{{ formatDate(review.createdAt) }}</span>
                </div>
              </div>
            </div>

            <div class="review-actions">
              <button
                @click="toggleHelpful(review)"
                :class="['helpful-btn', { active: review.userHelpful }]"
               aria-label="按钮">
                <ThumbsUp :size="14" />
                {{ review.helpful }}
              </button>
            </div>
          </div>

          <!-- Review Content -->
          <div class="review-content">
            <p class="review-text">{{ review.review }}</p>

            <!-- Review Tags -->
            <div v-if="review.tags?.length" class="review-tags">
              <span v-for="tag in review.tags" :key="tag" class="review-tag">
                {{ tag }}
              </span>
            </div>

            <!-- Developer Response -->
            <div v-if="review.developerResponse" class="developer-response">
              <div class="response-header">
                <div class="developer-badge">
                  <Code :size="14" />
                  开发者回复
                </div>
                <span class="response-date">{{
                  formatDate(review.developerResponse.createdAt)
                }}</span>
              </div>
              <p class="response-text">{{ review.developerResponse.text }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button @click="currentPage--" :disabled="currentPage === 1" class="pagination-btn" aria-label="按钮">
          <ChevronLeft :size="16" />
          上一页
        </button>

        <div class="pagination-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页</div>

        <button
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="pagination-btn"
         aria-label="按钮">
          下一页
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Plus,
  Star,
  MessageSquare,
  User,
  Shield,
  ThumbsUp,
  Code,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'

import type { PluginMarketListing, PluginRating } from '../../types/plugins'

interface ExtendedPluginRating extends PluginRating {
  userAvatar?: string
  tags?: string[]
  userHelpful?: boolean
  developerResponse?: {
    text: string
    createdAt: string
  }
}

interface Props {
  plugin: PluginMarketListing
}

defineProps<Props>()

const emit = defineEmits<{
  'add-review': []
}>()

// State
const loading = ref(false)
const selectedFilter = ref('all')
const sortBy = ref('helpful')
const currentPage = ref(1)
const pageSize = 10

// Mock reviews data - in real implementation, this would come from API
const reviews = ref<ExtendedPluginRating[]>([
  {
    id: '1',
    pluginId: 'plugin-id',
    userId: 'user-1',
    userName: 'Alice Chen',
    userAvatar: '',
    rating: 5,
    review: '非常好用的插件！界面简洁，功能强大。特别是快捷键功能，大大提高了工作效率。',
    tags: ['易于使用', '功能强大', '界面美观'],
    createdAt: '2024-01-15',
    helpful: 12,
    verified: true,
    userHelpful: false
  },
  {
    id: '2',
    pluginId: 'plugin-id',
    userId: 'user-2',
    userName: 'Bob Wang',
    rating: 4,
    review: '整体不错，但是希望能增加更多自定义选项。文档也可以更详细一些。',
    tags: ['功能强大', '需要改进'],
    createdAt: '2024-01-14',
    helpful: 8,
    verified: false,
    userHelpful: false,
    developerResponse: {
      text: '感谢您的反馈！我们会在下个版本中增加更多自定义选项，文档也会持续完善。',
      createdAt: '2024-01-15'
    }
  },
  {
    id: '3',
    pluginId: 'plugin-id',
    userId: 'user-3',
    userName: 'Charlie Li',
    rating: 3,
    review: '功能基本满足需求，但偶尔会有小bug。希望开发者能持续维护。',
    tags: ['有 Bug'],
    createdAt: '2024-01-13',
    helpful: 3,
    verified: true,
    userHelpful: false
  }
])

// Filter options
const ratingFilters = [
  { value: 'all', label: '全部' },
  { value: '5', label: '5星' },
  { value: '4', label: '4星' },
  { value: '3', label: '3星' },
  { value: '2', label: '2星' },
  { value: '1', label: '1星' }
]

// Mock rating distribution
const ratingDistribution = ref({
  5: 156,
  4: 67,
  3: 21,
  2: 8,
  1: 2
})

// Computed properties
const filteredReviews = computed(() => {
  let filtered = reviews.value

  if (selectedFilter.value !== 'all') {
    const rating = parseInt(selectedFilter.value)
    filtered = filtered.filter(review => review.rating === rating)
  }

  // Sort reviews
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy.value) {
      case 'helpful':
        return b.helpful - a.helpful
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'rating-high':
        return b.rating - a.rating
      case 'rating-low':
        return a.rating - b.rating
      default:
        return 0
    }
  })

  return sorted
})

const totalPages = computed(() => Math.ceil(filteredReviews.value.length / pageSize))

const paginatedReviews = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredReviews.value.slice(start, start + pageSize)
})

// Methods
const formatNumber = (num: number): string => {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
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

const getRatingPercentage = (rating: number): number => {
  const total = Object.values(ratingDistribution.value).reduce((sum, count) => sum + count, 0)
  const count = ratingDistribution.value[rating as keyof typeof ratingDistribution.value] || 0
  return total > 0 ? (count / total) * 100 : 0
}

const getRatingCount = (rating: number): number => {
  return ratingDistribution.value[rating as keyof typeof ratingDistribution.value] || 0
}

const toggleHelpful = (review: ExtendedPluginRating) => {
  if (review.userHelpful) {
    review.helpful--
    review.userHelpful = false
  } else {
    review.helpful++
    review.userHelpful = true
  }
}

// Initialize
onMounted(() => {
  // Load reviews from API
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
.plugin-reviews {
  @apply space-y-6;
}

/* Reviews Summary */
.reviews-summary {
  @apply space-y-4;
}

.summary-header {
  @apply flex items-center justify-between;
}

.summary-title {
  @apply text-lg font-semibold;
}

.add-review-btn {
  @apply inline-flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors;
}

.summary-stats {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.overall-rating {
  @apply text-center space-y-2;
}

.rating-score {
  @apply text-4xl font-bold text-primary;
}

.rating-stars {
  @apply flex items-center justify-center gap-1;
}

.star {
  @apply text-muted-foreground;
}

.star.filled {
  @apply text-yellow-500 fill-current;
}

.rating-count {
  @apply text-sm text-muted-foreground;
}

.rating-breakdown {
  @apply space-y-2;
}

.rating-bar {
  @apply flex items-center gap-3 text-sm;
}

.rating-label {
  @apply w-8 text-muted-foreground;
}

.bar-container {
  @apply flex-1 h-2 bg-muted rounded-full overflow-hidden;
}

.bar-fill {
  @apply h-full bg-yellow-500 transition-all duration-300;
}

/* Reviews Controls */
.reviews-controls {
  @apply flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border;
}

.filter-buttons {
  @apply flex flex-wrap gap-2;
}

.filter-btn {
  @apply px-3 py-1.5 text-sm border border-border rounded-full hover:bg-accent transition-colors;
}

.filter-btn.active {
  @apply bg-primary text-primary-foreground border-primary;
}

.sort-controls {
  @apply flex items-center gap-2;
}

.sort-select {
  @apply px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary;
}

/* Reviews List */
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
  @apply text-muted-foreground mb-4;
}

.reviews-container {
  @apply space-y-6;
}

/* Review Item */
.review-item {
  @apply p-4 border border-border rounded-lg;
}

.review-header {
  @apply flex items-start justify-between mb-3;
}

.reviewer-info {
  @apply flex items-start gap-3;
}

.reviewer-avatar {
  @apply w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden;
}

.avatar-image {
  @apply w-full h-full object-cover;
}

.reviewer-details {
  @apply flex-1;
}

.reviewer-name {
  @apply flex items-center gap-2 font-medium text-sm;
}

.verified-badge {
  @apply text-green-600;
}

.review-meta {
  @apply flex items-center gap-3 mt-1;
}

.review-rating {
  @apply flex gap-0.5;
}

.review-rating .star {
  @apply text-muted-foreground;
}

.review-rating .star.filled {
  @apply text-yellow-500 fill-current;
}

.review-date {
  @apply text-xs text-muted-foreground;
}

.review-actions {
  @apply flex items-center gap-2;
}

.helpful-btn {
  @apply inline-flex items-center gap-1 px-2 py-1 text-xs border border-border rounded hover:bg-accent transition-colors;
}

.helpful-btn.active {
  @apply bg-primary/10 text-primary border-primary/30;
}

/* Review Content */
.review-content {
  @apply space-y-3;
}

.review-text {
  @apply text-sm leading-relaxed;
}

.review-tags {
  @apply flex flex-wrap gap-2;
}

.review-tag {
  @apply px-2 py-1 text-xs bg-muted rounded-full;
}

/* Developer Response */
.developer-response {
  @apply mt-4 p-3 bg-muted/50 rounded-lg border-l-4 border-primary;
}

.response-header {
  @apply flex items-center justify-between mb-2;
}

.developer-badge {
  @apply inline-flex items-center gap-1 text-xs font-medium text-primary;
}

.response-date {
  @apply text-xs text-muted-foreground;
}

.response-text {
  @apply text-sm;
}

/* Pagination */
.pagination {
  @apply flex items-center justify-between pt-6;
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
