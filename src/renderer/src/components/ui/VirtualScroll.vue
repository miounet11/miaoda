<template>
  <div
    ref="containerRef"
    class="virtual-scroll-container"
    :style="{ height: containerHeight + 'px' }"
    @scroll="handleScroll"
  >
    <!-- Spacer for items before visible range -->
    <div 
      v-if="startIndex > 0"
      :style="{ height: startOffset + 'px' }"
      class="virtual-spacer-top"
    />
    
    <!-- Visible items -->
    <div
      v-for="(item, index) in visibleItems"
      :key="getItemKey(item, startIndex + index)"
      :data-index="startIndex + index"
      class="virtual-item"
      :style="getItemStyle(startIndex + index)"
    >
      <slot
        :item="item"
        :index="startIndex + index"
        :is-visible="true"
      />
    </div>
    
    <!-- Spacer for items after visible range -->
    <div 
      v-if="endIndex < items.length - 1"
      :style="{ height: endOffset + 'px' }"
      class="virtual-spacer-bottom"
    />
    
    <!-- Loading indicator for dynamic loading -->
    <div
      v-if="hasMore && endIndex >= items.length - loadThreshold"
      class="virtual-loading"
    >
      <slot name="loading">
        <div class="loading-spinner">Loading more...</div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { rafThrottle, calculateVirtualScrollRange } from '@renderer/src/utils/performance'

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
  'scroll': [scrollTop: number, scrollHeight: number, clientHeight: number]
  'item-rendered': [item: any, index: number]
}>()

// Refs
const containerRef = ref<HTMLElement>()

// State
const scrollTop = ref(0)
const measuredHeights = ref(new Map<number, number>())
const isScrolling = ref(false)
const scrollTimer = ref<NodeJS.Timeout>()

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
  
  const items = containerRef.value.querySelectorAll('.virtual-item')
  items.forEach((element, index) => {
    const actualIndex = startIndex.value + index
    const height = element.getBoundingClientRect().height
    
    if (height > 0) {
      measuredHeights.value.set(actualIndex, height)
      emit('item-rendered', props.items[actualIndex], actualIndex)
    }
  })
}

// Throttled scroll handler
const handleScroll = rafThrottle((event: Event) => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
  
  // Set scrolling state
  isScrolling.value = true
  if (scrollTimer.value) {
    clearTimeout(scrollTimer.value)
  }
  
  scrollTimer.value = setTimeout(() => {
    isScrolling.value = false
  }, 150)
  
  // Emit scroll event
  emit('scroll', target.scrollTop, target.scrollHeight, target.clientHeight)
  
  // Check if we need to load more items
  if (props.hasMore && endIndex.value >= props.items.length - props.loadThreshold) {
    emit('load-more')
  }
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

// Watch for items changes
watch(() => props.items.length, (newLength, oldLength) => {
  // If items were added, measure them
  if (newLength > oldLength) {
    nextTick(() => {
      measureItems()
    })
  }
  
  // Clear measurements for removed items
  if (newLength < oldLength) {
    const keysToDelete: number[] = []
    measuredHeights.value.forEach((_, index) => {
      if (index >= newLength) {
        keysToDelete.push(index)
      }
    })
    keysToDelete.forEach(key => measuredHeights.value.delete(key))
  }
}, { immediate: true })

// Watch for visible items changes to trigger measurements
watch(visibleItems, () => {
  nextTick(() => {
    measureItems()
  })
}, { flush: 'post' })

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
.virtual-scroll-container {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  contain: layout style paint;
  will-change: scroll-position;
}

.virtual-item {
  contain: layout style paint;
  overflow-anchor: none;
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
:root[data-theme="dark"] .virtual-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

:root[data-theme="dark"] .virtual-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>