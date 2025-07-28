<template>
  <div class="app-container h-screen flex flex-col bg-background">
    <!-- Title bar for Windows/Linux -->
    <div v-if="!isMac" class="title-bar h-8 bg-background border-b flex items-center px-4">
      <span class="text-sm font-medium">MiaoDa Chat</span>
    </div>
    
    <!-- Main content -->
    <div class="flex-1 overflow-hidden">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isMac = computed(() => navigator.platform.toLowerCase().includes('mac'))

// Setup global shortcuts
onMounted(() => {
  window.api.shortcuts.on((action: string) => {
    switch (action) {
      case 'new-chat':
        // Emit event for chat view to handle
        window.dispatchEvent(new CustomEvent('app:new-chat'))
        break
      case 'open-settings':
        router.push('/settings')
        break
      case 'focus-input':
        window.dispatchEvent(new CustomEvent('app:focus-input'))
        break
      case 'clear-chat':
        window.dispatchEvent(new CustomEvent('app:clear-chat'))
        break
      case 'prev-chat':
        window.dispatchEvent(new CustomEvent('app:prev-chat'))
        break
      case 'next-chat':
        window.dispatchEvent(new CustomEvent('app:next-chat'))
        break
    }
  })
})
</script>

<style>
.app-container {
  -webkit-app-region: drag;
}

.app-container * {
  -webkit-app-region: no-drag;
}

.title-bar {
  -webkit-app-region: drag;
}
</style>