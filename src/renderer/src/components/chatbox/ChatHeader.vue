<template>
  <div class="chat-header">
    <button @click="$emit('toggle-sidebar')" class="sidebar-toggle">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M3 5h14M3 10h14M3 15h14"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
    </button>

    <div class="header-content">
      <h1 class="header-title">{{ title }}</h1>
      <div class="header-info" v-if="subtitle">
        <span class="info-text">{{ subtitle }}</span>
      </div>
    </div>

    <div class="header-actions">
      <button class="action-button" title="Share">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M13.5 11.5v3a1 1 0 01-1 1h-9a1 1 0 01-1-1v-9a1 1 0 011-1h3"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <path
            d="M7 11L15 3M15 3h-5M15 3v5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <button class="action-button" title="Settings">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="1.5" stroke="currentColor" stroke-width="1.5" />
          <path
            d="M9 3.5v-1M9 15.5v-1M14.5 9h1M2.5 9h1M13.2 4.8l.7-.7M4.1 13.9l.7-.7M13.2 13.2l.7.7M4.1 4.1l.7.7"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()

defineEmits<{
  'toggle-sidebar': []
}>()
</script>

<style scoped>
.chat-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--chatbox-bg-primary);
  border-bottom: 1px solid var(--chatbox-border);
  height: 56px;
}

.sidebar-toggle {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--chatbox-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 12px;
}

.sidebar-toggle:hover {
  background: var(--chatbox-bg-secondary);
  color: var(--chatbox-text-primary);
}

.header-content {
  flex: 1;
  min-width: 0;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--chatbox-text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.info-text {
  font-size: 12px;
  color: var(--chatbox-text-tertiary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--chatbox-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover {
  background: var(--chatbox-bg-secondary);
  color: var(--chatbox-text-primary);
}

@media (max-width: 640px) {
  .header-info {
    display: none;
  }
}
</style>
