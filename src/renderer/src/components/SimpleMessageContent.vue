<template>
  <div class="simple-message-content">
    <!-- 直接显示内容，不做任何处理 -->
    <div class="whitespace-pre-wrap break-words">{{ content || '' }}</div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  content: string
}

defineProps<Props>()
</script>

<style scoped>
.simple-message-content {
  /* Ensure text is always visible */
  color: inherit;
  width: 100%;
}

.whitespace-pre-wrap {
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
</style>