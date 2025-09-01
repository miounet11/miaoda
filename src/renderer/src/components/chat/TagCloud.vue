<template>
  <div class="tag-cloud" v-if="showTagCloud">
    <!-- Header -->
    <div class="tag-cloud-header flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <Hash :size="16" class="text-muted-foreground" />
        <span class="text-sm font-medium text-muted-foreground">Topics</span>
        <span
          v-if="selectedTags.length > 0"
          class="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full"
        >
          {{ selectedTags.length }}
        </span>
      </div>

      <div class="flex items-center gap-1">
        <button
          v-if="selectedTags.length  aria-label="按钮"> 0"
          @click="clearSelection"
          class="text-xs text-muted-foreground hover:text-foreground transition-colors"
          title="Clear selection"
        >
          Clear
        </button>
        <button
          @click="toggleExpansion"
          class="p-1 hover:bg-accent rounded transition-colors"
          :title="isExpanded ? 'Collapse tags' : 'Expand tags'"
         aria-label="按钮">
          <ChevronDown v-if="isExpanded" :size="14" class="text-muted-foreground" />
          <ChevronRight v-else :size="14" class="text-muted-foreground" />
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="tag-loading">
      <div class="animate-pulse flex space-x-2">
        <div class="h-6 bg-accent rounded-full w-16" />
        <div class="h-6 bg-accent rounded-full w-20" />
        <div class="h-6 bg-accent rounded-full w-14" />
      </div>
    </div>

    <!-- Tag Cloud -->
    <div v-if="!isLoading && tags.length > 0" class="tag-content">
      <!-- Collapsed View -->
      <div v-if="!isExpanded" class="tag-cloud-collapsed">
        <div class="flex flex-wrap gap-1">
          <button
            v-for="tag in popularTags.slice(0, maxCollapsedTags)"
            :key="tag.name"
            @click="toggleTag(tag.name)"
            :class="[
              'tag-item inline-flex items-center px-2 py-1 text-xs rounded-full transition-all',
              isTagSelected(tag.name)
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-accent/50 text-foreground hover:bg-accent'
            ]"
            :title="`${tag.count} conversations`"
           aria-label="按钮">
            <span>{{ tag.name }}</span>
            <span v-if="showCounts" class="ml-1 text-xs opacity-75">({{ tag.count }})</span>
          </button>

          <button
            v-if="tags.length  aria-label="按钮"> maxCollapsedTags"
            @click="toggleExpansion"
            class="inline-flex items-center px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground hover:bg-accent transition-colors"
          >
            +{{ tags.length - maxCollapsedTags }} more
          </button>
        </div>
      </div>

      <!-- Expanded View -->
      <div v-if="isExpanded" class="tag-cloud-expanded space-y-3">
        <!-- Search Filter -->
        <div class="tag-search">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Filter tags..."
            class="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
           aria-label="输入框">
        </div>

        <!-- Tag Categories -->
        <div class="tag-categories">
          <!-- Popular Tags -->
          <div v-if="popularTags.length > 0" class="tag-category mb-3">
            <h4 class="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <TrendingUp :size="12" />
              Popular
            </h4>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="tag in filteredPopularTags"
                :key="tag.name"
                @click="toggleTag(tag.name)"
                :class="[
                  'tag-item inline-flex items-center px-2 py-1 text-xs rounded-full transition-all hover:scale-105',
                  isTagSelected(tag.name)
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : getTagStyle(tag)
                ]"
                :title="`${tag.count} conversations`"
               aria-label="按钮">
                <span>{{ tag.name }}</span>
                <span v-if="showCounts" class="ml-1 text-xs opacity-75">({{ tag.count }})</span>
              </button>
            </div>
          </div>

          <!-- Recent Tags -->
          <div v-if="recentTags.length > 0" class="tag-category">
            <h4 class="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Clock :size="12" />
              Recent
            </h4>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="tag in filteredRecentTags"
                :key="tag.name"
                @click="toggleTag(tag.name)"
                :class="[
                  'tag-item inline-flex items-center px-2 py-1 text-xs rounded-full transition-all',
                  isTagSelected(tag.name)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent/50 text-foreground hover:bg-accent'
                ]"
                :title="`${tag.count} conversations`"
               aria-label="按钮">
                <span>{{ tag.name }}</span>
                <span v-if="showCounts" class="ml-1 text-xs opacity-75">({{ tag.count }})</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Selected Tags Summary -->
        <div v-if="selectedTags.length > 0" class="selected-summary p-2 bg-primary/10 rounded-lg">
          <div class="text-xs text-muted-foreground mb-1">Selected filters:</div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="tag in selectedTags"
              :key="tag"
              class="inline-flex items-center px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full"
            >
              {{ tag }}
              <button
                @click="toggleTag(tag)"
                class="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5 transition-colors"
               aria-label="按钮">
                <X :size="10" />
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && tags.length === 0" class="tag-empty">
      <div class="text-center py-4 text-sm text-muted-foreground">
        <Hash :size="24" class="mx-auto mb-2 opacity-50" />
        <p>No tags available</p>
        <p class="text-xs mt-1">Tags will appear as you generate summaries</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Hash, ChevronDown, ChevronRight, TrendingUp, Clock, X } from 'lucide-vue-next'
import { SummaryService } from '@renderer/src/services/summary/SummaryService'

interface TagData {
  name: string
  count: number
  lastUsed?: Date
}

interface Props {
  showWhenEmpty?: boolean
  maxCollapsedTags?: number
  showCounts?: boolean
  autoExpand?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showWhenEmpty: false,
  maxCollapsedTags: 6,
  showCounts: true,
  autoExpand: false
})

const emit = defineEmits<{
  'tags-changed': [tags: string[]]
  'tag-clicked': [tag: string]
}>()

// State
const tags = ref<TagData[]>([])
const selectedTags = ref<string[]>([])
const isExpanded = ref(props.autoExpand)
const isLoading = ref(false)
const searchQuery = ref('')

// Service instance
const summaryService = SummaryService.getInstance()

// Computed
const showTagCloud = computed(() => {
  return props.showWhenEmpty || tags.value.length > 0
})

const popularTags = computed(() => {
  return [...tags.value].sort((a, b) => b.count - a.count).slice(0, 20) // Top 20 most popular tags
})

const recentTags = computed(() => {
  return [...tags.value]
    .filter(tag => tag.lastUsed)
    .sort((a, b) => (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0))
    .slice(0, 10) // Top 10 most recent tags
})

const filteredPopularTags = computed(() => {
  if (!searchQuery.value) return popularTags.value
  const query = searchQuery.value.toLowerCase()
  return popularTags.value.filter(tag => tag.name.toLowerCase().includes(query))
})

const filteredRecentTags = computed(() => {
  if (!searchQuery.value) return recentTags.value
  const query = searchQuery.value.toLowerCase()
  return recentTags.value.filter(tag => tag.name.toLowerCase().includes(query))
})

// Methods
const toggleExpansion = () => {
  isExpanded.value = !isExpanded.value
}

const toggleTag = (tagName: string) => {
  const index = selectedTags.value.indexOf(tagName)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tagName)
  }

  emit('tags-changed', [...selectedTags.value])
  emit('tag-clicked', tagName)
}

const isTagSelected = (tagName: string): boolean => {
  return selectedTags.value.includes(tagName)
}

const clearSelection = () => {
  selectedTags.value = []
  emit('tags-changed', [])
}

const getTagStyle = (tag: TagData): string => {
  const intensity = Math.min(tag.count / Math.max(...tags.value.map(t => t.count)), 1)

  if (intensity > 0.7) {
    return 'bg-primary/20 text-primary hover:bg-primary/30'
  } else if (intensity > 0.4) {
    return 'bg-primary/10 text-primary hover:bg-primary/20'
  } else {
    return 'bg-accent/50 text-foreground hover:bg-accent'
  }
}

const loadTags = async () => {
  try {
    isLoading.value = true
    const allTags = await summaryService.getAllTags()

    // Convert to TagData with mock counts (in real implementation, this would come from the backend)
    tags.value = allTags.map(tagName => ({
      name: tagName,
      count: Math.floor(Math.random() * 10) + 1, // Mock count
      lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
    }))
  } catch (error) {
    console.error('Failed to load tags:', error)
    tags.value = []
  } finally {
    isLoading.value = false
  }
}

const refreshTags = async () => {
  await loadTags()
}

// Expose methods for parent components
defineExpose({
  refreshTags,
  clearSelection,
  selectedTags: computed(() => selectedTags.value)
})

// Lifecycle
onMounted(() => {
  loadTags()
})

// Watchers
watch(searchQuery, newQuery => {
  // Auto-expand when searching
  if (newQuery && !isExpanded.value) {
    isExpanded.value = true
  }
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
.tag-cloud {
  @apply border-b pb-3 mb-3;
}

.tag-item {
  cursor: pointer;
  user-select: none;
}

.tag-item:hover {
  transform: translateY(-1px);
}

.tag-item:active {
  transform: translateY(0);
}

/* Search input focus styles */
.tag-search input:focus {
  @apply ring-2 ring-primary/20 border-primary;
}

/* Animation for expand/collapse */
.tag-cloud-expanded {
  animation: expandIn 0.2s ease-out;
}

.tag-cloud-collapsed {
  animation: collapseIn 0.2s ease-out;
}

@keyframes expandIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes collapseIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Loading animation */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
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
