<template>
  <div class="tooltip-wrapper relative inline-flex">
    <div
      ref="trigger"
      @mouseenter="showTooltip"
      @mouseleave="hideTooltip"
      @focus="showTooltip"
      @blur="hideTooltip"
    >
      <slot />
    </div>

    <Teleport to="body">
      <Transition name="tooltip">
        <div
          v-if="isVisible"
          ref="tooltip"
          :style="tooltipStyle"
          :class="[
            'tooltip fixed z-50 px-2 py-1 text-xs rounded-md shadow-lg pointer-events-none',
            'bg-foreground/90 text-background backdrop-blur-sm',
            'max-w-xs break-words'
          ]"
        >
          {{ content }}
          <div
            class="tooltip-arrow absolute w-2 h-2 bg-foreground/90 transform rotate-45"
            :class="arrowClass"
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

interface Props {
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

const props = withDefaults(defineProps<Props>(), {
  placement: 'top',
  delay: 500
})

const trigger = ref<HTMLElement>()
const tooltip = ref<HTMLElement>()
const isVisible = ref(false)
const tooltipPosition = ref({ top: 0, left: 0 })
let showTimeout: NodeJS.Timeout | null = null
let hideTimeout: NodeJS.Timeout | null = null

const tooltipStyle = computed(() => ({
  top: `${tooltipPosition.value.top}px`,
  left: `${tooltipPosition.value.left}px`
}))

const arrowClass = computed(() => {
  switch (props.placement) {
    case 'top':
      return 'bottom-[-4px] left-1/2 -translate-x-1/2'
    case 'bottom':
      return 'top-[-4px] left-1/2 -translate-x-1/2'
    case 'left':
      return 'right-[-4px] top-1/2 -translate-y-1/2'
    case 'right':
      return 'left-[-4px] top-1/2 -translate-y-1/2'
    default:
      return ''
  }
})

const calculatePosition = async () => {
  if (!trigger.value) return

  await nextTick()

  const triggerRect = trigger.value.getBoundingClientRect()
  const tooltipRect = tooltip.value?.getBoundingClientRect() || { width: 0, height: 0 }
  const spacing = 8

  let top = 0
  let left = 0

  switch (props.placement) {
    case 'top':
      top = triggerRect.top - tooltipRect.height - spacing
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
      break
    case 'bottom':
      top = triggerRect.bottom + spacing
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
      break
    case 'left':
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
      left = triggerRect.left - tooltipRect.width - spacing
      break
    case 'right':
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
      left = triggerRect.right + spacing
      break
  }

  // 边界检查
  const padding = 8
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // 水平边界
  if (left < padding) {
    left = padding
  } else if (left + tooltipRect.width > viewportWidth - padding) {
    left = viewportWidth - tooltipRect.width - padding
  }

  // 垂直边界
  if (top < padding) {
    top = padding
  } else if (top + tooltipRect.height > viewportHeight - padding) {
    top = viewportHeight - tooltipRect.height - padding
  }

  tooltipPosition.value = { top, left }
}

const showTooltip = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }

  showTimeout = setTimeout(() => {
    isVisible.value = true
    calculatePosition()
  }, props.delay)
}

const hideTooltip = () => {
  if (showTimeout) {
    clearTimeout(showTimeout)
    showTimeout = null
  }

  hideTimeout = setTimeout(() => {
    isVisible.value = false
  }, 100)
}
</script>

<style scoped>
.tooltip-enter-active,
.tooltip-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.tooltip-enter-from {
  opacity: 0;
  transform: translateY(2px);
}

.tooltip-leave-to {
  opacity: 0;
  transform: translateY(-2px);
}
</style>
