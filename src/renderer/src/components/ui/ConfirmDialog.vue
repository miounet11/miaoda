<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-black/20 backdrop-blur-sm"
      @click="handleCancel"
    />
    
    <!-- Dialog -->
    <div class="relative w-full max-w-md bg-background rounded-lg shadow-xl border border-border overflow-hidden">
      <!-- Header -->
      <div class="p-6 pb-4">
        <div class="flex items-start gap-4">
          <!-- Icon -->
          <div 
            class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
            :class="iconClasses"
          >
            <component :is="iconComponent" :size="20" />
          </div>
          
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-foreground mb-2">
              {{ title }}
            </h3>
            <div class="text-muted-foreground">
              <p v-if="typeof message === 'string'">{{ message }}</p>
              <div v-else v-html="message" />
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 p-6 pt-2 bg-muted/20 border-t border-border">
        <button
          type="button"
          @click="handleCancel"
          class="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
        >
          {{ cancelText }}
        </button>
        <button
          type="button"
          @click="handleConfirm"
          :disabled="loading"
          class="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :class="confirmButtonClasses"
        >
          <Loader2 v-if="loading" :size="16" class="animate-spin" />
          <span>{{ confirmText }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, Trash2, Info, CheckCircle, Loader2 } from 'lucide-vue-next'

interface Props {
  isOpen?: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning' | 'info' | 'success'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'default',
  loading: false
})

const emit = defineEmits<{
  'confirm': []
  'cancel': []
}>()

// Variant configurations
const variantConfig = {
  default: {
    icon: Info,
    iconClasses: 'bg-blue-500/10 text-blue-600',
    buttonClasses: 'bg-primary text-primary-foreground hover:bg-primary/90'
  },
  destructive: {
    icon: Trash2,
    iconClasses: 'bg-red-500/10 text-red-600',
    buttonClasses: 'bg-red-600 text-white hover:bg-red-700'
  },
  warning: {
    icon: AlertTriangle,
    iconClasses: 'bg-yellow-500/10 text-yellow-600',
    buttonClasses: 'bg-yellow-600 text-white hover:bg-yellow-700'
  },
  info: {
    icon: Info,
    iconClasses: 'bg-blue-500/10 text-blue-600',
    buttonClasses: 'bg-blue-600 text-white hover:bg-blue-700'
  },
  success: {
    icon: CheckCircle,
    iconClasses: 'bg-green-500/10 text-green-600',
    buttonClasses: 'bg-green-600 text-white hover:bg-green-700'
  }
}

// Computed properties
const config = computed(() => variantConfig[props.variant])
const iconComponent = computed(() => config.value.icon)
const iconClasses = computed(() => config.value.iconClasses)
const confirmButtonClasses = computed(() => config.value.buttonClasses)

// Methods
const handleConfirm = () => {
  if (!props.loading) {
    emit('confirm')
  }
}

const handleCancel = () => {
  if (!props.loading) {
    emit('cancel')
  }
}
</script>

<style scoped>
/* Modal animations */
.fixed.inset-0 {
  animation: modal-fade-in 0.2s ease-out;
}

@keyframes modal-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.relative.w-full {
  animation: modal-slide-in 0.2s ease-out;
}

@keyframes modal-slide-in {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Focus improvements */
button:focus-visible {
  outline: 2px solid rgba(var(--primary-rgb), 0.6);
  outline-offset: 2px;
}

/* Mobile responsive */
@media (max-width: 640px) {
  .relative.w-full {
    margin: 1rem;
    max-width: calc(100% - 2rem);
  }
  
  .p-6 {
    padding: 1rem;
  }
  
  .gap-4 {
    gap: 0.75rem;
  }
}

/* Backdrop click prevention during loading */
.fixed.inset-0[data-loading="true"] {
  pointer-events: none;
}
</style>