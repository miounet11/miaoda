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
import { computed } from 'vue'

const isMac = computed(() => navigator.platform.toLowerCase().includes('mac'))
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