<template>
  <div class="typing-indicator flex items-center gap-2 px-4 py-2">
    <div class="flex items-center gap-1">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
    <span class="text-sm text-muted-foreground">{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message?: string
}

withDefaults(defineProps<Props>(), {
  message: 'AI is typing...'
})
</script>

<style scoped>
.typing-indicator {
  animation: fadeIn 0.3s ease-out;
}

.typing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--primary);
  opacity: 0.3;
  animation: typing 1.4s infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  30% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Theme variables */
:root {
  --primary: hsl(221, 83%, 53%);
}

:root[data-theme="dark"] {
  --primary: hsl(221, 83%, 65%);
}
</style>