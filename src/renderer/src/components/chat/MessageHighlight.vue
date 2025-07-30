<template>
  <div 
    class="message-highlight"
    :class="highlightClasses"
    :data-message-id="messageId"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue'

// Props
interface Props {
  messageId: string
  highlightedMessageId?: string
  searchQuery?: string
  autoScroll?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  highlightedMessageId: '',
  searchQuery: '',
  autoScroll: true
})

// Computed
const isHighlighted = computed(() => {
  return props.highlightedMessageId === props.messageId
})

const highlightClasses = computed(() => ({
  'message-highlighted': isHighlighted.value,
  'message-search-match': props.searchQuery && isHighlighted.value
}))

// Methods
const scrollToMessage = () => {
  if (isHighlighted.value && props.autoScroll) {
    const element = document.querySelector(`[data-message-id="${props.messageId}"]`)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }
}

// Watch for highlight changes
watch(() => props.highlightedMessageId, () => {
  if (isHighlighted.value) {
    // Small delay to ensure DOM is updated
    setTimeout(scrollToMessage, 100)
  }
})

// Mount/unmount
onMounted(() => {
  if (isHighlighted.value) {
    setTimeout(scrollToMessage, 100)
  }
})
</script>

<style scoped>
.message-highlight {
  @apply transition-all duration-300 ease-in-out;
}

.message-highlighted {
  @apply ring-2 ring-primary/50 bg-primary/5 rounded-lg;
  animation: highlightPulse 1s ease-in-out;
}

.message-search-match {
  @apply ring-blue-500/50 bg-blue-50 dark:bg-blue-950/20;
}

/* Highlight animation */
@keyframes highlightPulse {
  0% {
    background-color: rgba(var(--primary), 0.2);
    transform: scale(1);
  }
  50% {
    background-color: rgba(var(--primary), 0.1);
    transform: scale(1.02);
  }
  100% {
    background-color: rgba(var(--primary), 0.05);
    transform: scale(1);
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .message-highlight {
    transition: none;
  }
  
  .message-highlighted {
    animation: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .message-highlighted {
    @apply ring-4 border-2 border-primary;
  }
}
</style>