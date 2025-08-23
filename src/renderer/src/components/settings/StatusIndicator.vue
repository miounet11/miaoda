<template>
  <div
    class="status-indicator inline-flex items-center gap-2"
    :class="containerClasses"
    :title="tooltip"
  >
    <!-- Status Dot -->
    <div class="rounded-full transition-all duration-300" :class="dotClasses">
      <!-- Loading spinner for configuring state -->
      <Loader2
        v-if="status === 'configuring'"
        :size="dotSize"
        class="animate-spin text-yellow-600"
      />
      <!-- Error icon for error state -->
      <AlertCircle v-else-if="status === 'error'" :size="dotSize" class="text-red-600" />
      <!-- Success icon for connected state -->
      <CheckCircle v-else-if="status === 'connected'" :size="dotSize" class="text-green-600" />
      <!-- Default dot for disconnected state -->
      <div
        v-else
        class="w-full h-full rounded-full"
        :class="statusColors[status]?.bg || 'bg-gray-400'"
      />
    </div>

    <!-- Status Text -->
    <span v-if="showText" class="text-sm font-medium transition-colors" :class="textClasses">
      {{ statusText }}
    </span>

    <!-- Badge Style -->
    <template v-if="variant === 'badge'">
      <span class="px-2 py-1 rounded-full text-xs font-medium" :class="badgeClasses">
        {{ statusText }}
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-vue-next'
import type { ProviderStatus } from '@renderer/src/types/api'

interface Props {
  status: ProviderStatus
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'dot' | 'badge' | 'pill'
  showText?: boolean
  showIcon?: boolean
  pulse?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'dot',
  showText: false,
  showIcon: true,
  pulse: true
})

// Status configurations
const statusColors = {
  connected: {
    bg: 'bg-green-500',
    text: 'text-green-600',
    badge: 'bg-green-500/10 text-green-600 border-green-500/20'
  },
  disconnected: {
    bg: 'bg-gray-400',
    text: 'text-gray-600',
    badge: 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  },
  error: {
    bg: 'bg-red-500',
    text: 'text-red-600',
    badge: 'bg-red-500/10 text-red-600 border-red-500/20'
  },
  configuring: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-600',
    badge: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
  }
}

const statusTexts = {
  connected: 'Connected',
  disconnected: 'Disconnected',
  error: 'Error',
  configuring: 'Configuring'
}

const sizeMap = {
  xs: { dot: 'w-2 h-2', icon: 8, container: 'text-xs' },
  sm: { dot: 'w-3 h-3', icon: 12, container: 'text-sm' },
  md: { dot: 'w-4 h-4', icon: 16, container: 'text-base' },
  lg: { dot: 'w-5 h-5', icon: 20, container: 'text-lg' }
}

// Computed properties
const statusText = computed(() => statusTexts[props.status])

const dotSize = computed(() => sizeMap[props.size].icon)

const containerClasses = computed(() => [
  sizeMap[props.size].container,
  {
    'flex-col': props.variant === 'pill',
    'gap-1': props.size === 'xs' || props.size === 'sm'
  }
])

const dotClasses = computed(() => {
  const baseClasses = ['flex items-center justify-center', sizeMap[props.size].dot]

  // Add pulse animation for certain states
  if (props.pulse) {
    if (props.status === 'connected') {
      baseClasses.push('animate-pulse-green')
    } else if (props.status === 'configuring') {
      baseClasses.push('animate-pulse-yellow')
    } else if (props.status === 'error') {
      baseClasses.push('animate-pulse-red')
    }
  }

  return baseClasses
})

const textClasses = computed(() => [statusColors[props.status]?.text || 'text-gray-600'])

const badgeClasses = computed(() => [
  'border',
  statusColors[props.status]?.badge || 'bg-gray-500/10 text-gray-600 border-gray-500/20'
])

const tooltip = computed(() => {
  const tooltips = {
    connected: 'Provider is connected and ready to use',
    disconnected: 'Provider is not connected',
    error: 'Connection error - check configuration',
    configuring: 'Setting up connection...'
  }
  return tooltips[props.status]
})
</script>

<style scoped>
/* Custom pulse animations */
@keyframes pulse-green {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
    opacity: 1;
  }
  50% {
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0);
    opacity: 0.8;
  }
}

@keyframes pulse-yellow {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4);
    opacity: 1;
  }
  50% {
    box-shadow: 0 0 0 4px rgba(234, 179, 8, 0);
    opacity: 0.8;
  }
}

@keyframes pulse-red {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
    opacity: 1;
  }
  50% {
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0);
    opacity: 0.8;
  }
}

.animate-pulse-green {
  animation: pulse-green 2s infinite;
}

.animate-pulse-yellow {
  animation: pulse-yellow 2s infinite;
}

.animate-pulse-red {
  animation: pulse-red 2s infinite;
}

/* Smooth transitions */
.status-indicator * {
  transition: all 0.3s ease;
}

/* Hover effects for interactive elements */
.status-indicator:hover .rounded-full {
  transform: scale(1.1);
}

/* Accessibility improvements */
.status-indicator:focus {
  outline: 2px solid rgba(var(--primary-rgb), 0.6);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Dark mode optimizations */
@media (prefers-color-scheme: dark) {
  .status-indicator {
    filter: brightness(1.1);
  }
}
</style>
