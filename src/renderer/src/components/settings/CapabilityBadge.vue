<template>
  <div
    class="capability-badge inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-105"
    :class="badgeClasses"
    :title="tooltip"
  >
    <!-- Icon -->
    <component 
      v-if="showIcon && capabilityConfig.icon" 
      :is="capabilityConfig.icon" 
      :size="12" 
      class="flex-shrink-0"
    />
    
    <!-- Text -->
    <span class="truncate">{{ capabilityConfig.label }}</span>
    
    <!-- Optional status indicator -->
    <div
      v-if="showStatus"
      class="w-1.5 h-1.5 rounded-full flex-shrink-0"
      :class="statusClasses"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  MessageSquare, 
  Zap, 
  Wrench, 
  Image, 
  Mic, 
  Volume2, 
  Video, 
  FileText, 
  Thermometer, 
  Target, 
  Hash,
  Repeat,
  RotateCcw
} from 'lucide-vue-next'

interface Props {
  capability: string
  variant?: 'default' | 'success' | 'warning' | 'info' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  showStatus?: boolean
  status?: 'active' | 'inactive' | 'partial'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  showIcon: true,
  showStatus: false,
  status: 'active'
})

// Capability configurations with icons and colors
const capabilityConfigs = {
  chat: {
    label: 'Chat',
    icon: MessageSquare,
    description: 'Basic chat completion support',
    variant: 'success'
  },
  streaming: {
    label: 'Streaming',
    icon: Zap,
    description: 'Real-time response streaming',
    variant: 'info'
  },
  toolCalling: {
    label: 'Tools',
    icon: Wrench,
    description: 'Function and tool execution',
    variant: 'warning'
  },
  imageInput: {
    label: 'Image Input',
    icon: Image,
    description: 'Can process image uploads',
    variant: 'info'
  },
  imageOutput: {
    label: 'Image Gen',
    icon: Image,
    description: 'Can generate images',
    variant: 'success'
  },
  audioInput: {
    label: 'Voice Input',
    icon: Mic,
    description: 'Voice input support',
    variant: 'info'
  },
  audioOutput: {
    label: 'Voice Output',
    icon: Volume2,
    description: 'Text-to-speech support',
    variant: 'success'
  },
  videoInput: {
    label: 'Video',
    icon: Video,
    description: 'Video content understanding',
    variant: 'warning'
  },
  systemMessages: {
    label: 'System',
    icon: FileText,
    description: 'Custom system prompts',
    variant: 'default'
  },
  temperature: {
    label: 'Temperature',
    icon: Thermometer,
    description: 'Response randomness control',
    variant: 'secondary'
  },
  topP: {
    label: 'Top-P',
    icon: Target,
    description: 'Nucleus sampling',
    variant: 'secondary'
  },
  topK: {
    label: 'Top-K',
    icon: Hash,
    description: 'Top-K sampling',
    variant: 'secondary'
  },
  presencePenalty: {
    label: 'Presence',
    icon: Repeat,
    description: 'Reduce repetition',
    variant: 'secondary'
  },
  frequencyPenalty: {
    label: 'Frequency',
    icon: RotateCcw,
    description: 'Penalize frequent tokens',
    variant: 'secondary'
  }
}

// Variant color schemes
const variantStyles = {
  default: {
    base: 'bg-muted/50 text-muted-foreground border-muted-foreground/20 hover:bg-muted/70',
    active: 'bg-muted/50 text-foreground border-muted-foreground/30'
  },
  success: {
    base: 'bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20',
    active: 'bg-green-500/15 text-green-800 border-green-500/30'
  },
  warning: {
    base: 'bg-orange-500/10 text-orange-700 border-orange-500/20 hover:bg-orange-500/20',
    active: 'bg-orange-500/15 text-orange-800 border-orange-500/30'
  },
  info: {
    base: 'bg-blue-500/10 text-blue-700 border-blue-500/20 hover:bg-blue-500/20',
    active: 'bg-blue-500/15 text-blue-800 border-blue-500/30'
  },
  secondary: {
    base: 'bg-purple-500/10 text-purple-700 border-purple-500/20 hover:bg-purple-500/20',
    active: 'bg-purple-500/15 text-purple-800 border-purple-500/30'
  }
}

// Size configurations
const sizeStyles = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
  lg: 'text-sm px-2.5 py-1.5'
}

// Computed properties
const capabilityConfig = computed(() => {
  const config = capabilityConfigs[props.capability as keyof typeof capabilityConfigs]
  return config || {
    label: props.capability,
    icon: FileText,
    description: `${props.capability} capability`,
    variant: 'default'
  }
})

const effectiveVariant = computed(() => {
  return props.variant === 'default' ? capabilityConfig.value.variant : props.variant
})

const badgeClasses = computed(() => {
  const variant = effectiveVariant.value
  const isActive = props.status === 'active'
  
  return [
    sizeStyles[props.size],
    isActive ? variantStyles[variant].active : variantStyles[variant].base,
    {
      'opacity-50': props.status === 'inactive',
      'opacity-75': props.status === 'partial'
    }
  ]
})

const statusClasses = computed(() => {
  switch (props.status) {
    case 'active':
      return 'bg-green-500'
    case 'partial':
      return 'bg-yellow-500'
    case 'inactive':
      return 'bg-red-500'
    default:
      return 'bg-gray-400'
  }
})

const tooltip = computed(() => {
  let tooltip = capabilityConfig.value.description
  
  if (props.showStatus) {
    const statusText = {
      active: 'Fully supported',
      partial: 'Partially supported',
      inactive: 'Not supported'
    }
    tooltip += ` - ${statusText[props.status]}`
  }
  
  return tooltip
})
</script>

<style scoped>
.capability-badge {
  user-select: none;
  cursor: default;
}

.capability-badge:hover {
  transform: scale(1.05);
}

/* Smooth transitions */
.capability-badge * {
  transition: all 0.2s ease;
}

/* Pulse animation for active status */
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.capability-badge[data-status="active"] {
  animation: pulse-subtle 3s infinite;
}

/* Focus states for accessibility */
.capability-badge:focus {
  outline: 2px solid rgba(var(--primary-rgb), 0.6);
  outline-offset: 2px;
  border-radius: 12px;
}

/* Dark mode optimizations */
@media (prefers-color-scheme: dark) {
  .capability-badge {
    filter: brightness(1.1);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .capability-badge {
    animation: none;
  }
  
  .capability-badge:hover {
    transform: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .capability-badge {
    border-width: 2px;
    font-weight: 600;
  }
}
</style>