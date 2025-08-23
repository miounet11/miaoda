<template>
  <div class="plugin-card" :class="cardClasses">
    <!-- Plugin Icon and Basic Info -->
    <div class="card-header">
      <div class="plugin-icon">
        <img
          v-if="plugin.manifest.icon"
          :src="plugin.manifest.icon"
          :alt="plugin.manifest.name"
          class="icon-image"
        />
        <Puzzle v-else :size="32" class="icon-default" />
      </div>

      <div class="plugin-info">
        <h3 class="plugin-name">{{ plugin.manifest.name }}</h3>
        <p class="plugin-version">v{{ plugin.manifest.version }}</p>
        <p class="plugin-author">{{ $t('plugin.by') }} {{ plugin.manifest.author }}</p>
      </div>

      <div class="card-actions">
        <button
          @click="$emit('toggle', plugin)"
          class="toggle-btn"
          :class="{ enabled: plugin.enabled }"
          :title="plugin.enabled ? $t('plugin.disable') : $t('plugin.enable')"
        >
          <Power :size="16" />
        </button>

        <div class="action-menu">
          <button @click="showActions = !showActions" class="menu-trigger">
            <MoreVertical :size="16" />
          </button>

          <div v-if="showActions" class="action-dropdown">
            <button @click="$emit('view-details', plugin)" class="action-item">
              <Info :size="14" />
              {{ $t('plugin.viewDetails') }}
            </button>

            <button v-if="hasSettings" @click="$emit('configure', plugin)" class="action-item">
              <Settings :size="14" />
              {{ $t('plugin.configure') }}
            </button>

            <button v-if="hasUpdate" @click="$emit('update', plugin)" class="action-item">
              <Download :size="14" />
              {{ $t('plugin.update') }}
            </button>

            <div class="action-divider" />

            <button @click="$emit('uninstall', plugin)" class="action-item danger">
              <Trash2 :size="14" />
              {{ $t('plugin.uninstall') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Plugin Description -->
    <div class="card-body">
      <p class="plugin-description">{{ plugin.manifest.description }}</p>

      <!-- Keywords/Tags -->
      <div
        v-if="plugin.manifest.keywords && plugin.manifest.keywords.length > 0"
        class="plugin-keywords"
      >
        <span
          v-for="keyword in plugin.manifest.keywords.slice(0, 3)"
          :key="keyword"
          class="keyword-tag"
        >
          {{ keyword }}
        </span>
        <span v-if="plugin.manifest.keywords.length > 3" class="keyword-more">
          +{{ plugin.manifest.keywords.length - 3 }}
        </span>
      </div>
    </div>

    <!-- Plugin Status and Meta -->
    <div class="card-footer">
      <div class="status-indicators">
        <div class="status-item" :class="statusClass">
          <div class="status-dot" />
          <span class="status-text">{{ statusText }}</span>
        </div>

        <div v-if="plugin.error" class="error-indicator" :title="plugin.error">
          <AlertTriangle :size="14" />
        </div>

        <div class="category-badge" :class="categoryClass">
          <component :is="categoryIcon" :size="12" />
          {{ $t(`plugin.category.${plugin.manifest.category}`) }}
        </div>
      </div>

      <div class="meta-info">
        <span v-if="plugin.manifest.license" class="license">
          {{ plugin.manifest.license }}
        </span>

        <span class="permissions-count" :title="permissionsTitle">
          <Shield :size="12" />
          {{ plugin.manifest.requiredPermissions.length }}
        </span>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <Loader :size="24" class="animate-spin" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Puzzle,
  Power,
  MoreVertical,
  Info,
  Settings,
  Download,
  Trash2,
  AlertTriangle,
  Shield,
  Loader,
  Code,
  Gamepad2,
  Wrench,
  BookOpen,
  Users,
  Palette,
  Zap,
  Globe
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import type { PluginInstance, PluginCategory } from '@renderer/src/services/plugin/PluginManager'

// Props
interface Props {
  plugin: PluginInstance
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  toggle: [plugin: PluginInstance]
  configure: [plugin: PluginInstance]
  uninstall: [plugin: PluginInstance]
  update: [plugin: PluginInstance]
  'view-details': [plugin: PluginInstance]
}>()

// Composables
const { t } = useI18n()

// State
const showActions = ref(false)
const isLoading = ref(false)

// Computed
const cardClasses = computed(() => ({
  'plugin-enabled': props.plugin.enabled,
  'plugin-disabled': !props.plugin.enabled,
  'plugin-error': !!props.plugin.error,
  'plugin-loading': isLoading.value
}))

const statusClass = computed(() => ({
  'status-enabled': props.plugin.enabled && !props.plugin.error,
  'status-disabled': !props.plugin.enabled && !props.plugin.error,
  'status-error': !!props.plugin.error
}))

const statusText = computed(() => {
  if (props.plugin.error) {
    return t('plugin.status.error')
  }
  return props.plugin.enabled ? t('plugin.status.enabled') : t('plugin.status.disabled')
})

const categoryClass = computed(() => `category-${props.plugin.manifest.category}`)

const categoryIcon = computed(() => {
  const iconMap: Record<PluginCategory, any> = {
    productivity: Wrench,
    entertainment: Gamepad2,
    utility: Zap,
    development: Code,
    education: BookOpen,
    social: Users,
    customization: Palette,
    integration: Globe
  }
  return iconMap[props.plugin.manifest.category] || Puzzle
})

const hasSettings = computed(() => {
  return props.plugin.manifest.settings && props.plugin.manifest.settings.length > 0
})

const hasUpdate = computed(() => {
  // TODO: Implement update checking
  return false
})

const permissionsTitle = computed(() => {
  return props.plugin.manifest.requiredPermissions.join(', ')
})

// Methods
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Element
  if (!target.closest('.action-menu')) {
    showActions.value = false
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.plugin-card {
  @apply relative bg-background border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200;
}

.plugin-enabled {
  @apply border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20;
}

.plugin-disabled {
  @apply border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-950/20;
}

.plugin-error {
  @apply border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20;
}

.plugin-loading {
  @apply pointer-events-none;
}

.card-header {
  @apply flex items-start gap-3 mb-3;
}

.plugin-icon {
  @apply flex-shrink-0;
}

.icon-image {
  @apply w-8 h-8 rounded-md object-cover;
}

.icon-default {
  @apply text-muted-foreground;
}

.plugin-info {
  @apply flex-1 min-w-0;
}

.plugin-name {
  @apply font-semibold text-base truncate;
}

.plugin-version {
  @apply text-xs text-muted-foreground;
}

.plugin-author {
  @apply text-xs text-muted-foreground truncate;
}

.card-actions {
  @apply flex items-start gap-1;
}

.toggle-btn {
  @apply p-2 rounded-md border border-border hover:bg-accent transition-colors;
}

.toggle-btn.enabled {
  @apply bg-green-500 text-white border-green-500 hover:bg-green-600;
}

.action-menu {
  @apply relative;
}

.menu-trigger {
  @apply p-2 rounded-md hover:bg-accent transition-colors;
}

.action-dropdown {
  @apply absolute right-0 top-full mt-1 bg-background border border-border rounded-md shadow-lg z-10 min-w-40;
}

.action-item {
  @apply w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left;
}

.action-item.danger {
  @apply text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20;
}

.action-divider {
  @apply border-t border-border my-1;
}

.card-body {
  @apply mb-4;
}

.plugin-description {
  @apply text-sm text-muted-foreground mb-3 line-clamp-2;
}

.plugin-keywords {
  @apply flex items-center gap-1 flex-wrap;
}

.keyword-tag {
  @apply px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full;
}

.keyword-more {
  @apply text-xs text-muted-foreground;
}

.card-footer {
  @apply flex items-center justify-between;
}

.status-indicators {
  @apply flex items-center gap-2;
}

.status-item {
  @apply flex items-center gap-1.5 text-xs;
}

.status-dot {
  @apply w-2 h-2 rounded-full;
}

.status-enabled .status-dot {
  @apply bg-green-500;
}

.status-disabled .status-dot {
  @apply bg-gray-400;
}

.status-error .status-dot {
  @apply bg-red-500;
}

.status-enabled .status-text {
  @apply text-green-600 dark:text-green-400;
}

.status-disabled .status-text {
  @apply text-gray-600 dark:text-gray-400;
}

.status-error .status-text {
  @apply text-red-600 dark:text-red-400;
}

.error-indicator {
  @apply text-red-500;
}

.category-badge {
  @apply flex items-center gap-1 px-2 py-1 rounded-full text-xs;
}

.category-productivity {
  @apply bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300;
}

.category-entertainment {
  @apply bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300;
}

.category-utility {
  @apply bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300;
}

.category-development {
  @apply bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300;
}

.category-education {
  @apply bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300;
}

.category-social {
  @apply bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300;
}

.category-customization {
  @apply bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300;
}

.category-integration {
  @apply bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300;
}

.meta-info {
  @apply flex items-center gap-2 text-xs text-muted-foreground;
}

.permissions-count {
  @apply flex items-center gap-1;
}

.loading-overlay {
  @apply absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .plugin-card {
    @apply border-2;
  }

  .toggle-btn:focus {
    @apply ring-2 ring-primary;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .plugin-card {
    @apply p-3;
  }

  .card-header {
    @apply gap-2;
  }

  .plugin-keywords {
    @apply hidden;
  }

  .card-footer {
    @apply flex-col items-start gap-2;
  }
}
</style>
