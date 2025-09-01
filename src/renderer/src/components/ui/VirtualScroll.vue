<template>
  <div
    ref="containerRef"
    class="virtual-scroll-container"
    :style="{ height: containerHeight + 'px' }"
    @scroll="handleScroll"
  >
    <!-- Spacer for items before visible range -->
    <div v-if="startIndex > 0" :style="{ height: startOffset + 'px' }" class="virtual-spacer-top" />

    <!-- Visible items -->
    <div
      v-for="(item, index) in visibleItems"
      :key="getItemKey(item, startIndex + index)"
      :data-index="startIndex + index"
      class="virtual-item"
      :style="getItemStyle(startIndex + index)"
    >
      <slot :item="item" :index="startIndex + index" :is-visible="true" />
    </div>

    <!-- Spacer for items after visible range -->
    <div
      v-if="endIndex < items.length - 1"
      :style="{ height: endOffset + 'px' }"
      class="virtual-spacer-bottom"
    />

    <!-- Loading indicator for dynamic loading -->
    <div v-if="hasMore && endIndex >= items.length - loadThreshold" class="virtual-loading">
      <slot name="loading">
        <div class="loading-spinner">Loading more...</div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import {
  rafThrottle,
  calculateVirtualScrollRange,
  debounce,
  OptimizedCache,
  memoryManager
} from '@renderer/src/utils/performance'

interface Props {
  items: any[]
  itemHeight: number | ((item: any, index: number) => number)
  containerHeight: number
  buffer?: number
  keyField?: string
  hasMore?: boolean
  loadThreshold?: number
  estimatedItemHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  buffer: 5,
  keyField: 'id',
  hasMore: false,
  loadThreshold: 10,
  estimatedItemHeight: 50
})

const emit = defineEmits<{
  'load-more': []
  scroll: [scrollTop: number, scrollHeight: number, clientHeight: number]
  'item-rendered': [item: any, index: number]
}>()

// Refs
const containerRef = ref<HTMLElement>()

// State with optimized caching
const scrollTop = ref(0)
const measuredHeights = ref(new OptimizedCache<number, number>(1000, 10 * 60 * 1000)) // 10 minutes cache
const isScrolling = ref(false)
const scrollTimer = ref<NodeJS.Timeout>()
const renderCache = ref(new OptimizedCache<string, any>(500, 5 * 60 * 1000)) // 5 minutes cache
const isInitialized = ref(false)

// Computed properties
const totalHeight = computed(() => {
  if (typeof props.itemHeight === 'number') {
    return props.items.length * props.itemHeight
  }

  let height = 0
  for (let i = 0; i < props.items.length; i++) {
    const measured = measuredHeights.value.get(i)
    if (measured !== undefined) {
      height += measured
    } else {
      height += props.estimatedItemHeight
    }
  }
  return height
})

const virtualRange = computed(() => {
  if (typeof props.itemHeight === 'number') {
    return calculateVirtualScrollRange(scrollTop.value, props.items.length, {
      itemHeight: props.itemHeight,
      containerHeight: props.containerHeight,
      buffer: props.buffer
    })
  }

  // Variable height calculation
  let currentHeight = 0
  let startIndex = 0
  let endIndex = 0
  let foundStart = false

  const visibleTop = scrollTop.value
  const visibleBottom = scrollTop.value + props.containerHeight

  for (let i = 0; i < props.items.length; i++) {
    const itemHeight = measuredHeights.value.get(i) || props.estimatedItemHeight
    const itemTop = currentHeight
    const itemBottom = currentHeight + itemHeight

    if (!foundStart && itemBottom > visibleTop - props.buffer * props.estimatedItemHeight) {
      startIndex = Math.max(0, i - props.buffer)
      foundStart = true
    }

    if (itemTop <= visibleBottom + props.buffer * props.estimatedItemHeight) {
      endIndex = Math.min(props.items.length - 1, i + props.buffer)
    }

    currentHeight += itemHeight
  }

  return {
    startIndex,
    endIndex,
    offsetY: getOffsetForIndex(startIndex),
    visibleItems: endIndex - startIndex + 1
  }
})

const startIndex = computed(() => virtualRange.value.startIndex)
const endIndex = computed(() => virtualRange.value.endIndex)
const startOffset = computed(() => virtualRange.value.offsetY)
const endOffset = computed(() => {
  if (typeof props.itemHeight === 'number') {
    return (props.items.length - endIndex.value - 1) * props.itemHeight
  }

  let height = 0
  for (let i = endIndex.value + 1; i < props.items.length; i++) {
    height += measuredHeights.value.get(i) || props.estimatedItemHeight
  }
  return height
})

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value + 1)
})

// Helper functions
const getItemKey = (item: any, index: number) => {
  if (props.keyField && item[props.keyField] !== undefined) {
    return item[props.keyField]
  }
  return index
}

const getItemStyle = (index: number) => {
  const style: Record<string, string> = {}

  if (typeof props.itemHeight === 'number') {
    style.height = `${props.itemHeight}px`
  } else {
    const measured = measuredHeights.value.get(index)
    if (measured !== undefined) {
      style.height = `${measured}px`
    }
  }

  return style
}

const getOffsetForIndex = (index: number) => {
  if (typeof props.itemHeight === 'number') {
    return index * props.itemHeight
  }

  let offset = 0
  for (let i = 0; i < index; i++) {
    offset += measuredHeights.value.get(i) || props.estimatedItemHeight
  }
  return offset
}

const measureItems = () => {
  if (!containerRef.value || typeof props.itemHeight === 'number') return

  // Use ResizeObserver for more efficient measurements
  const items = containerRef.value.querySelectorAll('.virtual-item')
  items.forEach((element, index) => {
    const actualIndex = startIndex.value + index

    // Skip if already measured and element hasn't changed
    const currentHeight = measuredHeights.value.get(actualIndex)
    const rect = element.getBoundingClientRect()

    if (rect.height > 0 && rect.height !== currentHeight) {
      measuredHeights.value.set(actualIndex, rect.height)
      emit('item-rendered', props.items[actualIndex], actualIndex)
    }
  })

  // Cache will automatically clean up old entries based on OptimizedCache settings
}

// Optimized scroll handler with better performance
const handleScroll = rafThrottle((event: Event) => {
  const target = event.target as HTMLElement
  const newScrollTop = target.scrollTop

  // Skip if scroll position hasn't changed significantly
  if (Math.abs(newScrollTop - scrollTop.value) < 1 && isInitialized.value) {
    return
  }

  scrollTop.value = newScrollTop

  // Set scrolling state with optimized timer handling
  if (!isScrolling.value) {
    isScrolling.value = true
  }

  if (scrollTimer.value) {
    clearTimeout(scrollTimer.value)
  }

  scrollTimer.value = setTimeout(() => {
    isScrolling.value = false
    // Trigger measurement after scrolling stops
    nextTick(() => measureItems())
  }, 100) // Reduced timeout for better responsiveness

  // Emit scroll event (throttled)
  emit('scroll', newScrollTop, target.scrollHeight, target.clientHeight)

  // Optimized load more check
  if (props.hasMore && endIndex.value >= props.items.length - props.loadThreshold) {
    emit('load-more')
  }

  isInitialized.value = true
})

// Public methods
const scrollToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => {
  if (!containerRef.value) return

  const offset = getOffsetForIndex(index)
  containerRef.value.scrollTo({
    top: offset,
    behavior
  })
}

const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
  if (!containerRef.value) return

  containerRef.value.scrollTo({
    top: 0,
    behavior
  })
}

const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
  if (!containerRef.value) return

  containerRef.value.scrollTo({
    top: totalHeight.value,
    behavior
  })
}

// Optimized watcher for items changes
watch(
  () => props.items.length,
  (newLength, oldLength) => {
    // Batch DOM operations for better performance
    if (newLength > oldLength) {
      // Clear render cache when items are added
      renderCache.value.clear()

      nextTick(() => {
        measureItems()
      })
    }

    // Efficiently clear measurements for removed items
    if (newLength < oldLength) {
      const keysToDelete: number[] = []
      // OptimizedCache doesn't have forEach, need to iterate differently
      for (let index = newLength; index < oldLength; index++) {
        if (measuredHeights.value.has(index)) {
          keysToDelete.push(index)
        }
      }

      // Use batch deletion for better performance
      keysToDelete.forEach(key => {
        measuredHeights.value.delete(key)
        renderCache.value.delete(`item-${key}`)
      })
    }
  },
  { immediate: true }
)

// Optimized watcher for visible items with debouncing
const debouncedMeasure = debounce(() => {
  measureItems()
}, 16) // ~60fps

watch(
  visibleItems,
  () => {
    if (isScrolling.value) {
      // Don't measure while scrolling for better performance
      return
    }
    nextTick(debouncedMeasure)
  },
  { flush: 'post' }
)

// Lifecycle
onMounted(() => {
  nextTick(() => {
    measureItems()
  })
})

onUnmounted(() => {
  if (scrollTimer.value) {
    clearTimeout(scrollTimer.value)
  }

  // Cleanup memory caches
  measuredHeights.value.clear()
  renderCache.value.clear()
})

// Expose methods
defineExpose({
  scrollToIndex,
  scrollToTop,
  scrollToBottom,
  measureItems
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
.virtual-scroll-container {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  contain: layout style paint;
  will-change: scroll-position;
  /* Enhanced GPU acceleration */
  transform: translate3d(0, 0, 0);
  /* Improve scrolling performance */
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  /* Reduce layout thrashing */
  backface-visibility: hidden;
}

.virtual-item {
  contain: layout style paint;
  overflow-anchor: none;
  /* Enhanced rendering performance */
  transform: translateZ(0);
  will-change: transform;
  /* Reduce repaints */
  backface-visibility: hidden;
  /* Better text rendering */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.virtual-spacer-top,
.virtual-spacer-bottom {
  flex-shrink: 0;
  pointer-events: none;
}

.virtual-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  color: var(--color-textSecondary);
}

.loading-spinner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading-spinner::before {
  content: '';
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Performance optimizations */
.virtual-scroll-container {
  /* Enable hardware acceleration */
  transform: translateZ(0);
  /* Optimize scrolling */
  -webkit-overflow-scrolling: touch;
  /* Reduce repaints */
  overscroll-behavior: contain;
}

.virtual-item {
  /* Optimize rendering */
  transform: translateZ(0);
  /* Reduce layout calculations */
  contain: layout style paint;
}

/* Smooth scrolling behavior */
@media (prefers-reduced-motion: no-preference) {
  .virtual-scroll-container {
    scroll-behavior: smooth;
  }
}

/* Custom scrollbar */
.virtual-scroll-container::-webkit-scrollbar {
  width: 8px;
}

.virtual-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.virtual-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(var(--color-textSecondary-rgb), 0.3);
  border-radius: 4px;
}

.virtual-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--color-textSecondary-rgb), 0.5);
}

/* Dark theme support */
:root[data-theme='dark'] .virtual-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

:root[data-theme='dark'] .virtual-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}


/* 焦点样式 */
:focus-visible {
  outline: 2px solid hsl(var(--ring, 59 130 230));
  outline-offset: 2px;
}</style>
