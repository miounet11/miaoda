<template>
  <div class="plugin-reviews">
    <!-- Reviews Summary -->
    <div class="reviews-summary">
      <div class="summary-header">
        <h3 class="summary-title">用户评价</h3>
        <button @click="$emit('add-review')" class="add-review-btn">
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
          <div
            v-for="rating in [5, 4, 3, 2, 1]"
            :key="rating"
            class="rating-bar"
          >
            <span class="rating-label">{{ rating }} 星</span>
            <div class="bar-container">
              <div 
                class="bar-fill" 
                :style="{ width: `${getRatingPercentage(rating)}%` }"
              ></div>
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
        >
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
        <div class="loading-spinner"></div>
        <p>正在加载评价...</p>
      </div>
      
      <div v-else-if="filteredReviews.length === 0" class="empty-state">
        <MessageSquare :size="48" class="empty-icon" />
        <h3>暂无评价</h3>
        <p>成为第一个评价此插件的用户</p>
        <button @click="$emit('add-review')" class="add-review-btn">
          写评价
        </button>
      </div>
      
      <div v-else class="reviews-container">
        <div
          v-for="review in paginatedReviews"
          :key="review.id"
          class="review-item"
        >
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
              >
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
              <span
                v-for="tag in review.tags"
                :key="tag"
                class="review-tag"
              >
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
                <span class="response-date">{{ formatDate(review.developerResponse.createdAt) }}</span>
              </div>
              <p class="response-text">{{ review.developerResponse.text }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="currentPage--"
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
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
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
  Plus, Star, MessageSquare, User, Shield, ThumbsUp, Code,
  ChevronLeft, ChevronRight
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
</style>