<template>
  <div class="message-skeleton flex gap-3">
    <div class="skeleton-avatar"></div>
    <div class="skeleton-content flex-1">
      <div class="skeleton-line w-3/4"></div>
      <div class="skeleton-line w-1/2"></div>
      <div class="skeleton-line w-5/6"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
// MessageSkeleton component for loading state
</script>

<style scoped>
.message-skeleton {
  padding: 1rem;
  animation: fadeIn 0.3s ease-out;
}

.skeleton-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  flex-shrink: 0;
}

.skeleton-content {
  padding-top: 4px;
}

.skeleton-line {
  height: 16px;
  margin-bottom: 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-line:last-child {
  margin-bottom: 0;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
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

/* Dark theme support */
:root[data-theme="dark"] .skeleton-avatar,
:root[data-theme="dark"] .skeleton-line {
  background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
  background-size: 200% 100%;
}
</style>