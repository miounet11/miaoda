<template>
  <div class="advanced-search-panel">
    <!-- 搜索头部 -->
    <div class="search-header">
      <div class="search-input-wrapper">
        <Search class="search-icon" :size="20" />
        <input id="input-z6dp4kfwq"
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="搜索对话内容、标题或标签..."
          @input="debouncedSearch"
          @keydown.enter="performSearch"
          ref="searchInput"
         aria-label="输入框">
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="clear-btn"
          title="清除搜索"
         aria-label="按钮">
          <X :size="16" />
        </button>
      </div>

      <!-- 搜索选项切换 -->
      <button
        @click="toggleAdvancedOptions"
        class="options-toggle"
        :class="{ active: showAdvancedOptions }"
       aria-label="按钮">
        <Settings :size="16" />
        <span>高级选项</span>
        <ChevronDown :size="14" :class="{ rotated: showAdvancedOptions }" />
      </button>
    </div>

    <!-- 高级搜索选项 -->
    <Transition name="slide-down">
      <div v-if="showAdvancedOptions" class="advanced-options">
        <div class="options-grid">
          <!-- 时间范围 -->
          <div class="option-group">
            <label class="option-label">时间范围</label>
            <div class="time-range-options">
              <button
                v-for="range in timeRanges"
                :key="range.id"
                @click="setTimeRange(range)"
                :class="['time-btn', { active: selectedTimeRange === range.id }]"
               aria-label="按钮">
                {{ range.label }}
              </button>
            </div>
            <div v-if="selectedTimeRange === 'custom'" class="custom-date-range">
              <input id="input-gno7vbqir"
                v-model="customStartDate"
                type="date"
                class="date-input"
                @change="updateCustomDateRange"
               aria-label="输入框">
              <span class="date-separator">至</span>
              <input id="input-wbm1rn4wc"
                v-model="customEndDate"
                type="date"
                class="date-input"
                @change="updateCustomDateRange"
               aria-label="输入框">
            </div>
          </div>

          <!-- 搜索类型 -->
          <div class="option-group">
            <label class="option-label">搜索类型</label>
            <div class="search-type-options">
              <label v-for="type in searchTypes" :key="type.id" class="checkbox-label">
                <input id="input-y37s4sgvt"
                  v-model="selectedSearchTypes"
                  :value="type.id"
                  type="checkbox"
                  class="checkbox-input"
                 aria-label="输入框">
                <span class="checkbox-mark"></span>
                <span class="checkbox-text">{{ type.label }}</span>
              </label>
            </div>
          </div>

          <!-- 排序方式 -->
          <div class="option-group">
            <label class="option-label">排序方式</label>
            <select v-model="sortBy" class="sort-select" @change="performSearch">
              <option v-for="option in sortOptions" :key="option.id" :value="option.id">
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- 标签过滤 -->
          <div class="option-group">
            <label class="option-label">标签过滤</label>
            <div class="tags-filter">
              <div class="selected-tags">
                <span
                  v-for="tag in selectedTags"
                  :key="tag"
                  class="selected-tag"
                  @click="removeTag(tag)"
                >
                  {{ tag }}
                  <X :size="12" />
                </span>
              </div>
              <input id="input-47orj8s8o"
                v-model="tagInput"
                type="text"
                class="tag-input"
                placeholder="输入标签..."
                @keydown.enter="addTag"
                @keydown comma="addTag"
               aria-label="输入框">
            </div>
          </div>
        </div>

        <!-- 快速过滤器 -->
        <div class="quick-filters">
          <div class="filter-group">
            <span class="filter-label">快速筛选:</span>
            <button
              v-for="filter in quickFilters"
              :key="filter.id"
              @click="applyQuickFilter(filter)"
              :class="['quick-filter-btn', { active: activeQuickFilter === filter.id }]"
             aria-label="按钮">
              {{ filter.label }}
            </button>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="options-actions">
          <button @click="resetFilters" class="reset-btn" aria-label="按钮">
            <RotateCcw :size="14" />
            重置筛选
          </button>
          <button @click="performSearch" class="search-btn" aria-label="按钮">
            <Search :size="14" />
            搜索
          </button>
        </div>
      </div>
    </Transition>

    <!-- 搜索结果统计 -->
    <div v-if="hasSearched" class="search-stats">
      <div class="stats-info">
        <span class="stats-text">
          找到 <strong>{{ totalResults }}</strong> 个结果
          <span v-if="searchTime">（用时 {{ searchTime }}ms）</span>
        </span>
        <div v-if="totalResults > 0" class="stats-actions">
          <button @click="exportResults" class="export-results-btn" aria-label="按钮">
            <Download :size="14" />
            导出结果
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import {
  Search,
  X,
  Settings,
  ChevronDown,
  RotateCcw,
  Download
} from 'lucide-vue-next'

// 时间范围选项
const timeRanges = [
  { id: 'all', label: '全部时间' },
  { id: 'today', label: '今天' },
  { id: 'week', label: '本周' },
  { id: 'month', label: '本月' },
  { id: 'year', label: '今年' },
  { id: 'custom', label: '自定义' }
]

// 搜索类型选项
const searchTypes = [
  { id: 'content', label: '消息内容' },
  { id: 'title', label: '对话标题' },
  { id: 'tags', label: '标签' },
  { id: 'sender', label: '发送者' }
]

// 排序选项
const sortOptions = [
  { id: 'relevance', label: '相关度' },
  { id: 'date_desc', label: '最新优先' },
  { id: 'date_asc', label: '最早优先' },
  { id: 'title', label: '标题排序' }
]

// 快速过滤器
const quickFilters = [
  { id: 'unread', label: '未读' },
  { id: 'starred', label: '已收藏' },
  { id: 'long', label: '长对话' },
  { id: 'recent', label: '最近回复' },
  { id: 'images', label: '包含图片' }
]

// 响应式数据
const searchQuery = ref('')
const showAdvancedOptions = ref(false)
const selectedTimeRange = ref('all')
const customStartDate = ref('')
const customEndDate = ref('')
const selectedSearchTypes = ref(['content', 'title', 'tags'])
const sortBy = ref('relevance')
const selectedTags = ref<string[]>([])
const tagInput = ref('')
const activeQuickFilter = ref('')
const hasSearched = ref(false)
const totalResults = ref(0)
const searchTime = ref(0)
const searchInput = ref<HTMLInputElement>()

// 计算属性
const debouncedSearch = (() => {
  let timeoutId: NodeJS.Timeout
  return () => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      if (searchQuery.value.trim()) {
        performSearch()
      }
    }, 300)
  }
})()

// 方法
const toggleAdvancedOptions = () => {
  showAdvancedOptions.value = !showAdvancedOptions.value
}

const clearSearch = () => {
  searchQuery.value = ''
  resetFilters()
  hasSearched.value = false
  totalResults.value = 0
  searchTime.value = 0
}

const setTimeRange = (range: any) => {
  selectedTimeRange.value = range.id
  if (range.id !== 'custom') {
    performSearch()
  }
}

const updateCustomDateRange = () => {
  if (selectedTimeRange.value === 'custom' && customStartDate.value && customEndDate.value) {
    performSearch()
  }
}

const addTag = (event?: KeyboardEvent) => {
  const tag = tagInput.value.trim()
  if (tag && !selectedTags.value.includes(tag)) {
    selectedTags.value.push(tag)
    tagInput.value = ''
    performSearch()
  }
}

const removeTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
    performSearch()
  }
}

const applyQuickFilter = (filter: any) => {
  if (activeQuickFilter.value === filter.id) {
    activeQuickFilter.value = ''
  } else {
    activeQuickFilter.value = filter.id
  }
  performSearch()
}

const resetFilters = () => {
  selectedTimeRange.value = 'all'
  customStartDate.value = ''
  customEndDate.value = ''
  selectedSearchTypes.value = ['content', 'title', 'tags']
  sortBy.value = 'relevance'
  selectedTags.value = []
  tagInput.value = ''
  activeQuickFilter.value = ''
  performSearch()
}

const performSearch = async () => {
  if (!searchQuery.value.trim()) return

  const startTime = Date.now()
  hasSearched.value = true

  try {
    // 构建搜索参数
    const searchParams = {
      query: searchQuery.value,
      timeRange: selectedTimeRange.value,
      startDate: customStartDate.value,
      endDate: customEndDate.value,
      searchTypes: selectedSearchTypes.value,
      sortBy: sortBy.value,
      tags: selectedTags.value,
      quickFilter: activeQuickFilter.value
    }

    // 执行搜索
    console.log('Performing search with params:', searchParams)

    // 模拟搜索结果
    // 这里应该调用实际的搜索服务
    await new Promise(resolve => setTimeout(resolve, 100))

    totalResults.value = Math.floor(Math.random() * 100) + 1
    searchTime.value = Date.now() - startTime

    // 触发搜索结果更新事件
    emit('search-results', {
      query: searchQuery.value,
      totalResults: totalResults.value,
      searchTime: searchTime.value,
      params: searchParams
    })

  } catch (error) {
    console.error('Search failed:', error)
    totalResults.value = 0
    searchTime.value = 0
  }
}

const exportResults = () => {
  // 导出搜索结果的逻辑
  console.log('Exporting search results...')
  // 这里应该实现导出功能
}

// 事件定义
defineEmits<{
  'search-results': [results: {
    query: string
    totalResults: number
    searchTime: number
    params: any
  }]
}>()

// 生命周期
onMounted(() => {
  nextTick(() => {
    if (searchInput.value) {
      searchInput.value.focus()
    }
  })
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
.advanced-search-panel {
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  overflow: hidden;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid hsl(var(--border) / 0.1);
}

.search-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: hsl(var(--muted-foreground));
  z-index: 1;
}

.search-input {
  flex: 1;
  height: 40px;
  padding: 0 40px 0 44px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  font-size: 14px;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  outline: none;
  transition: all 0.15s ease;
}

.search-input:focus {
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}

.clear-btn {
  position: absolute;
  right: 12px;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  transition: all 0.15s ease;
}

.clear-btn:hover {
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
}

.options-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.options-toggle:hover {
  background: hsl(var(--muted) / 0.5);
}

.options-toggle.active {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-color: hsl(var(--primary));
}

.rotated {
  transform: rotate(180deg);
}

.advanced-options {
  padding: 20px;
  border-top: 1px solid hsl(var(--border) / 0.1);
  background: hsl(var(--muted) / 0.1);
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-label {
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.time-range-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.time-btn {
  padding: 6px 12px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.time-btn:hover {
  background: hsl(var(--muted) / 0.5);
}

.time-btn.active {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-color: hsl(var(--primary));
}

.custom-date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.date-input {
  padding: 6px 8px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: 13px;
}

.date-separator {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.search-type-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: hsl(var(--foreground));
}

.checkbox-input {
  display: none;
}

.checkbox-mark {
  width: 16px;
  height: 16px;
  border: 1px solid hsl(var(--border));
  border-radius: 4px;
  background: hsl(var(--background));
  position: relative;
  transition: all 0.15s ease;
}

.checkbox-input:checked + .checkbox-mark {
  background: hsl(var(--primary));
  border-color: hsl(var(--primary));
}

.checkbox-input:checked + .checkbox-mark::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: hsl(var(--primary-foreground));
  font-size: 12px;
  font-weight: bold;
}

.sort-select {
  padding: 8px 12px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: 14px;
  cursor: pointer;
}

.tags-filter {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.selected-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.selected-tag:hover {
  background: hsl(var(--primary) / 0.2);
}

.tag-input {
  padding: 6px 8px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: 13px;
}

.quick-filters {
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.quick-filter-btn {
  padding: 6px 12px;
  border: 1px solid hsl(var(--border));
  border-radius: 16px;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.quick-filter-btn:hover {
  background: hsl(var(--muted) / 0.5);
}

.quick-filter-btn.active {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-color: hsl(var(--primary));
}

.options-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.reset-btn,
.search-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.reset-btn {
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
}

.reset-btn:hover {
  background: hsl(var(--muted) / 0.7);
}

.search-btn {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-color: hsl(var(--primary));
}

.search-btn:hover {
  background: hsl(var(--primary) / 0.9);
}

.search-stats {
  padding: 12px 16px;
  border-top: 1px solid hsl(var(--border) / 0.1);
  background: hsl(var(--muted) / 0.05);
}

.stats-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.stats-text {
  font-size: 14px;
  color: hsl(var(--muted-foreground));
}

.stats-text strong {
  color: hsl(var(--foreground));
}

.export-results-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.export-results-btn:hover {
  background: hsl(var(--muted) / 0.5);
}

/* 动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .options-toggle {
    justify-content: center;
  }

  .options-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .time-range-options {
    justify-content: center;
  }

  .stats-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
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
