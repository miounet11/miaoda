<template>
  <button
    class="action-button group/btn"
    :class="buttonClasses"
    :disabled="disabled"
    :title="tooltip"
    @click="$emit('click')"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Icon with dynamic loading -->
    <component 
      :is="iconComponent" 
      :size="iconSize" 
      :class="iconClasses"
    />
    
    <!-- Ripple effect -->
    <div 
      ref="rippleContainer"
      class="ripple-container absolute inset-0 rounded-inherit overflow-hidden pointer-events-none"
    >
      <div 
        v-for="ripple in ripples"
        :key="ripple.id"
        class="ripple absolute rounded-full bg-current opacity-20 animate-ping"
        :style="ripple.style"
      />
    </div>
    
    <!-- Hover background -->
    <div 
      class="hover-bg absolute inset-0 rounded-inherit bg-current opacity-0 transition-opacity duration-200"
      :class="{ 'opacity-10': isHovered && !disabled }"
    />
  </button>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import {
  Copy, Edit3, RefreshCw, MoreHorizontal, Volume2, Reply,
  Bookmark, Trash2, Heart, Share, Download, Maximize2,
  Minimize2, Play, Pause, RotateCcw, Eye, EyeOff, Loader2
} from 'lucide-vue-next'

interface Ripple {
  id: number
  style: {
    left: string
    top: string
    width: string
    height: string
  }
}

interface Props {
  icon: string
  tooltip?: string
  active?: boolean
  disabled?: boolean
  variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tooltip: '',
  active: false,
  disabled: false,
  variant: 'default',
  size: 'md',
  loading: false
})

defineEmits<{
  click: []
}>()

// State
const isHovered = ref(false)
const ripples = ref<Ripple[]>([])
const rippleContainer = ref<HTMLElement>()
let rippleId = 0

// Icon mapping
const iconMap = {
  Copy, Edit3, RefreshCw, MoreHorizontal, Volume2, Reply,
  Bookmark, Trash2, Heart, Share, Download, Maximize2,
  Minimize2, Play, Pause, RotateCcw, Eye, EyeOff, Loader2
}

// Computed properties
const iconComponent = computed(() => {
  if (props.loading) return Loader2
  return iconMap[props.icon as keyof typeof iconMap] || Copy
})

const iconSize = computed(() => {
  switch (props.size) {
    case 'sm': return 12
    case 'lg': return 18
    default: return 14
  }
})

const buttonClasses = computed(() => {
  const base = [
    'relative flex items-center justify-center rounded-lg',
    'transition-all duration-200 ease-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'overflow-hidden select-none'
  ]

  // Size classes
  switch (props.size) {
    case 'sm':
      base.push('p-1')
      break
    case 'lg':
      base.push('p-3')
      break
    default:
      base.push('p-2')
  }

  // Variant classes
  if (props.active) {
    switch (props.variant) {
      case 'primary':
        base.push('bg-blue-100 text-blue-600 focus:ring-blue-500')
        break
      case 'danger':
        base.push('bg-red-100 text-red-600 focus:ring-red-500')
        break
      case 'success':
        base.push('bg-green-100 text-green-600 focus:ring-green-500')
        break
      default:
        base.push('bg-gray-100 text-gray-700 focus:ring-gray-500')
    }
  } else {
    switch (props.variant) {
      case 'primary':
        base.push('text-blue-600 hover:bg-blue-50 focus:ring-blue-500')
        break
      case 'danger':
        base.push('text-red-600 hover:bg-red-50 focus:ring-red-500')
        break
      case 'success':
        base.push('text-green-600 hover:bg-green-50 focus:ring-green-500')
        break
      default:
        base.push('text-gray-600 hover:bg-gray-50 focus:ring-gray-500')
    }
  }

  // Dark mode adjustments
  base.push('dark:text-gray-300 dark:hover:bg-gray-800/50')

  return base
})

const iconClasses = computed(() => [
  'transition-all duration-200',
  'group-hover/btn:scale-110',
  { 'animate-spin': props.loading }
])

// Methods
const createRipple = (event: MouseEvent) => {
  if (!rippleContainer.value || props.disabled) return

  const rect = rippleContainer.value.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height) * 2
  const left = event.clientX - rect.left - size / 2
  const top = event.clientY - rect.top - size / 2

  const ripple: Ripple = {
    id: rippleId++,
    style: {
      left: `${left}px`,
      top: `${top}px`,
      width: `${size}px`,
      height: `${size}px`
    }
  }

  ripples.value.push(ripple)

  // Remove ripple after animation
  setTimeout(() => {
    const index = ripples.value.findIndex(r => r.id === ripple.id)
    if (index > -1) {
      ripples.value.splice(index, 1)
    }
  }, 600)
}

// Add click handler for ripple effect
const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    createRipple(event)
    nextTick(() => {
      // Emit click after ripple is created
    })
  }
}

// Expose method for programmatic ripple creation
defineExpose({
  createRipple
})
</script>

<style scoped>
.action-button {
  transform: scale(1);
  backdrop-filter: blur(8px);
}

.action-button:hover:not(:disabled) {
  transform: scale(1.05);
}

.action-button:active:not(:disabled) {
  transform: scale(0.95);
}

.action-button:focus-visible {
  ring-width: 2px;
  ring-offset-width: 1px;
}

/* Ripple animation */
.ripple {
  animation: rippleEffect 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

@keyframes rippleEffect {
  0% {
    transform: scale(0);
    opacity: 0.3;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* Enhanced hover states */
.action-button:hover .hover-bg {
  opacity: 0.1;
}

.action-button:active .hover-bg {
  opacity: 0.2;
}

/* Accessibility improvements */
.action-button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .action-button {
    border: 1px solid currentColor;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .action-button,
  .ripple,
  * {
    animation: none !important;
    transition: none !important;
  }
}

/* RTL support */
[dir="rtl"] .action-button {
  transform: scaleX(-1);
}

[dir="rtl"] .action-button > * {
  transform: scaleX(-1);
}
</style>