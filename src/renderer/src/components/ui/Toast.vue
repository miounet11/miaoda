<template>
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="visible"
        class="toast fixed top-4 right-4 z-[100] max-w-sm w-full"
      >
        <div
          class="toast-content bg-background border border-border rounded-lg shadow-lg p-4 backdrop-blur-sm"
          :class="typeClasses"
        >
          <div class="flex items-start gap-3">
            <!-- Icon -->
            <div class="flex-shrink-0 mt-0.5">
              <Check v-if="type === 'success'" :size="18" class="text-green-600" />
              <AlertCircle v-else-if="type === 'error'" :size="18" class="text-red-600" />
              <Info v-else-if="type === 'info'" :size="18" class="text-blue-600" />
              <AlertTriangle v-else-if="type === 'warning'" :size="18" class="text-yellow-600" />
            </div>
            
            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div v-if="title" class="font-medium text-sm mb-1">{{ title }}</div>
              <div class="text-sm text-muted-foreground">{{ message }}</div>
            </div>
            
            <!-- Close button -->
            <button
              v-if="dismissible"
              @click="hide"
              class="flex-shrink-0 p-1 hover:bg-muted rounded-md transition-colors"
            >
              <X :size="14" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Check, AlertCircle, Info, AlertTriangle, X } from 'lucide-vue-next'

interface Props {
  type?: 'success' | 'error' | 'info' | 'warning'
  title?: string
  message: string
  duration?: number
  dismissible?: boolean
  show?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 4000,
  dismissible: true,
  show: false
})

const emit = defineEmits<{
  'hidden': []
}>()

const visible = ref(false)
let timeoutId: NodeJS.Timeout | null = null

const typeClasses = {
  'border-green-500/20 bg-green-500/5': props.type === 'success',
  'border-red-500/20 bg-red-500/5': props.type === 'error',
  'border-blue-500/20 bg-blue-500/5': props.type === 'info',
  'border-yellow-500/20 bg-yellow-500/5': props.type === 'warning'
}

const show = () => {
  visible.value = true
  
  if (props.duration > 0) {
    timeoutId = setTimeout(() => {
      hide()
    }, props.duration)
  }
}

const hide = () => {
  visible.value = false
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
  emit('hidden')
}

// Watch for show prop changes
watch(() => props.show, (newValue) => {
  if (newValue) {
    show()
  } else {
    hide()
  }
})

// Auto-show when mounted if show prop is true
onMounted(() => {
  if (props.show) {
    show()
  }
})

defineExpose({
  show,
  hide
})
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) translateY(-8px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) translateY(-8px) scale(0.95);
}

.toast-content {
  background: rgba(var(--background-rgb), 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(var(--border-rgb), 0.5);
}

/* Animation for content */
.toast-enter-active .toast-content {
  animation: slideInFromRight 0.3s ease;
}

@keyframes slideInFromRight {
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Dark mode compatibility */
@media (prefers-color-scheme: dark) {
  .toast-content {
    background: rgba(15, 23, 42, 0.95);
    border-color: rgba(51, 65, 85, 0.5);
  }
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .toast {
    left: 1rem;
    right: 1rem;
    max-width: none;
  }
}
</style>