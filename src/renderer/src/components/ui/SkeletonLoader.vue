<template>
  <div class="skeleton-loader" :class="[variant, size, className]">
    <!-- Message Skeleton -->
    <div v-if="variant === 'message'" class="space-y-4">
      <div v-for="i in count" :key="i" class="message-skeleton flex items-start gap-3">
        <!-- Avatar -->
        <div class="w-8 h-8 bg-muted/40 rounded-full animate-pulse" />
        
        <!-- Message Content -->
        <div class="flex-1 space-y-2">
          <div class="skeleton-line h-4 bg-muted/40 rounded w-3/4 animate-pulse" />
          <div class="skeleton-line h-4 bg-muted/30 rounded w-full animate-pulse" />
          <div class="skeleton-line h-4 bg-muted/20 rounded w-5/6 animate-pulse" />
          
          <!-- Code block simulation -->
          <div v-if="i % 3 === 0" class="mt-3 p-3 bg-muted/20 rounded-lg space-y-2 animate-pulse">
            <div class="skeleton-line h-3 bg-muted/40 rounded w-1/2" />
            <div class="skeleton-line h-3 bg-muted/30 rounded w-full" />
            <div class="skeleton-line h-3 bg-muted/30 rounded w-3/4" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Chat List Skeleton -->
    <div v-else-if="variant === 'chat-list'" class="space-y-2">
      <div v-for="i in count" :key="i" class="chat-skeleton p-3 rounded-xl border border-border/20">
        <div class="flex items-start gap-3">
          <div class="w-2 h-2 bg-muted/40 rounded-full mt-2 animate-pulse" />
          <div class="flex-1 space-y-2">
            <div class="skeleton-line h-4 bg-muted/40 rounded w-3/4 animate-pulse" />
            <div class="skeleton-line h-3 bg-muted/30 rounded w-1/2 animate-pulse" />
            <div class="skeleton-line h-3 bg-muted/20 rounded w-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Input Skeleton -->
    <div v-else-if="variant === 'input'" class="input-skeleton">
      <div class="flex items-end gap-3 p-4 bg-secondary/20 rounded-2xl border border-border/20">
        <div class="w-8 h-8 bg-muted/40 rounded-xl animate-pulse" />
        <div class="flex-1">
          <div class="skeleton-line h-10 bg-muted/30 rounded-xl animate-pulse" />
        </div>
        <div class="w-8 h-8 bg-muted/40 rounded-xl animate-pulse" />
        <div class="w-10 h-10 bg-primary/20 rounded-xl animate-pulse" />
      </div>
    </div>
    
    <!-- Header Skeleton -->
    <div v-else-if="variant === 'header'" class="header-skeleton">
      <div class="flex items-center justify-between p-4 border-b border-border/20">
        <div class="flex items-center gap-3">
          <div class="w-6 h-6 bg-muted/40 rounded-lg animate-pulse" />
          <div class="skeleton-line h-5 bg-muted/40 rounded w-48 animate-pulse" />
        </div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-muted/40 rounded-xl animate-pulse" />
          <div class="w-8 h-8 bg-muted/40 rounded-xl animate-pulse" />
          <div class="w-8 h-8 bg-muted/40 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
    
    <!-- Generic Skeleton -->
    <div v-else class="generic-skeleton space-y-2">
      <div v-for="i in count" :key="i" class="skeleton-line bg-muted/40 animate-pulse" :class="getRandomWidth()" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'message' | 'chat-list' | 'input' | 'header' | 'generic'
  size?: 'sm' | 'md' | 'lg'
  count?: number
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'generic',
  size: 'md',
  count: 3,
  className: ''
})

const getRandomWidth = () => {
  const widths = ['w-full', 'w-3/4', 'w-2/3', 'w-1/2', 'w-5/6']
  return widths[Math.floor(Math.random() * widths.length)]
}
</script>

<style scoped>
.skeleton-loader {
  /* Base styles */
}

.skeleton-line {
  background: linear-gradient(
    90deg,
    hsl(var(--muted) / 0.4) 0%,
    hsl(var(--muted) / 0.6) 50%,
    hsl(var(--muted) / 0.4) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

/* Size variants */
.sm .skeleton-line {
  height: 0.75rem; /* 12px */
}

.md .skeleton-line {
  height: 1rem; /* 16px */
}

.lg .skeleton-line {
  height: 1.25rem; /* 20px */
}

/* Shimmer animation */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Pulse animation for circular elements */
@keyframes pulse {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.6;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Message skeleton specific styles */
.message-skeleton {
  animation: slideInUp 0.3s ease-out;
  animation-fill-mode: both;
}

.message-skeleton:nth-child(1) { animation-delay: 0ms; }
.message-skeleton:nth-child(2) { animation-delay: 100ms; }
.message-skeleton:nth-child(3) { animation-delay: 200ms; }
.message-skeleton:nth-child(4) { animation-delay: 300ms; }
.message-skeleton:nth-child(5) { animation-delay: 400ms; }

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Chat list skeleton specific styles */
.chat-skeleton {
  animation: slideInRight 0.3s ease-out;
  animation-fill-mode: both;
}

.chat-skeleton:nth-child(1) { animation-delay: 0ms; }
.chat-skeleton:nth-child(2) { animation-delay: 150ms; }
.chat-skeleton:nth-child(3) { animation-delay: 300ms; }
.chat-skeleton:nth-child(4) { animation-delay: 450ms; }
.chat-skeleton:nth-child(5) { animation-delay: 600ms; }

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Responsive improvements */
@media (max-width: 768px) {
  .message-skeleton .w-8 {
    width: 1.5rem;
    height: 1.5rem;
  }
  
  .skeleton-line {
    height: 0.875rem;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .skeleton-line {
    animation: none;
    background: hsl(var(--muted) / 0.4);
  }
  
  .animate-pulse {
    animation: none;
    opacity: 0.5;
  }
  
  .message-skeleton,
  .chat-skeleton {
    animation: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .skeleton-line {
    background: hsl(var(--muted) / 0.8);
  }
}
</style>