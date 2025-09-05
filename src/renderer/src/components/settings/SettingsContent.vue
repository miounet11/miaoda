<template>
  <div class="chatbox-settings-content h-full" style="background: rgb(16, 16, 20)">
    <div class="chatbox-content-container">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
// This is a simple wrapper component that provides consistent
// styling and layout for all settings panels
</script>

<style scoped>
/* ChatBox Settings Content - Exact Styling */
.chatbox-settings-content {
  min-height: 100%;
  background: rgb(16, 16, 20);
  flex: 1 1 80%;
}

.chatbox-content-container {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Typography with ChatBox colors - More Compact */
.chatbox-settings-content :deep(h1) {
  font-size: 1rem;
  font-weight: 600;
  color: var(--mantine-color-chatbox-primary-text);
  margin-bottom: 0.75rem;
}

.chatbox-settings-content :deep(h2) {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--mantine-color-chatbox-primary-text);
  margin-bottom: 0.5rem;
}

.chatbox-settings-content :deep(h3) {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--mantine-color-chatbox-primary-text);
  margin-bottom: 0.375rem;
}

.chatbox-settings-content :deep(p) {
  font-size: 0.75rem;
  color: var(--mantine-color-chatbox-secondary-text);
  line-height: 1.4;
}

.chatbox-settings-content :deep(label) {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--mantine-color-chatbox-primary-text);
}

/* Form elements with ChatBox styling - More Compact */
.chatbox-settings-content :deep(input[type='text']),
.chatbox-settings-content :deep(input[type='password']),
.chatbox-settings-content :deep(input[type='email']),
.chatbox-settings-content :deep(select),
.chatbox-settings-content :deep(textarea) {
  display: block;
  width: 100%;
  max-width: 280px;
  height: 28px;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.375rem;
  font-size: 0.75rem;
  color: var(--mantine-color-chatbox-primary-text);
  transition: all 0.15s ease;
}

.chatbox-settings-content :deep(textarea) {
  height: auto;
  min-height: 60px;
}

.chatbox-settings-content :deep(input[type='text']:focus),
.chatbox-settings-content :deep(input[type='password']:focus),
.chatbox-settings-content :deep(input[type='email']:focus),
.chatbox-settings-content :deep(select:focus),
.chatbox-settings-content :deep(textarea:focus) {
  outline: none;
  border-color: var(--mantine-color-chatbox-brand-filled);
  box-shadow: 0 0 0 2px var(--mantine-color-chatbox-brand-outline-hover);
}

.chatbox-settings-content :deep(input[type='checkbox']) {
  width: 14px;
  height: 14px;
  accent-color: var(--mantine-color-chatbox-brand-filled);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.25rem;
}

.chatbox-settings-content :deep(input[type='radio']) {
  width: 14px;
  height: 14px;
  accent-color: var(--mantine-color-chatbox-brand-filled);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
}

/* Button styling with ChatBox design - More Compact */
.chatbox-settings-content :deep(.btn) {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border: 1px solid transparent;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s ease;
  height: 28px;
}

.chatbox-settings-content :deep(.btn-primary) {
  background: var(--mantine-color-chatbox-brand-filled);
  color: white;
}

.chatbox-settings-content :deep(.btn-primary:hover) {
  background: var(--mantine-color-chatbox-brand-filled-hover);
}

.chatbox-settings-content :deep(.btn-outline) {
  background: transparent;
  color: var(--mantine-color-chatbox-primary-text);
  border-color: var(--mantine-color-chatbox-border-primary-outline);
}

.chatbox-settings-content :deep(.btn-outline:hover) {
  background: var(--mantine-color-chatbox-brand-outline-hover);
}

/* Settings sections - More Compact */
.chatbox-settings-content :deep(.settings-section) {
  margin-bottom: 1rem;
}

.chatbox-settings-content :deep(.settings-group) {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
}

.chatbox-settings-content :deep(.settings-item) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.chatbox-settings-content :deep(.settings-item-label) {
  flex: 1;
  font-size: 0.75rem;
  color: var(--mantine-color-chatbox-primary-text);
}

.chatbox-settings-content :deep(.settings-item-description) {
  font-size: 0.6875rem;
  color: var(--mantine-color-chatbox-secondary-text);
  margin-top: 0.25rem;
}

/* Alert/Info boxes - More Compact */
.chatbox-settings-content :deep(.alert),
.chatbox-settings-content :deep(.info-box) {
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  line-height: 1.4;
}

.chatbox-settings-content :deep(.alert-info) {
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.chatbox-settings-content :deep(.alert-warning) {
  background: rgba(251, 146, 60, 0.1);
  color: #fb923c;
  border: 1px solid rgba(251, 146, 60, 0.3);
}

.chatbox-settings-content :deep(.alert-error) {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

/* Slider inputs - More Compact */
.chatbox-settings-content :deep(input[type='range']) {
  width: 100%;
  height: 4px;
  background: var(--mantine-color-chatbox-border-primary-outline);
  outline: none;
  -webkit-appearance: none;
  border-radius: 2px;
}

.chatbox-settings-content :deep(input[type='range']::-webkit-slider-thumb) {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--mantine-color-chatbox-brand-filled);
  cursor: pointer;
  border-radius: 50%;
  border: 2px solid rgb(16, 16, 20);
}

.chatbox-settings-content :deep(input[type='range']::-webkit-slider-thumb:hover) {
  background: var(--mantine-color-chatbox-brand-filled-hover);
}

/* Spacing utilities - More Compact */
.chatbox-settings-content :deep(.mb-1) {
  margin-bottom: 0.25rem;
}
.chatbox-settings-content :deep(.mb-2) {
  margin-bottom: 0.5rem;
}
.chatbox-settings-content :deep(.mb-3) {
  margin-bottom: 0.75rem;
}
.chatbox-settings-content :deep(.mb-4) {
  margin-bottom: 1rem;
}
.chatbox-settings-content :deep(.mt-1) {
  margin-top: 0.25rem;
}
.chatbox-settings-content :deep(.mt-2) {
  margin-top: 0.5rem;
}
.chatbox-settings-content :deep(.mt-3) {
  margin-top: 0.75rem;
}
.chatbox-settings-content :deep(.mt-4) {
  margin-top: 1rem;
}
</style>