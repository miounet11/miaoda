<template>
  <Teleport to="body">
    <div class="toast-container fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
      <TransitionGroup name="toast-list" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast-item pointer-events-auto"
        >
          <div
            class="toast-content bg-background border border-border rounded-lg shadow-lg p-4 backdrop-blur-sm max-w-sm"
            :class="getTypeClasses(toast.type)"
          >
            <div class="flex items-start gap-3">
              <!-- Icon -->
              <div class="flex-shrink-0 mt-0.5">
                <Check v-if="toast.type === 'success'" :size="18" class="text-green-600" />
                <AlertCircle v-else-if="toast.type === 'error'" :size="18" class="text-red-600" />
                <Info v-else-if="toast.type === 'info'" :size="18" class="text-blue-600" />
                <AlertTriangle v-else-if="toast.type === 'warning'" :size="18" class="text-yellow-600" />
              </div>
              
              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div v-if="toast.title" class="font-medium text-sm mb-1">{{ toast.title }}</div>
                <div class="text-sm text-muted-foreground">{{ toast.message }}</div>
              </div>
              
              <!-- Close button -->
              <button
                v-if="toast.dismissible"
                @click="hideToast(toast.id)"
                class="flex-shrink-0 p-1 hover:bg-muted rounded-md transition-colors"
              >
                <X :size="14" />
              </button>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check, AlertCircle, Info, AlertTriangle, X } from 'lucide-vue-next'
import { toastService } from '@renderer/src/services/ui/ToastService'

const toasts = computed(() => toastService.getToasts().value)

const getTypeClasses = (type?: string) => {
  return {
    'border-green-500/20 bg-green-500/5': type === 'success',
    'border-red-500/20 bg-red-500/5': type === 'error',
    'border-blue-500/20 bg-blue-500/5': type === 'info',
    'border-yellow-500/20 bg-yellow-500/5': type === 'warning'
  }
}

const hideToast = (id: string) => {
  toastService.hide(id)
}
</script>

<style scoped>
.toast-container {
  max-width: 400px;
}

.toast-content {
  background: rgba(var(--background-rgb), 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(var(--border-rgb), 0.5);
}

/* List transition animations */
.toast-list-enter-active {
  transition: all 0.3s ease;
}

.toast-list-leave-active {
  transition: all 0.3s ease;
}

.toast-list-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-list-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-list-move {
  transition: transform 0.3s ease;
}

/* Individual toast animations */
.toast-item {
  animation: slideInFromRight 0.3s ease;
}

@keyframes slideInFromRight {
  from {
    transform: translateX(100%) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateX(0) scale(1);
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
  .toast-container {
    left: 1rem;
    right: 1rem;
    max-width: none;
  }
  
  .toast-content {
    max-width: none;
  }
}

/* Hover effects */
.toast-item:hover .toast-content {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Focus states for accessibility */
.toast-content button:focus {
  outline: none;
  ring: 2px;
  ring-color: rgba(var(--primary-rgb), 0.3);
}
</style>