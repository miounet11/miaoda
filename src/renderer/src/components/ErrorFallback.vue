<template>
  <div class="h-screen flex items-center justify-center bg-background">
    <div class="text-center p-8 max-w-md">
      <div class="mb-6">
        <AlertCircle :size="64" class="mx-auto text-red-500" />
      </div>
      <h1 class="text-2xl font-bold mb-4">Application Error</h1>
      <p class="text-muted-foreground mb-6">
        {{ error || 'An unexpected error occurred. The application may not function properly.' }}
      </p>
      <div class="space-y-3">
        <button
          @click="reload"
          class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Reload Application
        </button>
        <button
          @click="reset"
          class="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90"
        >
          Reset and Restart
        </button>
      </div>
      <div v-if="details" class="mt-6 p-4 bg-muted rounded-lg text-left">
        <p class="text-xs font-mono text-muted-foreground">{{ details }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'

interface Props {
  error?: string
  details?: string
}

defineProps<Props>()

const reload = () => {
  window.location.reload()
}

const reset = () => {
  // Clear all localStorage
  localStorage.clear()
  // Clear all sessionStorage
  sessionStorage.clear()
  // Reload
  window.location.reload()
}
</script>